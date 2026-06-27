import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors } from './_lib/cors.js'
import { adminAuth } from './_lib/firebaseAdmin.js'
import { lookupCache, saveCache, evictBadCandidate } from './_lib/cache.js'
import { designCandidate } from './_lib/ai.js'

const DESIGN_CACHE = 'designProblemCache'

/**
 * Verified-track proxy (Vercel port of the Firebase `designProblem` function).
 * Authenticates the user, serves from / writes to the semantic cache, and asks
 * the model for one candidate step as raw JSON. Verification stays on the client.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const match = (req.headers.authorization ?? '').match(/^Bearer (.+)$/)
  if (!match) {
    res.status(401).json({ error: 'unauthenticated' })
    return
  }
  try {
    await adminAuth().verifyIdToken(match[1])
  } catch {
    res.status(401).json({ error: 'invalid_token' })
    return
  }

  const body = (req.body ?? {}) as { scenario?: unknown; repair?: { previous?: unknown; failures?: unknown } }
  if (typeof body.scenario !== 'string' || !body.scenario.trim()) {
    res.status(400).json({ error: 'scenario_required' })
    return
  }
  const scenario = body.scenario

  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    res.status(503).json({ error: 'ai_not_configured', detail: 'OPENAI_API_KEY is not set.' })
    return
  }

  // A repair means a prior candidate failed client verification: evict it and
  // always regenerate fresh (never serve/store cache on the repair path).
  const isRepair = !!(body.repair && Array.isArray(body.repair.failures) && body.repair.failures.length > 0)
  let embedding: number[] | null = null
  if (isRepair) {
    await evictBadCandidate(DESIGN_CACHE, scenario, body.repair?.previous)
  } else {
    const cached = await lookupCache<unknown>(DESIGN_CACHE, scenario, openaiKey)
    if (cached.hit) {
      res.status(200).json(cached.result)
      return
    }
    embedding = cached.embedding
  }

  try {
    const parsed = await designCandidate(scenario, body.repair)
    if (
      !isRepair &&
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as { type?: unknown }).type === 'string'
    ) {
      await saveCache(DESIGN_CACHE, scenario, parsed, embedding)
    }
    res.status(200).json(parsed)
  } catch (e) {
    res.status(502).json({ error: 'generation_failed', detail: e instanceof Error ? e.message : String(e) })
  }
}
