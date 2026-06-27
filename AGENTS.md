# AGENTS.md

Brilliant-style interactive **geometry learning app**. React 19 + TypeScript + Vite, Firebase for auth/progress. Lessons are *data*: a `Step` discriminated union rendered by `StepRenderer`.

## Commands

- Dev server: `npm run dev`
- Tests (single run): `npm run test:run`   ·   watch: `npm run test`
- Typecheck: `npm run typecheck`  (`tsc -b`)
- Full build: `npm run build`  (`tsc -b && vite build`)
- Lint: `npm run lint`

## Definition of Done — run the loop, finish only when green

Any task that changes code is **NOT complete** until all three gates pass from the repo root:

1. `npm run test:run` — all tests green
2. `npm run typecheck` — no type errors
3. `npm run lint` — no errors

The loop you must follow:

- Make the change. If you add or change behavior, write/update `*.test.ts` for it (test-first when practical).
- Run the three gates.
- If anything is red, read the failure, fix it, and re-run. **Repeat until everything is green.**
- Do **not** stop or report the task as done while any gate is red. If a gate genuinely cannot pass, say so explicitly and explain why — never silently skip it.

## Tests

- Runner: **vitest**. Put unit tests next to the code as `*.test.ts`.
- Everything in the AI verification/generation path (`src/ai/**`, once it exists) must be tested — including the verifier checks themselves.
- `src/content/verification.test.ts` is the working prototype of the runtime verifier (see below); keep its invariants passing and extend it as new step types are added.

## AI-generated content (product behavior)

- All AI-generated `Step`/`Lesson` output must pass the runtime self-verification suite **before** it is shown to a learner (see `PHASE2-AI-PRD.md` §2.5). Never render content that fails; fall back to deterministic content.
- `mathjs` is the correctness oracle: the model proposes, `mathjs` verifies.

## Conventions

- TypeScript strict; no `any` in new code. Model all new content on the existing `Step` union in `src/content/types.ts`.
- Reuse existing `Step` types/renderers — don't invent new interaction components for generated lessons.
- Every AI feature must degrade gracefully when AI is off (deterministic fallback).
- Comments explain *why*, not *what*. Don't narrate code.

## Key files

- `src/content/types.ts` — `Step` / `Lesson` model
- `src/content/lessons.ts` — authored curriculum (+ `lessonById`, `nextLesson`)
- `src/components/steps/StepRenderer.tsx` — maps `Step` → component
- `src/progress/ProgressContext.tsx` — unlock / recommend / persist
- `src/pages/LessonPage.tsx` — check / hint / solved flow
