# Product Requirements Document — Phase 2 AI Features ("GeoSpark")

**Chosen subject:** Geometry
**Builds on:** Phase 1 MVP (see `PRD.md`) — 6 hand‑authored, data‑driven lessons; Vite + React 19 + TS; Firebase Auth + Firestore.
**Scope of this document:** Two AI features for Phase 2 — **(A) "Keep Going" AI‑generated lessons** and **(B) "Design‑a‑Problem"**. Both are **additive**: the MVP works unchanged with AI turned off.
**New dependencies (Phase 2):** `mathjs` (verification oracle), an LLM client behind a small serverless proxy. No new interactive step components — generated content reuses the existing `Step` vocabulary.

---

## ADDENDUM (2026-06) — Feature C: "Widget Studio" / the Invent Engine ("Path A")

> This addendum supersedes the original scope where they conflict. The original
> features A & B (verified, template-based generation) **remain unchanged**. Feature
> C is a deliberately different, additive track.

**Motivation.** Features A & B keep AI confined to a fixed menu of `Step` templates and a
`mathjs` correctness guarantee. That guarantees trustworthy content but caps *novelty and
realism*: e.g. "a triangular sail" can only become the existing `triangleArea` grid activity,
not a bespoke, realistic sail you can manipulate. For a **demo / wow-factor** goal we want the
AI to *invent* the visual + interactive activity on the spot.

**What Feature C is.** An open-ended generator where the model returns **real renderable code**
(a self-contained interactive HTML/JS/WebGL document), not structured `Step` JSON. We render it
inside a **sandboxed `<iframe>`** (`sandbox="allow-scripts"`, no same-origin) so generated code is
isolated from the app, Firebase, cookies, and the user's session.

**Explicit trade-offs (accepted for this track):**
- **No math-verification.** The `mathjs` §2.5 oracle does **not** apply; there is no "Verified ✓".
  Content can be imperfect or wrong. Acceptable here because the goal is novelty/demo, not graded study.
- **Weaker safety net only:** schema/`looksLikeHtmlDocument` check, sandbox isolation, and a
  generate → self-critique → repair pass (best-effort "does it run / is it polished").
- **Reliability/cost/latency:** AI-authored code fails more often, costs more, and is slower; the UI
  has draft-fallback + retry.
- **Model-dependent quality.** Needs a frontier code model (`CODEGEN_MODEL`, e.g. `gpt-5.5` /
  `gpt-5.3-codex`); weak models (`gpt-4o-mini`) won't reach the quality bar.

**Where it lives.** Function `generateWidget` (provider-agnostic: OpenAI or Claude) →
`src/pages/WidgetStudioPage.tsx` at route `/studio`. The verified track (`designProblem`, `/design`)
is untouched and remains the trustworthy path.

**Honest ceiling.** Single polished interactives (sphere, sail, ramp, pendulum, gears) are achievable
on the spot with a strong model. Full stateful mini-games at battleship complexity are **not** reliable
single-shot and remain hand-built.

---

## 0. How this builds on Phase 1 (the integration surface)

Everything in the app is already **structured, typed data**, which is exactly what lets AI plug in safely:

- A lesson is a typed `Lesson` (`{ id, order, title, summary, estimatedMinutes, steps: Step[] }`) in `src/content/types.ts`. Core lessons live in `LESSONS: Lesson[]` (`src/content/lessons.ts`) and are looked up by `lessonById(id)`.
- A `Step` is a **discriminated union of ~30 interactive types** (`angleDrag`, `dragTriangle`, `triangleArea`, `areaBuild`, `pythagSolve`, `gridShape`, `rayAim`, `angleTarget`, `clockAngles`, …) plus `concept`. Each carries its **answer in its config** (e.g. `triangleArea.target = base·height/2`) and self‑grades via `setChecker(() => boolean)`.
- `StepRenderer` maps `step.type` → a component; unknown types render `null`.
- `ProgressContext` owns unlock/recommendation (`isUnlocked`, `recommendedLessonId`) and persists progress to `users/{uid}/progress/{lessonId}` with 60%‑to‑pass scoring (`src/progress/scoring.ts`).

**Consequence:** if the AI emits **valid `Step`/`Lesson` JSON**, it renders and grades through the *existing* pipeline with no new UI code. Both features below are built on this fact.

---

## 1. Decision — what we chose and why

The assignment's Phase 2 says: *decide which AI genuinely helps, then build it; don't bolt on a chatbot.* We chose two features that attack the two biggest limits of the MVP:

1. **The course runs dry after 6 lessons.** → **Feature A: "Keep Going" AI‑generated lessons.** After the core path, the learner picks a sensible next topic and the AI authors a full interactive lesson for it, in the same hands‑on style.
2. **Every problem is fixed; learners can't explore their own interests.** → **Feature B: "Design‑a‑Problem."** The learner types a real‑world scenario and the AI turns it into a *playable* interactive activity.

**Why these (and not a chatbot/tutor):** both are *creation* features that produce **structured, verifiable artifacts** (a `Lesson`, a `Step`) rather than free‑floating chat text. They're the most leveraged uses of AI for a learn‑by‑doing app: one removes the content ceiling, the other makes the content personal — and neither asks the learner to read a wall of AI prose.

**How both satisfy the hard constraints:**

| Constraint | How we meet it |
|---|---|
| **Ground in structured state, not raw text** | The AI's *output* is typed `Step`/`Lesson` JSON conforming to `src/content/types.ts`; its *input* is the typed curriculum graph + the learner's structured progress. No free‑text rendering. |
| **Verify anything checkable with a math engine** | A `mathjs`‑backed **verifier** re‑derives every generated answer from first principles and rejects any step that is inconsistent, unsolvable, degenerate, or out of render bounds **before it is ever shown**. The AI literally cannot ship a wrong/unsolvable problem. |
| **Works with AI off (additions, not replacements)** | Both features sit behind an `isAiConfigured` flag (mirroring `isFirebaseConfigured`). With AI off, the 6 core lessons and all Phase‑1 behavior are untouched; each feature degrades to a deterministic fallback (see §A10, §B9). |
| **AI never in the grading/answer path** | Generated steps grade with the same local `setChecker` as authored ones. The AI authors; `mathjs` verifies; the existing checker grades. |

---

## 2. Shared architecture & principles

### 2.1 The propose → validate → verify → repair pipeline (used by A and B)

Only **stage 1 is AI**; stages 2–4 are deterministic and are the safety guarantee.

```ts
type GenResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: 'schema' | 'bounds' | 'math' | 'unsupported' | 'exhausted'; detail: string }

// 1) PROPOSE  — LLM returns candidate Step/Lesson JSON (constrained by JSON schema / function-calling)
// 2) VALIDATE — type guard: is it exactly a known Step variant? are component render caps respected?
// 3) VERIFY   — mathjs re-solves the geometry and confirms internal consistency + solvability + non-degeneracy
// 4) REPAIR   — on failure, re-prompt the model with the precise reason (max 2 retries); else fall back
```

A single module, e.g. `src/ai/verify/verifyStep.ts`, exposes `verifyStep(step: Step): GenResult<Step>` with a per‑type checker (Appendix A). Both features call it; nothing renders unless it returns `ok: true`.

### 2.2 The `mathjs` verifier is the oracle, not the brain

For each step type the verifier (a) recomputes the ground truth from the config (`180 − a − b`, `0.5·base·height`, `√(c² − a²)`, area by cell count, rotation/reflection matrices), (b) confirms the config's stored answer matches, (c) confirms a legal interaction can satisfy the step's own checker (solvable), and (d) rejects degenerate/trivial/out‑of‑bounds configs. Anything the LLM writes in prose (hints, explanations) is **non‑authoritative** and never affects grading.

### 2.3 AI on/off gating, proxy, privacy

- `isAiConfigured` (e.g. `Boolean(import.meta.env.VITE_AI_PROXY_URL)`), mirroring `src/lib/firebase.ts`'s `isFirebaseConfigured`. Every AI entry point checks it.
- **LLM key is never in the client.** All model calls go through a minimal serverless proxy (e.g. a Firebase Cloud Function / edge function) that holds the key, enforces auth (`uid`), rate‑limits, and returns JSON. The Vite client only knows the proxy URL.
- Inputs sent to the model are **structured and minimal** (topic id, prereqs, difficulty, the learner's per‑concept mastery numbers; or the scenario text) — no PII beyond the `uid` the proxy already authorizes.

### 2.4 New dependencies & flags (summary)

- `mathjs` (client) — verification.
- LLM proxy (serverless) — generation; `VITE_AI_PROXY_URL` env.
- No new step renderer components; no change to `LessonPage`/`StepRenderer` grading.

### 2.5 Closed‑loop self‑verification — automated tests are the completion gate

**Requirement:** every AI‑generated artifact (a `Step` or a whole `Lesson`) must be put through an **automated test suite and is only considered "complete" when 100% of those tests pass.** Generation is a closed feedback loop, not a one‑shot call: the model generates → the system **runs the tests** → on *any* failure it feeds the specific failures back to the model and **regenerates/repairs** → it repeats until the suite is all‑green. If the loop cannot reach all‑green within the retry budget, the artifact is **discarded** and the deterministic fallback is used — failing content is **never** shown to a learner. "Done" ≡ green test suite.

**What "the tests" are (run automatically per artifact, before anything renders):**
1. **Schema test** — output is exactly a known `Step`/`Lesson` variant (TS type guard against `src/content/types.ts`).
2. **Bounds test** — respects every component's render caps (e.g. `areaBuild` ≤ 8×5, grid cells in‑bounds, `angleLock`/`trussRescue` answer a positive multiple of `snapDegrees`).
3. **Consistency test** — `mathjs` re‑derives the answer from first principles and asserts the config's stored answer matches.
4. **Solvability test (executable — the core of "run tests"):** simulate the intended *correct* interaction and assert the step's **real `setChecker(() => boolean)` returns `true`** (and that a representative *wrong* interaction returns `false`). The generated problem is literally run against its own grader, so an unsolvable or mis‑keyed problem fails the suite.
5. **Non‑triviality / non‑degeneracy test** — `start !== answer`, sane tolerances, not already solved on load, no degenerate geometry (e.g. `a + b ≥ 180`).
6. **Feedback‑safety test** — every number appearing in AI‑written `feedback` is in the `mathjs`‑approved allow‑set (no leaked or wrong numbers).
7. **(Lessons) Cadence test** — the lesson has the required shape (one `concept` intro, ≥1 direct‑manipulation step, a final check) **and every individual step passes tests 1–6**; a lesson ships only if *all* its steps are green.

**The loop (definition of done):**

```text
generate(artifact)
repeat up to MAX_REPAIRS:
    results = runTestSuite(artifact)          // tests 1–7 above
    if results.allPassed: return COMPLETE     // ✅ only exit that renders to the learner
    artifact = repair(artifact, results.failures)   // feed exact failures back to the model
return FALLBACK                               // exhausted → discard, use deterministic fallback (never ship red)
```

**Telemetry:** record first‑pass rate, repairs‑to‑green, and failure reasons; the hard SLO is **zero failing artifacts ever shipped** (re‑verified post‑hoc + a learner "report this problem" path as a backstop).

**Dev‑time corollary:** the verifier/test functions that gate generation are themselves covered by **unit tests (vitest) that must pass in CI** before release — i.e., the tests that gate the AI are themselves tested. This same green‑gate discipline applies to building Features A and B: a feature is not "complete" until its automated tests pass and the suite is green. The harness is wired up now — `npm run test:run`, `npm run typecheck`, `npm run lint` (config in `vitest.config.ts`, a working oracle prototype in `src/content/verification.test.ts`, and the loop policy in `AGENTS.md`).

---

# Feature A — "Keep Going": AI‑generated lessons beyond the core 6

## A1. Problem & opportunity

The MVP teaches 6 foundational topics, then stops. Geometry has far more (circles, polygons, coordinate geometry, solids, similarity, …). We want the path to continue **indefinitely** without us hand‑authoring every lesson — while keeping the same quality bar (hands‑on, instant feedback, sensible difficulty) and **never** dropping the learner into something they're not ready for.

## A2. Goals / Non‑goals

**Goals**
- After finishing the core 6, the learner is offered a small set of **sensible next topics** and can generate a full lesson for any of them.
- Generated lessons look and behave like authored ones: a `concept` intro, ≥1 direct‑manipulation problem, a wrap‑up check — all reusing existing `Step` types so they render natively.
- Difficulty progression is **guaranteed sensible** (no "transformations → trigonometry" jump) via a curated prerequisite graph, not the LLM's discretion.
- Every generated step is `mathjs`‑verified solvable before the learner sees it.

**Non‑goals**
- Not generating brand‑new *interaction types* (no new React components). Only existing `Step` variants.
- Not replacing or editing the 6 core lessons.
- Not an open "teach me anything" box — topics come from a curated catalog (§A4).
- Not (Phase 2) social sharing of generated courses.

## A3. User stories

- *As a learner who finished the 6 lessons,* I want to **pick what to learn next from sensible options** so I keep progressing without hitting a dead end.
- *As Maya (8th grade),* I want the next lesson to **feel like the ones before it** (interactive, not a wall of text) and **not suddenly be too hard**.
- *As Diego (10th grade),* I want to **go deeper into topics I care about** and have the path keep adapting.
- *As a returning learner,* I want a lesson I generated to **persist** so I can resume it and keep my streak.

## A4. The topic graph — how "sensible next" is guaranteed

The set of offerable topics is a **hand‑curated catalog** (`src/ai/curriculum/topics.ts`), each with prerequisites and a difficulty tier. The AI never invents a topic; it only **authors a lesson for a topic the learner is already eligible for**. This is what prevents nonsensical jumps.

```ts
interface TopicNode {
  id: string                 // 'circles-basics'
  title: string              // 'Circles: Radius, Diameter & Circumference'
  tier: 1 | 2 | 3            // rough difficulty / depth
  prereqs: string[]          // topic/lesson ids that must be passed first
  blurb: string              // one-line description shown on the card
  /** Step types this topic is allowed to use (keeps generation in-bounds). */
  allowedStepTypes: StepType[]
  /** Authored seeds: example configs the generator imitates for quality + grounding. */
  exemplars: Step[]
}
```

A topic is **offered** only when every `prereqs` entry is passed (reusing `hasPassed`/`isUnlocked` logic). Proposed initial catalog:

| Tier | Topic | Prereqs | Natural step types to reuse |
|---|---|---|---|
| 1 | Circles: radius/diameter/circumference/area | area‑perimeter | `slider`, `multipleChoice`, `plot`, `concept` |
| 1 | Quadrilaterals & polygons (classify, angle sums) | triangles, angles | `sortBins`, `dragTriangle`, `angleFill`, `multipleChoice` |
| 1 | Angle relationships on parallel lines (transversals) | angles | `angleDrag`, `angleFill`, `multipleChoice` |
| 1 | Coordinate geometry: plot, midpoint, distance | points‑lines, pythagorean | `dragPoint`, `plot`, `distanceFlight`, `connectDots` |
| 1 | Composite area & perimeter | area‑perimeter | `decomposeArea`, `gridShape`, `areaBuild`, `slider` |
| 2 | Congruence & similarity (scale factor) | triangles, transformations | `dragTriangle`, `slider`, `multipleChoice` |
| 2 | 3‑D solids: nets, surface area, volume | area‑perimeter | `slider`, `areaBuild`, `multipleChoice`, `concept` |
| 2 | Circle theorems: arcs, sectors | circles‑basics | `slider`, `angleDrag`, `multipleChoice` |
| 3 | Intro to right‑triangle trig (SOH‑CAH‑TOA) | pythagorean, similarity, angles | `slider`, `angleDrag`, `multipleChoice` |

> Trigonometry is reachable **only** after Pythagoras + similarity + angles are passed — directly satisfying "don't jump from transformations to trig."

The catalog is curated by us but **the lesson content for each topic is AI‑generated on demand**, so adding a topic is a one‑line catalog entry, not a hand‑authored lesson.

## A5. UX flow

1. **Entry:** On the Home path (after the 6th node) and on the Done page, a **"Keep going →"** section appears (only when `isAiConfigured`). It shows 2–4 **eligible** topic cards (from §A4), each with title + blurb + tier.
2. **Pick:** Learner taps a topic → a brief "Generating your lesson…" state (skeleton of the path), with the pipeline running (propose → verify).
3. **Play:** The verified `Lesson` is inserted into the runtime store and the learner is routed to it (`/lesson/:generatedId`) — it renders through the **existing** `StepRenderer`/`LessonPage` exactly like a core lesson.
4. **Persist & continue:** Progress saves to a generated‑lessons Firestore bucket (§A8). On completion, the next eligible topics are offered, so the path is endless.
5. **Regenerate:** A "Make me a different one" affordance re‑rolls a fresh lesson for the same topic (new seed).

## A6. Functional requirements

- FR‑A1: Show **only eligible** topics (all prereqs passed). Never offer a topic whose prereqs aren't met.
- FR‑A2: A generated lesson has **3–6 steps**: exactly one `concept` intro, ≥1 direct‑manipulation step (non‑`multipleChoice`, non‑`concept`), and a final check; mirrors the authored cadence.
- FR‑A3: Every step uses a type in the topic's `allowedStepTypes` and passes `verifyStep` (Appendix A). A lesson ships only if **all** steps verify.
- FR‑A4: Generated steps include authored‑quality `feedback {correct, hints[], explanation}` produced by the model, but **grading uses only the verified config** (feedback text is cosmetic).
- FR‑A5: Generated lessons are **isolated** from the core `LESSONS` array so they don't perturb the linear unlock math of the 6 (their `order` lives in a separate space, e.g. `order >= 100`).
- FR‑A6: `lessonById` (or a thin wrapper) resolves generated lessons from the runtime/Firestore store as well as the static `LESSONS`.
- FR‑A7: Resume, streak, and scoring work for generated lessons via the existing progress mechanisms.
- FR‑A8: Performance — first verified step renders quickly (target < ~6 s incl. model latency); subsequent steps may stream/lazy‑verify so the learner can start while later steps finish.

## A7. Generation pipeline & LLM contract

1. **Build the prompt context (structured):** topic node (title, tier, `allowedStepTypes`, `exemplars`), the learner's relevant mastery (per‑concept `firstTry`/`attempts`), and a target difficulty band.
2. **Constrain the output:** request a `Lesson` via **JSON‑schema / function‑calling** so the model can only emit fields of the `Step`/`Lesson` union. Exemplars anchor style and valid ranges.
3. **Validate** each step against the TS type guards + component render caps (e.g. `areaBuild.width ≤ 8`, `areaBuild.height ≤ 5`; `angleLock`/`trussRescue` answer a positive multiple of `snapDegrees`; `pythag*` must be a true triple).
4. **Verify** each step with `mathjs` (Appendix A). On any failure, **repair**: re‑prompt with the exact failing step + reason (≤ 2 retries). If still failing, drop/replace that step from a verified exemplar; if the whole lesson can't be assembled, show a friendly retry.
5. **Assemble & cache** the verified `Lesson` (stable id, `source: 'generated'`).

## A8. Data model & persistence

A generated lesson is a normal `Lesson` plus provenance:

```ts
interface GeneratedLesson extends Lesson {
  source: 'generated'
  topicId: string
  seed: number
  createdAt: number
  generatorVersion: string
}
```

Firestore (kept separate from core‑lesson progress so `masteryScore` math for the 6 stays clean):

```
users/{uid}/generatedLessons/{lessonId}   // the frozen Lesson JSON (so it's reproducible on return)
  ...Lesson fields..., source, topicId, seed, createdAt, generatorVersion

users/{uid}/generatedProgress/{lessonId}  // same shape as users/{uid}/progress/{lessonId}
  status, currentStepIndex, steps{}, masteryScore, points, completedAt, updatedAt
```

> We **freeze and store the generated Lesson JSON**, not just the seed, so a returning learner replays the exact lesson (and because the model is non‑deterministic). Security rules: user reads/writes only under their own `users/{uid}`.

## A9. Verification & quality gates (the "never wrong" guarantee)

- Structural: exactly one correct answer / valid target per step; cadence rules (FR‑A2).
- Mathematical: per‑type `mathjs` checks (Appendix A) — consistency, solvability, non‑degeneracy, in‑bounds.
- Pedagogical guards: not trivial (`start !== target`), tolerances sane, numbers age‑appropriate (integer‑friendly per tier).
- Only a fully‑verified lesson is persisted/shown.

## A10. AI‑off behavior

`isAiConfigured === false` → the **"Keep going"** section is hidden; the 6 core lessons and all Phase‑1 behavior are unchanged. (Optional deterministic fallback: a small **seeded parametric generator** can still produce *extra practice* for already‑unlocked core concepts — pure TS, no model — but new *topics* simply require AI. This keeps the feature strictly additive.)

## A11. Edge cases & failure handling

- **Model latency/outage:** show skeleton; on timeout, friendly "couldn't generate right now — try again," core app unaffected.
- **Repeated verification failure for a topic:** fall back to assembling from that topic's authored `exemplars` (guaranteed valid) so the learner still gets a lesson.
- **Cold start (no eligible Tier‑1 topic):** only offered after the relevant core lessons are passed (by construction).
- **Duplicate/echo content:** seed + a recent‑content check reduce repeats on "make another."
- **Cost control:** cache per (topicId, seed); cap generations/day per user at the proxy.

## A12. Success metrics

- % of learners who generate ≥1 lesson after finishing the core 6 (engagement/retention past the wall).
- Generated‑lesson completion rate & average `firstTry` (quality proxy; should be comparable to authored lessons).
- **Verification reject rate** (internal health: how often the model proposes invalid steps; lower over time).
- **Zero** shipped wrong/unsolvable problems (hard requirement — measured by post‑hoc re‑verification + learner "report this problem").

## A13. Risks & mitigations

| Risk | Mitigation |
|---|---|
| LLM emits invalid/unsolvable steps | propose→validate→verify→repair; exemplar fallback; nothing renders unverified |
| Difficulty too hard / wrong order | curated prereq graph gates topics; tier‑bound parameter ranges |
| Latency hurts the snappy feel | stream/lazy‑verify steps; skeleton UI; cache |
| Cost blowup | per‑user daily caps + caching at the proxy |
| Key leakage | serverless proxy, never `VITE_`‑expose the key |
| Mastery math polluted by generated work | separate Firestore bucket |

## A14. Milestones

0. **Test harness first** — `vitest.config.ts`, `test`/`test:run`/`typecheck` scripts, and starter tests, so the generate→test→repair loop (§2.5) and the engineering green‑gate are enforceable from day one. *(Done; see `src/content/*.test.ts` + `AGENTS.md`.)*
1. `mathjs` verifier + `verifyStep` for the Tier‑1 step types; unit tests.
2. Topic catalog (Tier‑1) + eligibility wiring to `ProgressContext`.
3. LLM proxy + schema‑constrained `Lesson` generation + repair loop.
4. Runtime lesson store + `lessonById` wrapper + `/lesson/:generatedId` rendering.
5. Generated‑progress persistence + "Keep going" UI + regenerate.
6. Tiers 2–3 + trig gating; metrics + "report this problem."

## A15. Acceptance criteria

- After passing the 6 core lessons, a learner is offered only **eligible** next topics, generates a lesson, and plays it through the existing renderer with instant feedback.
- No generated lesson is shown unless **every** step passes the full §2.5 self‑verification suite (schema, bounds, consistency, **executable solvability**, non‑triviality, feedback‑safety) — all tests green. Failures loop back for repair; content that can't be made all‑green is discarded, never shown.
- Trig is **not** offered until its prereqs are passed.
- With AI off, the app behaves exactly as Phase 1.
- A generated lesson persists and resumes across sessions/devices, with streak intact.
- **Engineering green‑gate:** the feature ships with vitest tests for its verifier/generator, and `npm run test:run`, `npm run typecheck`, and `npm run lint` all pass. Per `AGENTS.md`, the work is not "done" while any gate is red.

---

# Feature B — "Design‑a‑Problem": turn a real scenario into a playable step

## B1. Problem & opportunity

Diego wants to know *how geometry connects to real life*. Today every problem is fixed. **Design‑a‑Problem** lets a learner type a real‑world scenario ("a wheelchair ramp that rises 1 ft over 12 ft," "a triangular sail with base 10 and height 6," "how long a ladder reaches a 9 ft window 3 ft from the wall") and turns it into a **playable interactive activity** — the same kind of hands‑on step the lessons use — with the answer **verified by `mathjs` before it renders**.

## B2. Goals / Non‑goals

**Goals**
- Learner describes a scenario in plain language → gets a **playable, gradable** interactive step grounded in an existing `Step` type.
- `mathjs` **verifies solvability and internal consistency** before render; the AI never produces a wrong or unsolvable activity.
- Feels native: renders through `StepRenderer`, grades via the normal checker, gives instant feedback.
- Optional: save to "My Problems" and replay.

**Non‑goals**
- Not a free‑form chat or symbolic word‑problem solver that prints an answer — the output is an *interactive figure to manipulate*, not a worked solution.
- Not generating new interaction types — maps onto the supported subset (§B5).
- Not guaranteeing every scenario is supported; unsupported ones get a graceful, helpful decline.

## B3. User stories

- *As Diego,* I want to **type a real situation and play it as a geometry activity** so the math feels relevant to my world.
- *As Maya,* I want the generated activity to be **solvable and fair**, with a hint if I'm stuck — like the normal lessons.
- *As a tinkerer,* I want to **save problems I make** and come back to them.

## B4. UX flow

1. **Entry:** A "Design a problem" button (Home/Done page; visible only when `isAiConfigured`).
2. **Describe:** A single text box ("Describe a real‑world geometry scenario…") with 3–4 example chips ("a ramp's angle," "a sail's area," "a ladder against a wall").
3. **Generate & verify:** AI maps the scenario → a candidate `Step`; `mathjs` verifies solvability/consistency/bounds; on failure, repair (≤2) or a friendly "try rephrasing / here's a close template."
4. **Preview:** Show *what kind* of activity it became ("This became an *adjust‑the‑angle* problem") + the verified figure.
5. **Play:** Render the step in a lightweight **playground** screen via the existing `StepRenderer`; instant feedback + hints (AI‑written, config‑verified) on Check.
6. **Save/Share (optional):** Save to "My Problems" (Firestore); share via an encoded, re‑verifiable link.

## B5. Supported step types & NL → Step mapping

The model classifies the scenario into one supported, verifiable interaction and fills its typed config:

| Scenario flavor | Target `Step` type | Verified quantity (`mathjs`) |
|---|---|---|
| Ramp/shot/launch angle, "what angle…" | `angleTarget` / `angleDrag` | angle from geometry; `0 < θ < 180`; reachable |
| Triangle area ("sail", "roof") | `triangleArea` | `target === base·height/2`; fits `gridMax` |
| Rectangle area/"tiles"/rug | `areaBuild` / `gridShape` | `target === w·h`; `w ≤ 8, h ≤ 5` (render caps) |
| Ladder/wall, distance, "how long…" | `pythagSolve` / `pythagBalance` / `braceIt` | `a² + b² === c²` (true triple ⇒ integer answer) |
| Missing angle in a triangle/joint | `angleFill` / `angleLock` / `trussRescue` | `answer === 180 − a − b > 0`; multiple of `snapDegrees` |
| Clock/compass angle | `clockAngles` | each target a multiple of 30°, `0 < θ ≤ 180` |
| "How far apart" on a map/grid | `distanceFlight` / `dragPoint` | `dist(origin, target)`; in grid |
| Compute area/perimeter/hypotenuse via a control | `slider` | computed value within tolerance of target |

If the scenario can't be mapped to one of these (or can't be made solvable), the feature **declines gracefully** and offers the closest template (§B9) — it never invents an unverifiable activity.

## B6. Functional requirements

- FR‑B1: Accept a free‑text scenario; classify to exactly one supported `Step` type with a filled, typed config.
- FR‑B2: `verifyStep` must pass (consistency + solvability + non‑degeneracy + render caps) **before** render. Unverified → repair or decline.
- FR‑B3: The generated step renders via the **existing** `StepRenderer` and grades via the normal `setChecker` (AI not in the grading path).
- FR‑B4: Provide AI‑written `feedback` (correct/hints/explanation) tuned to the scenario; numbers in feedback are filtered against the `mathjs` allow‑set (so no wrong number leaks).
- FR‑B5: Show a plain‑language note of *what type* of activity it became and the parameters used.
- FR‑B6 (optional): Save/replay from `users/{uid}/designedProblems/{id}`; shareable encoded link that re‑verifies on open.
- FR‑B7: Latency target < ~4 s to a playable, verified step.

## B7. LLM contract + verification

- **Output is structured:** function‑calling / JSON schema constrains the model to `{ stepType, config, rationale }` where `config` matches the chosen `Step` variant.
- **Validate** against the TS type guard + render caps; **verify** with `mathjs` (Appendix A). The *solvability* check is the headline guarantee: the verifier confirms there exists a legal interaction that makes that step's checker return `true`, and that the starting state isn't already solved/degenerate.
- **Repair loop:** on failure, re‑prompt with the exact reason (e.g. "areaBuild width 12 exceeds max 8") up to 2×; else decline + nearest template.

## B8. Data model & persistence (optional save/share)

```ts
interface DesignedProblem {
  id: string
  uid: string
  scenario: string        // the learner's text
  step: Step              // the verified, frozen Step
  createdAt: number
}
```

```
users/{uid}/designedProblems/{id}   // scenario + frozen verified Step
```

Share link encodes the verified `Step` (or an id); on open it is **re‑verified** before rendering, so a tampered link can't inject an invalid problem.

## B9. AI‑off behavior

`isAiConfigured === false` → the "Design a problem" entry becomes a **template builder**: the learner picks an activity type (e.g. "triangle area," "ladder") and fills 2–3 numbers in a small form; `mathjs` verifies and renders the same way. Deterministic, no model — still lets learners make their own problems, just without natural language. (Or hide the entry entirely; either keeps the MVP intact.)

## B10. Edge cases & failure handling

- **Ambiguous/under‑specified scenario** ("a big triangle"): model picks sensible defaults; preview shows the assumed numbers; learner can tweak via chips ("make it bigger / obtuse").
- **Unsupported scenario** ("prove two circles are tangent"): graceful decline + nearest supported template.
- **Adversarial/off‑topic input:** topic guard; non‑geometry input is declined.
- **Unverifiable after retries:** decline, never render an unchecked step.
- **Profanity/safety:** proxy‑side moderation on the input text.

## B11. Success metrics

- # of problems designed per active learner; save/replay rate.
- Solve rate / `firstTry` on designed problems (are they fair?).
- **Verification reject rate** and **zero** unverified problems shown (hard requirement).
- Qualitative: "this is *my* problem" engagement (Diego persona).

## B12. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Model emits wrong/unsolvable activity | validate + `mathjs` solvability gate + repair; decline on failure |
| Scenario maps poorly to a type | confidence threshold → preview + "use a template instead" |
| Number leak in hint text | filter feedback numbers against the `mathjs` allow‑set |
| Tampered share links | re‑verify on open |
| Prompt injection / off‑topic | proxy moderation + topic guard |
| Latency | small models for classification; cache; optimistic preview |

## B13. Milestones

0. **Test harness first** — shared with Feature A (`vitest` + scripts + starter tests); the §2.5 loop and engineering green‑gate are enforceable from day one. *(Done.)*
1. `verifyStep` solvability checks for the §B5 step types (shared with Feature A).
2. LLM proxy classify→config endpoint + schema constraint + repair.
3. Playground render screen (reuse `StepRenderer`) + "what it became" note.
4. Entry points + example chips + decline/template fallback.
5. Save/replay + shareable re‑verifying links.

## B14. Acceptance criteria

- A learner types a real scenario and, within a few seconds, plays a **verified, solvable** interactive activity with instant feedback.
- No designed problem is rendered unless it passes the full §2.5 self‑verification suite (all tests green, including the executable solvability test that runs the step against its own `setChecker`); failures repair‑loop or the feature declines.
- The same `StepRenderer`/checker grades it (AI not in the loop).
- With AI off, the entry degrades to a deterministic template builder (or is hidden) and the MVP is unchanged.
- **Engineering green‑gate:** the feature ships with vitest tests for its verifier/generator, and `npm run test:run`, `npm run typecheck`, and `npm run lint` all pass. Per `AGENTS.md`, the work is not "done" while any gate is red.

---

## Appendix A — Generatable step types + `mathjs` verification cheat‑sheet

Both features share this verifier. `mathjs` re‑solves; a step renders only if the predicate holds.

| Step type | `mathjs` recomputes | Show only if | Reject (degenerate) |
|---|---|---|---|
| `angleDrag` | — (range) | `0 < target < 180`, integer, `|start − target| ≥ min` | `start === target`; `target ∈ {0,180}` |
| `areaBuild` | `w*h` | `target === w*h`, `1 ≤ w ≤ 8`, `1 ≤ h ≤ 5` | dims past 8×5 cap |
| `triangleArea` | `base*height/2` | `target === base*height/2`, `gridMax ≥ max(base,height)+2` | base or height = 0 |
| `angleFill` / `angleLock` / `trussRescue` | `180 − a − b` | answer `> 0`, multiple of `snapDegrees`, `a + b < 180` | `a + b ≥ 180` |
| `pythagSolve` / `pythagBalance` / `braceIt` | `√(c² − a²)` | `a² + b² === c²` (true triple), `a < c` | non‑integer leg; `leg ≥ hyp` |
| `pythagSquares` | `√(a² + b²)` | ∃ `a,b ∈ [minLeg,maxLeg]` with hyp = `targetC` | `targetC` unreachable |
| `clockAngles` | — | each target multiple of 30°, `0 < θ ≤ 180` | non‑multiple‑of‑30 (unreachable snap) |
| `rayAim` / `distanceFlight` | `atan2`, `hypot` | `origin ≠ target`, both in grid | coincident / off‑grid |
| `slider` | `hypotenuse` / `area` / `perimeter` | ∃ slider combo within `tolerance` of `target` | no reachable solution |
| `plot` | — | `min < target < max`, `(target − min) % step === 0` | off‑tick with tol 0 |
| `gridShape` / `decomposeArea` | cell‑set geometry | cells in‑bounds, no dups, `total === cells.length` | disconnected region |
| `slideShape` / `mirrorShape` / `spinShape` | translation / reflection / rotation matrix | transformed shape lands on `target`/`vector` ± tol **and** stays in grid | image leaves grid |
| `multipleChoice` / `sortBins` | (structural) | exactly one correct option / every item has a valid bin | duplicate/no correct answer |

## Appendix B — LLM I/O sketch (schema‑constrained)

```ts
// Generation request (server proxy)
interface GenerateLessonRequest { kind: 'lesson'; topicId: string; difficulty: 1|2|3; seed: number; mastery: Record<string, number> }
interface DesignProblemRequest  { kind: 'design'; scenario: string }

// The model is constrained (function-calling/JSON schema) to return Step/Lesson JSON
// matching src/content/types.ts. Server returns the raw candidate; the CLIENT runs
// validate() + verifyStep() before anything renders. No trust is placed in the model output.
```

## Appendix C — Out of scope (Phase 2) / future hooks

- Phase 3 (learning science) can layer spaced repetition on top of generated practice and use the same verifier.
- Community sharing / a public library of designed problems.
- Generating brand‑new *interaction types* (would require new renderer components).
- Symbolic CAS beyond `mathjs` (e.g. for proofs).
