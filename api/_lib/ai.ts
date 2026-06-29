import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

/**
 * AI generation logic, ported from the Firebase Cloud Function. On Vercel the
 * provider keys are plain environment variables (OPENAI_API_KEY,
 * ANTHROPIC_API_KEY) rather than Firebase secrets. These functions run as ESM on
 * Vercel, so static imports of the ESM-only SDKs work natively.
 */

/** Verified-track model; small + cheap (correctness is checked client-side). */
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

/** Open-ended "Invent Engine" model. Claude ids route to Anthropic. */
const CODEGEN_MODEL = process.env.CODEGEN_MODEL ?? 'gpt-5.5'

/**
 * Hard ceiling on generated length — keeps latency (and cost) bounded. Raised so
 * a stronger (reasoning-capable) codegen model has room for its reasoning tokens
 * AND a complete HTML document without being truncated mid-tag (which would
 * render as a broken widget).
 */
const CODEGEN_MAX_TOKENS = 8000

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

/**
 * Phase 3 (FR-R3c) creative latitude for spaced-review variants. Appended to the
 * system prompt when `creative` is requested. Encourages fresh, surprising
 * scenarios and varied numbers — WITHIN the verifiable schema/ranges, since the
 * answer is still independently re-checked.
 */
const CREATIVE_ADDENDUM = `

CREATIVE MODE (spaced-review variant): Be genuinely creative and surprising.
- Invent a vivid, unexpected real-world scenario — NOT a generic "rectangle"/"triangle". Think
  skate ramps, pizza boxes, drone flight paths, treehouse roofs, flag designs, garden mazes, etc.
- Choose varied, non-obvious numbers WITHIN the allowed ranges (avoid always using the smallest or
  roundest values; make the learner actually compute).
- Write a lively, fresh prompt and feedback — do not copy textbook phrasing.
- Each generation should feel different from the last.

CRITICAL NUMBER CONSISTENCY (do not violate):
- The numbers you state in the "prompt" and in all feedback text MUST be EXACTLY the structured
  values. For areaBuild the two dimensions in the prompt MUST equal "width" and "height" (and any
  area mentioned MUST equal "target"). For triangleArea use "base"/"height". For pythagSolve use the
  given leg and hypotenuse. For angleLock state the two known angles ("a","b").
- Do NOT mention ANY number that isn't one of the problem's real measurements (no incidental numbers
  like years, counts of people, prices, etc.). A learner builds/measures the STRUCTURED values, so a
  mismatched number in the prose makes the activity impossible.

Stay strictly within the schema and keep prose + structure perfectly consistent (it is verified).`

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

function buildUserPrompt(scenario: string, repair?: { previous?: unknown; failures?: unknown }): string {
  let prompt = `Scenario: ${scenario}`
  if (repair && Array.isArray(repair.failures) && repair.failures.length > 0) {
    prompt += `\n\nYour previous attempt was REJECTED for these reasons. Fix all of them and return corrected JSON:\n`
    prompt += repair.failures.map((f) => `- ${String(f)}`).join('\n')
    if (repair.previous) prompt += `\n\nPrevious attempt:\n${JSON.stringify(repair.previous)}`
  }
  return prompt
}

/** Single text-completion call, routed to Claude or OpenAI by model id. */
async function completeText(model: string, system: string, user: string): Promise<string> {
  if (model.startsWith('claude')) {
    const key = process.env.ANTHROPIC_API_KEY
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
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY is not set.')
  const client = new OpenAI({ apiKey: key })
  const messages = [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ]
  const isGpt43 = /^gpt-(4|3)/.test(model)
  try {
    const completion = await client.chat.completions.create({
      model,
      messages,
      max_completion_tokens: CODEGEN_MAX_TOKENS,
      ...(isGpt43 ? { temperature: 0.7 } : { reasoning_effort: 'low' as const }),
    })
    return completion.choices[0]?.message?.content ?? ''
  } catch {
    const completion = await client.chat.completions.create({ model, messages })
    return completion.choices[0]?.message?.content ?? ''
  }
}

/** Allowlist the per-request widget model by prefix; fall back to the default. */
export function pickCodegenModel(requested: unknown): string {
  const r = typeof requested === 'string' ? requested : ''
  return /^(gpt-|o1|o3|o4|claude-)/.test(r) ? r : CODEGEN_MODEL
}

/**
 * Verified-track: ask the model for one candidate step as parsed JSON.
 * `creative` (Phase 3 review variants) loosens the prompt for fresh, surprising
 * scenarios + varied numbers and raises temperature, while staying verifiable.
 */
export async function designCandidate(
  scenario: string,
  repair?: { previous?: unknown; failures?: unknown },
  opts?: { creative?: boolean },
): Promise<unknown> {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY is not set.')
  const creative = opts?.creative === true
  const client = new OpenAI({ apiKey: key })
  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: creative ? 0.7 : 0.4,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: creative ? SYSTEM_PROMPT + CREATIVE_ADDENDUM : SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(scenario, repair) },
    ],
  })
  const content = completion.choices[0]?.message?.content ?? '{}'
  return JSON.parse(content)
}

/** Open-ended: generate a self-contained interactive HTML widget. */
export async function widgetHtml(model: string, scenario: string): Promise<string> {
  return completeText(model, WIDGET_SYSTEM_PROMPT, `Scenario: ${scenario}`)
}
