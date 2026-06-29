# Phase 3 PRD — Learning Science

> **Phase order (from the brief):** build the app (Phase 1) → add intelligence (Phase 2) → **add
> learning science (Phase 3)**. This document specifies Phase 3. It builds on the working app
> (`PRD.md`) and the AI layer (`PHASE2-AI-PRD.md`), and turns the brainstorm in `learningscience.md`
> into concrete requirements.

## 0. Context — what already exists

GeoSpark is a learn-by-doing geometry app: 6 hand-authored linear lessons, 75 steps (33 `concept`
+ 42 gradable), 36 step types, with instant feedback and a points/unlock system.

Relevant existing building blocks Phase 3 reuses:
- Per-step tracking: `attempts`, `solved`, `firstTry` — `src/progress/types.ts:8–13`
- Scoring: 100/question, −25/wrong attempt, 60% to unlock — `src/progress/scoring.ts:4–14`
- `masteryScore` (first-try %) computed but **display-only** — `src/progress/ProgressContext.tsx:157–160`
- Unlock gate (UI-only) — `src/progress/ProgressContext.tsx:185–194`
- Feedback model `{correct, hints[], explanation}` — `src/content/types.ts:6–13`
- Feedback flow (hint after 1st miss, explanation after 2nd) — `src/pages/LessonPage.tsx:51,117–120,167–176`

**Current learning-science gaps (the audit):** wrong answers don't explain *why*; mastery is
display-only, not enforced; no per-concept tracking; no spaced repetition; no interleaving; support
escalates rather than fades.

## 1. Goals & non-goals

### Goals
- Make geometry **stick**: durable, transferable retention — not just lesson completion.
- Implement six evidence-based techniques **for real**, reusing existing infrastructure where possible.
- **Measure and show** the effect with a visible retention artifact.

### Non-goals (Phase 3)
- No full ML/Bayesian knowledge-tracing model (a simple per-concept scheduler is enough).
- No rewrite of the 36 step components — reuse them.
- No change to the Phase-2 AI generation/verification pipeline (we may *call* it for review variants).
- No removal of the existing points system (mastery layers **on top**).

## 2. The six techniques and how GeoSpark implements them

| # | Technique | GeoSpark implementation |
|---|---|---|
| 1 | **Immediate explanatory feedback** | Wrong answers show *answer-specific* "why" on the **first** miss, targeting known geometry misconceptions |
| 2 | **Mastery learning** | A real, visible mastery signal per concept/lesson that **gates** progression (not just points) |
| 3 | **Retrieval practice** | Daily Review = **AI-invented, brand-new interactive activities** (Invent Engine) for each concept — never reusing lesson questions; a one-tap self-rating captures recall |
| 4 | **Spaced repetition** | Per-concept scheduler resurfaces concepts at growing intervals; self-rating (got-it/need-practice) advances or resets the ladder, so reviewing keeps strengths/weaknesses current |
| 5 | **Interleaving** | The Daily Review covers **all concepts in one mixed session, ordered weakest-first** |
| 6 | **Scaffolding + desirable difficulty** | Full support on early encounters of a concept; support **fades** as mastery rises |

Techniques 3–5 are delivered together by one feature (**Daily Review**) on top of a shared
**per-concept model**.

## 3. Functional requirements

### Concept model (foundation — unblocks 2–6)
- **FR-C1:** Every gradable step is tagged with one (or more) `concept` id(s) (e.g. `area`,
  `pythagorean`, `angle-sum`, `reflection`). Add `concept?: ConceptId` to `StepBase` in
  `src/content/types.ts`; annotate steps in `src/content/lessons.ts`.
- **FR-C2:** Maintain a canonical list of concept ids with display names (e.g.
  `src/content/concepts.ts`).
- **FR-C3:** Track **per-concept mastery state** per user in Firestore: `{ concept, level (0..1),
  lastSeen, dueAt, history[] }`. Derived from existing `firstTry`/`attempts` signals.

### 1. Immediate explanatory feedback
- **FR-F1:** On the **first** wrong attempt, show feedback that explains *why the submitted answer is
  wrong* (not just "−25, try again").
- **FR-F2:** For `multipleChoice`, support **per-option explanations** keyed to the misconception each
  distractor represents (extend the option/feedback type).
- **FR-F3:** For interactive steps, show an **answer-specific** message where feasible (e.g. "you used
  width 5, but the floor is 8 wide"); otherwise fall back to the concept hint.
- **FR-F4:** Feedback still renders <100ms (client-side), consistent with `PRD.md`.

### 2. Mastery learning
- **FR-M1:** Define a **clear mastery signal**: a concept is "mastered" when first-try success on it
  reaches a threshold (default **≥ 80%** over its recent attempts). Lesson "mastered" = all its
  concepts mastered.
- **FR-M2:** Surface mastery visibly: a "Mastered ✓" badge distinct from "Passed (60%)" on
  `DonePage` / `HomePage`.
- **FR-M3 (DECIDED):** Unlocking the next lesson **requires the previous lesson "mastered"** (all its
  concepts mastered), not 60% points. Because Daily Review encounters count toward concept mastery,
  **review is a valid path to unlock**. Points remain as secondary display only. Admin bypass unchanged.
- **FR-M4:** Skipped steps mark their concept **not yet mastered** and enqueue it for review (no silent
  passing of skipped material).

### 3. Retrieval practice  — (IMPLEMENTED: all-creative Invent Engine)
- **FR-R1:** Daily Review items are **recall** tasks — the learner must *do* something hands-on and
  produce an answer, never just recognize one.
- **FR-R2 (DECIDED — full creative generation):** The **entire** Daily Review is generated by the
  **Invent Engine** (`generateWidget`). For each concept the LLM **invents a brand-new, original
  interactive activity from scratch** — full creative latitude over scenario, visuals, and interaction.
  There is **no restriction to a fixed set of "verifiable shapes."**
- **FR-R3 (DECIDED — never reuse the 6 lessons):** Review prompts explicitly instruct the model to
  **NOT reuse a textbook/lesson setup**; every activity is fresh and different each session, so a
  learner cannot memorize a specific question. Authored lesson questions are used **only** as a
  last-resort fallback if generation outright fails (not as a normal source).
- **FR-R4 (DECIDED — self-rating drives the loop):** Because invented activities are **open-ended and
  cannot be auto-graded**, the learner gives a one-tap **self-rating after each activity
  ("✅ Got it" / "🔁 Need more practice")**. This rating is the got-it/missed-it signal that feeds
  spacing + mastery (the standard spaced-repetition approach, e.g. Anki). Acceptable here because the
  app is for a project demo, not real users — the goal is to showcase creative, well-designed AI
  features and a working learning-science loop.
- **FR-R5:** What is stored in Firestore is **per-concept performance** (mastery/spacing state), **not
  specific questions** — questions are always freshly invented.

### 4. Spaced repetition  — (IMPLEMENTED)
- **FR-S1:** A lightweight scheduler computes each concept's `dueAt` on a fixed ladder
  (`[1, 3, 7, 14, 30]` days). A "Got it" self-rating advances the interval; "Need practice" resets it
  to the shortest (resurface next session).
- **FR-S2:** **Reviewing updates the model both ways:** a concept the learner aced before can slip back
  to weak ("Need practice"), and a weak one strengthens ("Got it"). Mastery is *not* frozen at lesson
  time — it tracks ongoing review performance.
- **FR-S3:** Per-concept mastery/spacing state is loaded at app start and reflected in the Retention
  panel.

### 5. Interleaving  — (IMPLEMENTED: all concepts, weakest-first)
- **FR-I1:** The Daily Review covers **ALL concepts in one mixed session** (not blocked by topic).
- **FR-I2 (DECIDED — weakest-first):** Concepts are **ordered weakest-first** (lowest mastery first),
  so the review *focuses on all concepts but prioritizes the weaker ones*.
- **FR-I3:** Session size is bounded (currently all 6 concepts) so a review feels short and finishable.

### 6. Scaffolding + desirable difficulty
- **FR-SC1:** Early encounters of a concept show full support (current behavior: concept intro +
  visual scaffolds + hints). As the concept's mastery rises, **fade** support: fewer/no automatic
  hints, hints only on request.
- **FR-SC2:** Keep the existing points penalty as a desirable difficulty; do not make problems
  trivially easy after errors.

### Measurement (required by the brief: "measure or show their effect")
- **FR-MEAS1:** A **Retention panel** on the home screen showing, per concept: mastery level (bar),
  status (learning / mastered / due for review), and next review date.
- **FR-MEAS2:** Track and display **first-try success per concept over time** (e.g. across successive
  reviews) to visibly demonstrate that spacing improves retention.
- **FR-MEAS3:** A simple before/after signal: success on a concept's **first** review vs **later**
  reviews.

## 4. Data model changes

### Content (`src/content/types.ts`, `src/content/concepts.ts`)
```ts
type ConceptId = 'points-lines' | 'angles' | 'angle-sum' | 'pythagorean'
              | 'area' | 'perimeter' | 'transformations' | ... // canonical list

interface StepBase {
  id: string
  prompt: string
  feedback: Feedback
  concept?: ConceptId          // FR-C1
}

// FR-F2: richer MC feedback (optional per-option "why wrong")
interface MultipleChoiceOption {
  id: string; label: string;
  whyWrong?: string            // shown immediately if this distractor is picked
}
```

### Progress (Firestore, `src/progress/`)
```ts
// FR-C3 — per-concept mastery (kept separate from per-lesson progress)
interface ConceptMastery {
  concept: ConceptId
  level: number                // 0..1 rolling first-try success
  attemptsHistory: { ts: number; firstTry: boolean }[]
  lastSeen: number
  dueAt: number                // FR-S1 scheduler output
  intervalIndex: number        // position on the spacing ladder
}
// stored at users/{uid}/conceptMastery/{conceptId}
```
Keep this **separate** from `LessonProgress` so the existing `masteryScore`/`points` math for the
core 6 lessons stays clean (mirrors the Phase-2 decision to isolate generated-lesson stats).

## 5. UX surfaces
- **Daily Review screen** (new route, e.g. `/review`): a short, interleaved, recall-first session of
  due concepts; entry point on `HomePage` ("N concepts due for review").
- **Retention panel** on `HomePage`: per-concept mastery bars + due status (the measurement artifact).
- **Sharper feedback** inline in `LessonPage` and step components (per-option / answer-specific).
- **Mastery badges** on `DonePage` / `HomePage` ("Mastered ✓" vs "Passed").

## 6. Success criteria
- A learner can complete a lesson, get items wrong, and receive **immediate, answer-specific** feedback.
- Progression requires a **visible mastery signal**, not just 60% points.
- Concepts the learner has seen **resurface** in a mixed Daily Review at growing intervals; missed
  concepts come back sooner.
- The **Retention panel** visibly shows per-concept mastery and demonstrates improvement across
  spaced reviews (the "show the effect" deliverable).

## 7. Build order
1. **Concept tagging** (FR-C1–C3) — unblocks everything.
2. **Sharper feedback** (FR-F1–F4) — independent quick win; ship first.
3. **Mastery signal + gate** (FR-M1–M4) — reuse existing `firstTry` data.
4. **Per-concept scheduler** (FR-S1–S3).
5. **Daily Review** screen (FR-R*, FR-I*) — delivers retrieval + interleaving + spacing together.
6. **Retention panel + metrics** (FR-MEAS1–3) — the measurement.
7. *(Stretch)* **Fading scaffolding** (FR-SC1–2).

## 8. Risks & mitigations
| Risk | Mitigation |
|---|---|
| Mastery gate too strict → frustration | Tunable threshold; allow "passed" fallback; clear "due for review" rather than hard lock |
| Concept tagging is tedious for 42 steps | Tag by lesson-subtopic in one pass; default a step's concept to its lesson's primary concept |
| Invent-Engine review activities are slow to generate | **Prefetch** the next activity while the learner works the current one; show an elapsed-time loader; authored step only as a last-resort fallback on outright failure |
| Spacing math edge cases | Start with a simple fixed ladder before any SM-2-style ease |
| Mastery math polluted by review/generated items | Keep `conceptMastery` separate from core `LessonProgress` |

## 9. Out of scope (Phase 3)
- Full adaptive difficulty engine / per-learner item selection beyond the spacing ladder.
- Knowledge-tracing ML models.
- Social/leaderboard features.

## 10. Decisions (locked)
- **Review item source — DECIDED (FR-R2/R3, IMPLEMENTED):** the **entire** Daily Review is generated
  by the **Invent Engine** (`generateWidget`) — brand-new, fully creative interactive activities per
  concept, with **no restriction to verifiable shapes** and **no reuse of the 6 lessons' questions**.
  Authored steps are only a last-resort fallback on generation failure. (This supersedes the earlier
  plan to use the verified `designProblem` generator for review.)
- **Ungraded review → self-rating — DECIDED (FR-R4):** invented activities can't be auto-graded, so a
  one-tap **"Got it / Need more practice"** rating supplies the spacing/mastery signal.
- **Review scope/order — DECIDED (FR-I1/I2):** review covers **all concepts**, **weakest-first**.
- **Mastery threshold — DECIDED:** a **concept** is "mastered" when its rolling **first-try success
  ≥ 80%** over its most recent ~3 encounters (lesson + reviews). A **lesson** is "mastered" when
  **all its concepts are mastered**. Daily Review encounters count toward concept mastery, so **review
  is a valid path to mastery** (a learner who bombed first-try in the lesson can still master it via review).
- **Spacing algorithm — DECIDED:** simple **fixed ladder** `[1, 3, 7, 14, 30]` days. Correct first-try
  → advance one rung; wrong or skipped → **reset to rung 0** (due next session). No SM-2 ease for now.
- **Skip policy — DECIDED:** **keep Skip**, but a skipped step always **marks its concept
  not-yet-mastered and enqueues it for review** (due next session). No silent passing.
- **Gate strictness — DECIDED:** unlocking the next lesson **requires the previous lesson "mastered"**
  (true mastery learning, per the brief), with a clear **"Mastered ✓"** signal. Because review counts
  toward mastery, the gate is meaningful but never a dead end — the path forward is always "review to
  master." Admin accounts bypass the gate (unchanged). The old 60%-points value is kept as secondary
  display only, not the gate.
