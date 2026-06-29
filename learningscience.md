# Phase 3 — Learning Science: Brainstorm & Plan

> Goal: layer evidence-based learning techniques on top of the working GeoSpark app
> so the geometry actually *sticks*. Pick a few, implement them for real, and show their effect.

---

## 1. What is "learning science"?

Learning science is the research-backed study of **how people actually learn and remember** — as
opposed to what *feels* productive. Decades of cognitive-psychology studies show that the study
methods that feel easy (re-reading, watching, highlighting) produce weak, short-lived learning,
while methods that feel *harder* in the moment (recalling from memory, spacing practice out,
mixing problem types) produce durable, transferable learning. These are called **desirable
difficulties**.

The six techniques in this phase are the most well-established of these:

| Technique | One-line definition | Why it works |
|---|---|---|
| **Retrieval practice** | Make learners *recall* the idea from memory, not just recognize it | The act of retrieving strengthens the memory far more than re-reading |
| **Spaced repetition** | Re-expose a concept at growing time intervals | Fighting the forgetting curve at the right moment cements long-term memory |
| **Interleaving** | Mix problem types in a session instead of blocking them | Forces learners to *choose* the right method, building discrimination + transfer |
| **Mastery learning** | Require real competence on a concept before unlocking the next | Prevents shaky foundations from compounding into later failure |
| **Scaffolding + desirable difficulty** | Start supported, then fade support so problems stay productively hard | Support prevents overwhelm; fading builds independence |
| **Immediate explanatory feedback** | When wrong, immediately explain *why* — not just "incorrect" | Corrects misconceptions before they harden |

---

## 2. What GeoSpark already does (current-state audit)

Audited via three parallel explorations of the codebase. Summary:

### Scoring & progression (`src/progress/`)
- 100 points per gradable question, **−25 per wrong attempt** (floor 0). `src/progress/scoring.ts:4–14`
- Unlock next lesson = previous lesson **completed AND ≥ 60% of max points**. `src/progress/ProgressContext.tsx:185–194`
- A `masteryScore` (= % of steps solved **first try**) is computed and shown on the Done screen — but it **does not gate anything**. `src/progress/ProgressContext.tsx:157–160`
- Per-step tracking exists: `attempts`, `solved`, `firstTry`. `src/progress/types.ts:8–13`
- Gating is **UI-only** (direct `/lesson/:id` URLs bypass it).

### Feedback (`src/pages/LessonPage.tsx`, `src/content/types.ts`)
- Each step has a `Feedback` object: `correct`, `hints[]`, `explanation`. `src/content/types.ts:6–13`
- Correct → shows `feedback.correct`. Wrong → **generic** "−25 pts, try again" banner.
- `hints[0]` after the 1st miss, `hints[1]` + full `explanation` after the 2nd. `src/pages/LessonPage.tsx:51,117–120,167–176`
- "Skip for now" appears after 2 misses (saves the step unsolved). `src/pages/LessonPage.tsx:190–192`

### Content (`src/content/lessons.ts`)
- 6 hand-authored linear lessons, 75 steps (33 concept / 42 gradable), 36 step types.
- ~67% of gradable steps are **constructed/interactive recall** (drag, build, aim, plot); ~19% are strict multiple-choice.
- Lessons are **blocked by topic**, both within and across lessons. No mixing.

### Audit verdict per technique

| Technique | Status today | Notes |
|---|---|---|
| Retrieval practice | 🟡 **Partial (already decent!)** | ~67% interactive recall — but Skip + escalating hints + recognition formats dilute it; no delayed/closed-book recall |
| Spaced repetition | 🔴 **Absent** | Each lesson is one-and-done; nothing resurfaces |
| Interleaving | 🔴 **Absent** | Strictly blocked by topic |
| Mastery learning | 🟡 **Soft** | 60% aggregate gate, not per-concept; can pass with skipped steps; `masteryScore` unused for gating |
| Scaffolding + desirable difficulty | 🟡 **Partial** | Has concept intros, visual scaffolds, points penalty; but support **escalates** (never fades), no adaptive difficulty |
| Immediate explanatory feedback | 🟡 **Weak** | Infrastructure exists, but wrong answers get a generic penalty, not "why"; explanation only after 2 misses |

**Headline:** GeoSpark already has a strong *retrieval-heavy* interactive core and the *data plumbing*
(`attempts`/`firstTry`/`masteryScore`) to support more — but it does nothing with that data, has no
memory across lessons, and its feedback doesn't yet teach on wrong answers.

---

## 3. Which techniques fit GeoSpark best?

Ranked by **impact × fit × achievability (by Sunday)**:

### Tier 1 — do these
1. **Immediate explanatory feedback** — *highest ROI, lowest effort.* The `Feedback` infrastructure
   already exists; you just make wrong answers teach. Geometry has very predictable misconceptions
   (e.g. confusing area vs perimeter, adding legs instead of squaring for Pythagoras), which map
   cleanly to per-wrong-answer explanations.
2. **Mastery learning** — *foundation already exists.* You already compute `masteryScore` and gate on
   points; tighten it into a real, visible mastery signal that actually controls progression.

### Tier 2 — the flagship (most impressive + measurable)
3. **Per-concept tracking → Spaced repetition + Interleaving (one feature)** — these three are
   naturally implemented *together*: tag each problem with a concept, track per-concept mastery, and
   build a **mixed review session** that resurfaces concepts at growing intervals (spacing), pulling
   from multiple lessons (interleaving), as recall problems (retrieval). One build, four techniques.

### Tier 3 — nice polish if time
4. **Scaffolding with fading support** — flip the current *escalating* hints into *fading* support:
   give more help early in a concept, less as the learner demonstrates competence.

---

## 4. Concrete implementation ideas (GeoSpark-specific)

### A. Immediate explanatory feedback (Tier 1)
- Extend the `Feedback` type (or `multipleChoice` options) with **per-wrong-answer explanations**.
  For MC: each distractor gets a "why this is wrong" string tied to the specific misconception.
- For interactive steps, show an **answer-specific** message ("You built 5×4 = 20, but the kitchen is
  8×5 — you used the wrong width") instead of the generic "−25, try again."
- Show the explanation **on the first wrong attempt**, not the second.
- *Effort:* low–medium. *Files:* `src/content/types.ts`, `src/pages/LessonPage.tsx`, MC/step components, and authoring richer feedback in `src/content/lessons.ts`.

### B. Mastery learning (Tier 1)
- Define a **clear mastery signal** per lesson: e.g. "every gradable step solved" or "first-try
  mastery ≥ X%" — not just 60% of points. Surface it as a badge ("Mastered ✓" vs "Passed").
- Make the gate use mastery, and **remove/limit Skip** for mastery (or mark skipped concepts as "not
  yet mastered" and queue them for review — ties into Tier 2).
- *Effort:* low (the data exists). *Files:* `src/progress/scoring.ts`, `src/progress/ProgressContext.tsx`, `DonePage.tsx`, `HomePage.tsx`.

### C. Per-concept tracking + spaced repetition + interleaving (Tier 2 flagship)
- **Tag steps with a `concept` field** (e.g. `'pythagorean'`, `'area'`, `'angle-sum'`). Add to `StepBase` in `src/content/types.ts` and annotate `src/content/lessons.ts`.
- **Track per-concept mastery** in Firestore (extend `LessonProgress`/profile): for each concept,
  store last-seen date, success/fail history, and a simple **due date**.
- **Scheduler:** a lightweight spaced algorithm (even a simple SM-2-lite or "ease" multiplier):
  - Got it right → next interval grows (1d → 3d → 7d → 14d …).
  - Got it wrong → resurface **soon** (e.g. next session).
- **Review session screen:** a "Daily Review" that pulls **due** concepts from **across lessons**
  (automatic interleaving) and presents them as **recall** problems (retrieval practice). Reuse
  existing step components; optionally reuse the AI `designProblem` generator to create *fresh*
  variants so learners recall the method, not a memorized answer.
- *Effort:* medium–high (the flagship). *Files:* `src/content/types.ts`, `src/content/lessons.ts`, `src/progress/` (new concept-mastery model + scheduler), a new `ReviewPage`, routing in `App.tsx`.

### D. Fading scaffolding (Tier 3)
- Track per-concept exposure; show full hints/visual aids on early encounters, then **withhold hints
  until requested** once the learner has demonstrated competence on that concept.
- *Effort:* medium (depends on C's per-concept data). *Files:* `LessonPage.tsx`, concept-mastery model.

---

## 5. How to measure / show the effect (required by the brief)

Pick at least one visible measurement:
- **First-try mastery per concept over time** — chart how a concept's first-try success improves
  across spaced reviews (directly shows retention). You already track `firstTry`.
- **Retention dashboard** — show each concept's mastery level + "due for review" status (makes
  spaced repetition *visible* and demonstrable).
- **Before/after on review items** — compare success on a concept's *first* review vs *later* reviews
  to show spacing working.
- **Lapse-and-recover** — show that concepts a learner missed get resurfaced sooner and then climb.

A simple **"Memory / Retention" panel** on the home screen (mastery bars per concept + next review
date) is the most convincing single artifact: it makes spaced repetition, mastery, and interleaving
all visible at once.

---

## 6. Recommended Phase-3 scope (realistic by Sunday)

A focused, synergistic set that hits **5 of the 6** techniques:

1. **Sharpen feedback so wrong answers teach** (Tier 1A) — quick win, immediate quality bump.
2. **Real mastery signal + gate** (Tier 1B) — small change, big pedagogical legitimacy.
3. **Per-concept tracking + a spaced, interleaved Daily Review of recall problems** (Tier 2C) — the
   centerpiece; delivers spaced repetition + interleaving + retrieval practice together.
4. **Measurement: a per-concept retention panel** (Section 5) — proves the effect.

This leaves fading scaffolding (Tier 3) as a stretch goal if time allows.

### Suggested build order
1. Add `concept` tags to steps (unblocks everything else).
2. Sharpen wrong-answer feedback (independent, ship early).
3. Tighten mastery gate using existing `masteryScore`.
4. Build per-concept mastery model + simple scheduler.
5. Build the Daily Review screen (interleaved, recall, spaced).
6. Add the retention panel for measurement.

---

## 7. Open questions to decide before building
- **Mastery bar:** what counts as "mastered" — all steps solved? first-try ≥ 80%? per-concept?
- **Review source:** reuse existing hand-authored steps, or generate fresh variants via the AI
  `designProblem` engine (better for true recall, costs API calls)?
- **Spacing algorithm:** simple fixed ladder (1/3/7/14d) vs SM-2-style ease — start simple.
- **Skip policy:** keep Skip but route skipped concepts into the review queue?
- **Scope of measurement:** one clear chart, or a full retention dashboard?
