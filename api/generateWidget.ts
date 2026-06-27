import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors } from './_lib/cors.js'
import { verifyFirebaseToken } from './_lib/verifyToken.js'
import { lookupCache, saveCache } from './_lib/cache.js'
import { pickCodegenModel, widgetHtml } from './_lib/ai.js'

const WIDGET_CACHE = 'widgetCache'

/**
 * Open-ended "Invent Engine" proxy (Vercel port of the Firebase `generateWidget`
 * function). Authenticates the user, serves from / writes to the semantic cache,
 * and generates a self-contained interactive HTML widget (rendered client-side
 * inside a sandboxed iframe).
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
    await verifyFirebaseToken(match[1])
  } catch (e) {
    console.error('verifyFirebaseToken failed:', e instanceof Error ? e.message : e)
    res.status(401).json({ error: 'invalid_token' })
    return
  }

  const body = (req.body ?? {}) as { scenario?: unknown; model?: unknown }
  if (typeof body.scenario !== 'string' || !body.scenario.trim()) {
    res.status(400).json({ error: 'scenario_required' })
    return
  }
  const scenario = body.scenario
  const model = pickCodegenModel(body.model)

  // Embeddings (for cache matching) use the OpenAI key regardless of which model
  // generates the HTML. If it's missing, skip the cache and just generate.
  const openaiKey = process.env.OPENAI_API_KEY
  const cached = openaiKey
    ? await lookupCache<{ html: string }>(WIDGET_CACHE, scenario, openaiKey)
    : { hit: false as const, embedding: null as number[] | null }
  if (cached.hit && cached.result) {
    res.status(200).json(cached.result)
    return
  }

  try {
    const html = await widgetHtml(model, scenario)
    const result = { html }
    if (html.trim()) await saveCache(WIDGET_CACHE, scenario, result, cached.embedding)
    res.status(200).json(result)
  } catch (e) {
    res.status(502).json({ error: 'generation_failed', detail: e instanceof Error ? e.message : String(e) })
  }
}
