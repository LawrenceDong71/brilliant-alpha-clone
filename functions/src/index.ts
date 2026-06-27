import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { lookupCache, saveCache, evictBadCandidate } from './cache.js'

initializeApp()

const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY')
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY')

/** Overridable per-environment; defaults to a small, cheap model. */
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

/**
 * Model for the open-ended "Invent Engine" (widget studio). Code generation
 * wants a strong model. If the id starts with "claude", we route to Anthropic
 * (recommended for self-contained interactive front-end generation); otherwise
 * OpenAI. Override with the CODEGEN_MODEL env var.
 */
const CODEGEN_MODEL = process.env.CODEGEN_MODEL ?? 'gpt-4.1-mini'

/** Hard ceiling on generated length — keeps latency (and cost) bounded. */
const CODEGEN_MAX_TOKENS = 4000

/** Firestore collections backing the semantic activity caches. */
const DESIGN_CACHE = 'designProblemCache'
const WIDGET_CACHE = 'widgetCache'

/** Single text-completion call, routed to Claude or OpenAI by model id. */
async function completeText(model: string, system: string, user: string): Promise<string> {
  if (model.startsWith('claude')) {
    const key = ANTHROPIC_API_KEY.value()
    if (!key) throw new Error('ANTHROPIC_API_KEY is not set.')
    const anthropic = new Anthropic({ apiKey: key })
    const msg = await anthropic.messages.create({
      model,
      max_tokens: CODEGEN_MAX_TOKENS,
      system,
      messages: [{ role: 'user', content: user }],
    })
    return msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
  }
  const key = OPENAI_API_KEY.value()
  if (!key) throw new Error('OPENAI_API_KEY is not set.')
  const client = new OpenAI({ apiKey: key })
  const messages = [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ]
  const isGpt43 = /^gpt-(4|3)/.test(model)
  try {
    // gpt-4/3-class take a custom temperature; gpt-5 / o / codex instead accept a
    // reasoning_effort — "low" sharply cuts thinking latency for fast generation.
    const completion = await client.chat.completions.create({
      model,
      messages,
      max_completion_tokens: CODEGEN_MAX_TOKENS,
      ...(isGpt43 ? { temperature: 0.7 } : { reasoning_effort: 'low' as const }),
    })
    return completion.choices[0]?.message?.content ?? ''
  } catch {
    // Last-ditch retry with the barest params in case the model rejected something.
    const completion = await client.chat.completions.create({ model, messages })
    return completion.choices[0]?.message?.content ?? ''
  }
}

/**
 * The proxy is intentionally THIN: it authenticates the user, asks the model for
 * one candidate step as JSON, and returns it raw. All verification + the
 * generate->verify->repair loop run on the client (mathjs oracle), so a wrong or
 * unsolvable candidate never reaches the learner regardless of what the model says.
 */
const SYSTEM_PROMPT = `You convert a short real-world scenario into ONE interactive geometry problem,
returned as a single JSON object and nothing else.

Pick exactly ONE "type" whose math the scenario fits, and fill it so the answer is
internally consistent (this will be independently re-checked; inconsistent output is rejected):

1) areaBuild  — rectangle area.
   { "type":"areaBuild", "prompt":string, "width":int 2..10, "height":int 2..10,
     "target":int (MUST equal width*height), "unit":string, "context":string, "feedback":F }

2) triangleArea — triangle area.
   { "type":"triangleArea", "prompt":string, "base":int 2..12, "height":int 2..12,
     "target":number (MUST equal base*height/2), "unit":string, "context":string, "feedback":F }

3) pythagSolve — find a missing side of a right triangle.
   { "type":"pythagSolve", "prompt":string, "hypotenuse":int, "knownLeg":int, "targetLeg":int,
     "context":string, "feedback":F }
   Constraints: all positive integers, hypotenuse is the LARGEST, and
   knownLeg^2 + targetLeg^2 MUST equal hypotenuse^2 (use a Pythagorean triple, e.g. 3-4-5, 6-8-10, 5-12-13, 8-15-17).

4) angleLock — find the missing angle of a triangle.
   { "type":"angleLock", "prompt":string, "snapDegrees":5, "tolerance":0,
     "dials":[{ "a":int, "b":int, "context":string }], "feedback":F }
   Constraints: for each dial 0<a<180, 0<b<180, a+b<180, and (180-a-b) MUST be a multiple of 5.

F (feedback) = { "correct":string (non-empty), "hints":string[] (1-3), "explanation":string (non-empty) }.
Every number you write in feedback must be correct for the problem. Output JSON only — no markdown, no prose.`

function buildUserPrompt(scenario: string, repair?: { previous?: unknown; failures?: unknown }): string {
  let prompt = `Scenario: ${scenario}`
  if (repair && Array.isArray(repair.failures) && repair.failures.length > 0) {
    prompt += `\n\nYour previous attempt was REJECTED for these reasons. Fix all of them and return corrected JSON:\n`
    prompt += repair.failures.map((f) => `- ${String(f)}`).join('\n')
    if (repair.previous) prompt += `\n\nPrevious attempt:\n${JSON.stringify(repair.previous)}`
  }
  return prompt
}

/**
 * Open-ended generator (Option 1): instead of routing the scenario into a fixed
 * verified Step, this asks the model to WRITE a self-contained, interactive HTML
 * visualization of the scenario. It is rendered inside a sandboxed iframe on the
 * client (scripts only, no same-origin), so generated code cannot touch the app,
 * Firebase, or cookies.
 */
const WIDGET_SYSTEM_PROMPT = `You are a world-class creative coder AND a math educator. You INVENT, from scratch, a
bespoke, visually realistic, INTERACTIVE MINI-LESSON for the given real-world scenario — choosing the
concept, designing the visual, and authoring the activity yourself.

Your output is ONE complete, self-contained HTML document. It must contain:
1) A REALISTIC, polished visual of the scenario. Use three.js (WebGL) for anything 3D (spheres, solids,
   vehicles, scenes); use Canvas2D/SVG for 2D. Use lighting, gradients, shadows, depth, and smooth animation.
2) DIRECT MANIPULATION: the user can drag, rotate, and/or use sliders to change the scenario's key
   quantities, with LIVE readouts that update (dimensions, radius, volume, surface area, angle, etc.).
3) AN EMBEDDED SHORT LESSON: a clear goal/prompt, a way to act on it, and immediate on-screen FEEDBACK
   when the user succeeds (plus a one-line "why" explanation of the underlying math).

QUALITY BAR (match or exceed): e.g. for "basketball, diameter 10 in" → a lit, pebbled 3D sphere you can
spin with the mouse and a diameter slider that resizes it, live volume (4/3·π·r³) and surface (4·π·r²)
readouts, a goal like "grow it to a target volume", and feedback that explains r = d/2 and cube scaling.
Aim for that level of polish and pedagogy for ANY scenario.

HARD RULES:
- Output a COMPLETE document starting with <!doctype html> and ending with </html>. No markdown, no code fences, no commentary.
- Inline ALL CSS and JS. The ONLY allowed external resource is three.js via
  <script type="module"> importing "https://unpkg.com/three@0.160.0/build/three.module.js".
- Runs inside a SANDBOXED iframe (scripts only, no same-origin): NO cookies, localStorage, parent/top access,
  or other network requests. Must run with NO console errors.
- LAYOUT: make it responsive to the iframe size (it can be up to ~1000px wide and tall). Use comfortable
  padding (>= 16px) on the body so NOTHING touches the edges. ALL text must wrap and stay fully visible —
  never rely on horizontal scrolling or let content get clipped. Use box-sizing: border-box.
- BE COMPACT AND FAST: keep the whole document under ~2500 tokens. Favor ONE focused, polished, working
  interaction over many features. Concise code beats sprawling code.
Return ONLY the HTML document.`

export const generateWidget = onRequest(
  {
    cors: true,
    secrets: [OPENAI_API_KEY, ANTHROPIC_API_KEY],
    timeoutSeconds: 300,
    memory: '512MiB',
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method_not_allowed' })
      return
    }
    const match = (req.get('Authorization') ?? '').match(/^Bearer (.+)$/)
    if (!match) {
      res.status(401).json({ error: 'unauthenticated' })
      return
    }
    try {
      await getAuth().verifyIdToken(match[1])
    } catch {
      res.status(401).json({ error: 'invalid_token' })
      return
    }

    const body = (req.body ?? {}) as { scenario?: unknown; model?: unknown }
    if (typeof body.scenario !== 'string' || !body.scenario.trim()) {
      res.status(400).json({ error: 'scenario_required' })
      return
    }
    const scenario = body.scenario
    // Per-request model from the UI picker, allowlisted by prefix so a stray
    // string can't be passed through to the provider. Falls back to CODEGEN_MODEL.
    const requested = typeof body.model === 'string' ? body.model : ''
    const model = /^(gpt-|o1|o3|o4|claude-)/.test(requested) ? requested : CODEGEN_MODEL

    // Cache lookup (exact, then semantic). A hit returns the same interactive
    // HTML widget without re-running the expensive code-generation call.
    // Embeddings use the OpenAI key regardless of which model generates the HTML.
    const openaiKey = OPENAI_API_KEY.value()
    const cached = openaiKey ? await lookupCache<{ html: string }>(WIDGET_CACHE, scenario, openaiKey) : { hit: false, embedding: null as number[] | null }
    if (cached.hit && cached.result) {
      res.status(200).json(cached.result)
      return
    }

    try {
      const html = await completeText(model, WIDGET_SYSTEM_PROMPT, `Scenario: ${scenario}`)
      const result = { html }
      // Only cache non-empty generations.
      if (html.trim()) await saveCache(WIDGET_CACHE, scenario, result, cached.embedding)
      res.status(200).json(result)
    } catch (e) {
      res.status(502).json({ error: 'generation_failed', detail: e instanceof Error ? e.message : String(e) })
    }
  },
)

export const designProblem = onRequest(
  { cors: true, secrets: [OPENAI_API_KEY] },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method_not_allowed' })
      return
    }

    // AuthN: require a valid Firebase ID token.
    const match = (req.get('Authorization') ?? '').match(/^Bearer (.+)$/)
    if (!match) {
      res.status(401).json({ error: 'unauthenticated' })
      return
    }
    try {
      await getAuth().verifyIdToken(match[1])
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

    const key = OPENAI_API_KEY.value()
    if (!key) {
      res.status(503).json({ error: 'ai_not_configured', detail: 'OPENAI_API_KEY is not set.' })
      return
    }

    // A repair attempt means a previously returned candidate failed the client's
    // verification. Evict it from the cache (self-healing) and always regenerate
    // fresh — never serve or store cached content on the repair path.
    const isRepair = !!(body.repair && Array.isArray(body.repair.failures) && body.repair.failures.length > 0)
    if (isRepair) {
      await evictBadCandidate(DESIGN_CACHE, scenario, body.repair?.previous)
    } else {
      // First attempt: try the cache (exact, then semantic). A hit skips OpenAI
      // entirely and returns the same verified-shape activity (interactivity is
      // preserved because we cache the full step the client renders).
      const cached = await lookupCache<unknown>(DESIGN_CACHE, scenario, key)
      if (cached.hit) {
        res.status(200).json(cached.result)
        return
      }
      // Remember the query embedding so we can store the result without re-embedding.
      ;(req as unknown as { _cacheEmbedding?: number[] | null })._cacheEmbedding = cached.embedding
    }

    try {
      const client = new OpenAI({ apiKey: key })
      const completion = await client.chat.completions.create({
        model: MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(scenario, body.repair) },
        ],
      })
      const content = completion.choices[0]?.message?.content ?? '{}'
      const parsed = JSON.parse(content)
      // Only cache first attempts that look like a real step (have a string type).
      // Repairs are never cached; bad candidates self-heal via evictBadCandidate.
      if (!isRepair && parsed && typeof parsed === 'object' && typeof parsed.type === 'string') {
        const embedding = (req as unknown as { _cacheEmbedding?: number[] | null })._cacheEmbedding ?? null
        await saveCache(DESIGN_CACHE, scenario, parsed, embedding)
      }
      res.status(200).json(parsed)
    } catch (e) {
      res.status(502).json({ error: 'generation_failed', detail: e instanceof Error ? e.message : String(e) })
    }
  },
)
