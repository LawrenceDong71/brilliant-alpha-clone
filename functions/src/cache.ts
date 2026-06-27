import { getFirestore, FieldValue, type DocumentData } from 'firebase-admin/firestore'
import OpenAI from 'openai'

/**
 * Semantic Firestore cache for AI-generated activities.
 *
 * Goal: never regenerate an activity for a scenario we have seen before — even
 * when it is worded differently ("a 10 m ladder leaning against a wall" vs
 * "ladder leaning against a wall"). We do this in two layers:
 *   1. Exact match on a normalized scenario string (fast, no embedding call).
 *   2. Semantic match: embed the scenario and compare (cosine) against recently
 *      cached entries; a similarity at/above the threshold counts as the same.
 *
 * Every operation is best-effort: if Firestore or embeddings are unavailable
 * (e.g. running the functions emulator without the Firestore emulator), the
 * helpers behave like a cache miss so the core feature never breaks.
 */

const EMBED_MODEL = 'text-embedding-3-small'

/** Cosine similarity at/above this counts as the "same" scenario. Tunable. */
const SIMILARITY_THRESHOLD = Number(process.env.CACHE_SIMILARITY_THRESHOLD ?? '0.83')

/** How many recent entries to scan in-memory for a semantic match. */
const SCAN_LIMIT = Number(process.env.CACHE_SCAN_LIMIT ?? '300')

/** Collapse trivial wording differences (case, surrounding/interior whitespace). */
export function normalizeScenario(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function cosine(a: number[], b: number[]): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

/** Embed a scenario; returns null on any failure (treated as "no semantic match"). */
async function embed(openaiKey: string, text: string): Promise<number[] | null> {
  try {
    const client = new OpenAI({ apiKey: openaiKey })
    const r = await client.embeddings.create({ model: EMBED_MODEL, input: text })
    return r.data[0]?.embedding ?? null
  } catch {
    return null
  }
}

export interface CacheLookup<T> {
  hit: boolean
  result?: T
  /** The query embedding, reused by saveCache on a miss so we don't embed twice. */
  embedding: number[] | null
  similarity?: number
  matchedScenario?: string
}

/**
 * Look for a cached activity matching `scenario` (exact-normalized, then
 * semantic). On a miss, the returned `embedding` should be passed to saveCache
 * so the new entry is stored with its vector (and we avoid embedding twice).
 */
export async function lookupCache<T>(
  collection: string,
  scenario: string,
  openaiKey: string,
): Promise<CacheLookup<T>> {
  const normalized = normalizeScenario(scenario)
  try {
    const db = getFirestore()

    // 1) Exact (normalized) fast path — identical wording, no embedding needed.
    const exact = await db.collection(collection).where('normalized', '==', normalized).limit(1).get()
    if (!exact.empty) {
      const d = exact.docs[0].data()
      return {
        hit: true,
        result: d.result as T,
        embedding: (d.embedding as number[] | undefined) ?? null,
        similarity: 1,
        matchedScenario: d.scenario as string,
      }
    }

    // 2) Semantic match — embed and compare against recent entries in-memory.
    const embedding = await embed(openaiKey, normalized)
    if (!embedding) return { hit: false, embedding: null }

    const snap = await db.collection(collection).orderBy('createdAt', 'desc').limit(SCAN_LIMIT).get()
    let best: { sim: number; data: DocumentData } | null = null
    for (const doc of snap.docs) {
      const data = doc.data()
      const emb = data.embedding as number[] | undefined
      if (!emb || emb.length !== embedding.length) continue
      const sim = cosine(embedding, emb)
      if (!best || sim > best.sim) best = { sim, data }
    }

    if (best && best.sim >= SIMILARITY_THRESHOLD) {
      return {
        hit: true,
        result: best.data.result as T,
        embedding,
        similarity: best.sim,
        matchedScenario: best.data.scenario as string,
      }
    }
    return { hit: false, embedding, similarity: best?.sim }
  } catch {
    // Cache unavailable → behave as a miss; the caller will just generate.
    return { hit: false, embedding: null }
  }
}

/** Store a freshly generated activity. Best-effort; never throws. */
export async function saveCache<T>(
  collection: string,
  scenario: string,
  result: T,
  embedding: number[] | null,
): Promise<void> {
  try {
    const db = getFirestore()
    await db.collection(collection).add({
      scenario,
      normalized: normalizeScenario(scenario),
      embedding: embedding ?? null,
      result,
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch {
    // Best-effort: a failed cache write must never break the request.
  }
}

/**
 * Self-healing eviction: when the client reports a candidate was bad (a repair
 * attempt carries the rejected `previous`), drop any cached entry that would
 * keep serving it — both the exact-normalized doc for this scenario and any doc
 * whose stored result equals the rejected candidate (covers semantic matches
 * from differently-worded scenarios). Best-effort; never throws.
 */
export async function evictBadCandidate(
  collection: string,
  scenario: string,
  previous: unknown,
): Promise<void> {
  try {
    const db = getFirestore()
    const deletions: Promise<unknown>[] = []

    const normalized = normalizeScenario(scenario)
    const exact = await db.collection(collection).where('normalized', '==', normalized).get()
    exact.docs.forEach((doc) => deletions.push(doc.ref.delete()))

    if (previous !== undefined) {
      const prevJson = JSON.stringify(previous)
      const snap = await db.collection(collection).orderBy('createdAt', 'desc').limit(SCAN_LIMIT).get()
      snap.docs.forEach((doc) => {
        if (JSON.stringify(doc.data().result) === prevJson) deletions.push(doc.ref.delete())
      })
    }

    await Promise.all(deletions)
  } catch {
    // Best-effort.
  }
}
