# Product Requirements Document — "Brilliant for Geometry" (Phase 1 MVP)

**Chosen subject:** Geometry
**Persona:** Middle/high school geometry students
**Stack:** Vite + React 19 + TypeScript (frontend) · Firebase Auth + Cloud Firestore (backend/persistence)
**Scope of this document:** Phase 1 MVP only — no AI features, not deployed.

---

## 1. MVP Overview

We are building a learn-by-doing geometry app, modeled on brilliant.org. Instead of videos or walls of text, every lesson drops the learner into an interactive problem: they manipulate a figure (drag a point, adjust a slider, measure an angle, plot a value) and get instant, specific feedback on every action. Wrong answers get a hint or written explanation; right answers get positive reinforcement. The product is intentionally narrow — geometry only — so we can go deep instead of wide.

Core principles:
- **Interactive and visual first.** Every lesson has at least one figure the learner directly manipulates and watches respond in real time.
- **Instant, specific, hand-written feedback.** No generated content. All hints and explanations are authored by us.
- **Short lessons.** Each lesson is a few minutes — long enough to teach one idea, short enough that finishing feels good.
- **A guided path.** Six hardcoded lessons that build on each other; completing one unlocks and recommends the next.
- **Progress that persists.** Stop mid-lesson, log out, return later (even on another device), and pick up exactly where you left off — with streaks intact.

Phase 1 ships **6 hardcoded lessons** (see Section 6). No AI, no generated lessons, no deployment.

## 2. Target User & Personas

The broad audience is anyone trying to get better at math. For geometry specifically, we target **middle and high school students** learning or reviewing geometry, plus self-learners who want intuition rather than rote formulas.

- **Primary persona — Maya, 8th grader.** Wants better test grades. Struggles to picture geometry problems from text alone. Needs to *see* and *touch* the figure to understand it.
- **Secondary persona — Diego, 10th grader.** Comfortable with the basics but wants to know why the math matters and how it connects to the real world.

## 3. User Stories

- As a middle school student who wants better grades, I want to **visualize and manipulate** geometry problems so that I can solve them with confidence on exams.
- As a high school student, I want to **see how geometry connects to real life** so that I can apply what I'm learning beyond the classroom.
- As a returning learner, I want my **progress and streak to be saved** so that I can stop mid-lesson and continue later without losing my place.
- As any learner, I want **instant feedback with a hint when I'm wrong** so that I can recover and actually learn, instead of just seeing a red X.
- As a new user, I want to **create an account with my name** so that my progress is tied to me across devices.

## 4. Tech Stack

- **Frontend:** Vite + React 19 + TypeScript (existing scaffold). Geometry figures rendered with **SVG** for crisp, touch-friendly, 60fps interaction. Styling kept lightweight/responsive (CSS modules or plain CSS). Optional: React Router for page navigation.
- **Auth:** Firebase Authentication — email/password **and** Google sign-in.
- **Database / persistence:** Cloud Firestore (per-user progress, streaks, history).
- **Hosting:** Not deployed in Phase 1. Local `vite dev` only.

## 5. Core Features (Phase 1)

1. **Accounts (auth):** Sign up / log in with email/password or Google. Capture a display name. Protected routes — lessons require login.
2. **Course path / home screen:** Visual list of the 6 lessons showing lock/unlock state, completion, and which lesson is recommended next.
3. **Interactive lessons:** Each lesson is a sequence of interactive steps driven by a content model (not hardcoded HTML).
4. **At least one rich interaction beyond multiple choice** per lesson (drag a point, slider, plot, angle drag, reorder steps).
5. **Responsive visual figures:** SVG diagrams that update live as the learner manipulates them.
6. **Instant, specific feedback:** Correct → positive reinforcement and advance. Incorrect → hand-written hint/explanation; let them retry. Feedback renders in <100ms.
7. **Persistent progress:** Current lesson, current step, per-step answers/attempts, and completion saved to Firestore and restored on return.
8. **Habit loop:** Daily streak (current + longest), "recommend next lesson," and a **review prompt** that surfaces a hint or an easier re-explanation when a learner gets the same step wrong repeatedly.
9. **Mobile-friendly:** Works well on phone-sized screens with touch input.

## 6. Lesson Curriculum (6 hardcoded lessons)

A linear path where each lesson builds on the previous. Lesson N+1 unlocks when lesson N is completed.

- **Lesson 1 — Points, Lines, Rays & Segments.** Identify and build the basic objects. *Interaction:* drag endpoints to form a segment / extend a ray on an SVG canvas; tap to classify objects.
- **Lesson 2 — Angles & Measuring.** Acute/right/obtuse; degrees. *Interaction:* drag a ray to set an angle and read the live degree measure; match a target angle within tolerance.
- **Lesson 3 — Triangles & the Angle-Sum Rule.** Interior angles sum to 180°. *Interaction:* drag a triangle's vertices and watch the three angles update and always sum to 180°; solve for a missing angle.
- **Lesson 4 — The Pythagorean Theorem.** a² + b² = c². *Interaction:* drag the legs of a right triangle via a slider/handles, watch the squares on each side resize, and compute the hypotenuse.
- **Lesson 5 — Area & Perimeter.** Rectangles and triangles. *Interaction:* drag to resize a shape on a grid and watch area/perimeter update; plot the value that matches a target.
- **Lesson 6 — Transformations & Symmetry.** Translation, reflection, rotation. *Interaction:* drag/flip a shape to map it onto a target; identify lines of symmetry.

Each lesson contains ~3–6 steps mixing a concept intro, at least one direct-manipulation problem, and a wrap-up check. All content (prompts, hints, explanations) is hand-written.

## 7. Content Model (data-driven lessons)

A lesson is **data**, not markup, so we can add lessons fast and so a frontend renderer can drive everything. Proposed TypeScript shape:

```ts
type StepType =
  | "concept"          // explanatory intro, optional figure, "Continue"
  | "multipleChoice"   // tap an option
  | "dragPoint"        // drag an SVG point/vertex to satisfy a condition
  | "slider"           // adjust a value, figure responds
  | "angleDrag"        // rotate a ray to a target angle
  | "plot";            // place/select a value on a number line or grid

interface Step {
  id: string;
  type: StepType;
  prompt: string;
  figure?: FigureConfig;          // SVG figure params for this step
  options?: { id: string; label: string }[]; // for multipleChoice
  answer: AnswerSpec;             // expected value/condition + tolerance
  feedback: {
    correct: string;             // hand-written positive feedback
    hints: string[];             // escalating hints shown on wrong attempts
    explanation: string;         // shown after repeated misses / on reveal
  };
}

interface Lesson {
  id: string;
  order: number;
  title: string;
  summary: string;
  estimatedMinutes: number;
  steps: Step[];
}
```

Lessons live in a typed `lessons.ts` (or per-lesson files) in the repo. The renderer maps `step.type` to a component and uses `answer` + `tolerance` for instant client-side checking.

## 8. Interactivity & Visual Requirements

- Figures rendered as **SVG** so they're sharp, scalable, and touch-draggable; geometry math (angles, distances) computed in plain TypeScript.
- Direct manipulation supported via mouse **and** touch (pointer events).
- Answer checking is **client-side and instant** (geometry comparisons with sensible tolerance, e.g. ±2° for angles, ±1 grid unit for positions).
- Every interactive step has a visible live readout (e.g. current angle, current area) so the learner sees cause and effect.

## 9. Progress, Mastery & Habit Loop

- **Resume:** Persist `currentLessonId` + `currentStepIndex` so the learner returns to the exact step. Per-step state (attempts, last answer, solved) is saved.
- **Unlock/recommend:** Linear unlock. The home screen highlights the next incomplete unlocked lesson as "Recommended next."
- **Streak:** Track `current` and `longest` streaks plus `lastActiveDate`. Completing any lesson activity on a new calendar day increments the streak; a missed day resets current.
- **Review on repeated wrong:** After 2 wrong attempts on a step, escalate from short hint → fuller explanation, and offer a "review the concept" link back to the relevant concept step before moving on.
- **Lightweight mastery signal:** Per-lesson score = correct-on-first-try ratio, stored for display (informs future phases; no adaptive AI in Phase 1).

## 10. Data Model (Firestore)

```
users/{uid}
  displayName: string
  email: string
  createdAt: timestamp
  streak: { current: number, longest: number, lastActiveDate: string }  // YYYY-MM-DD

users/{uid}/progress/{lessonId}
  status: "locked" | "unlocked" | "inProgress" | "completed"
  currentStepIndex: number
  steps: { [stepId]: { attempts: number, solved: boolean, lastAnswer?: any } }
  masteryScore: number        // 0..1, correct-on-first-try ratio
  startedAt: timestamp
  completedAt?: timestamp
  updatedAt: timestamp
```

Firestore security rules: a user can read/write only documents under their own `users/{uid}`. Lesson *content* is bundled in the app (not stored in Firestore) for Phase 1.

## 11. Authentication

- Firebase Auth with **email/password** and **Google** providers.
- Sign-up collects a display name (stored on the user doc and on the Firebase profile).
- Routes for lessons/home are guarded; unauthenticated users are redirected to login.

## 12. Mobile & Performance Targets

- Feedback on an answer appears in **<100ms** (client-side checks).
- Interactive SVG stays smooth at **~60fps** during manipulation.
- Lesson loads to first interaction in **<2s**.
- Fully usable on phone-sized screens with touch.

## 13. Out of Scope for Phase 1

- No AI of any kind: no chatbot/tutor, no model calls, no AI-generated lessons or feedback.
- No deployment — local development only until the experience is polished.
- No fixed beyond-the-6 lesson generation; the 6 lessons are hand-authored and final for Phase 1.
- No social features, payments, or admin/content-authoring UI.

## 14. Acceptance Criteria (maps to the MVP testing scenarios)

Phase 1 is done when a tester can:
1. Sign up / log in (email or Google) with a display name.
2. Complete a geometry lesson end-to-end, get some problems wrong, and use the hand-written feedback to recover.
3. Manipulate an interactive figure and watch the visual respond in real time.
4. Leave mid-lesson, return (incl. another device), and find progress **and** streak preserved.
5. Finish a lesson and see the path recommend a sensible next lesson.
6. Do all of the above on a phone-sized screen.


****Extra information (not part of PRD)
Background
Most learning apps hand you a video and a quiz. Brilliant does the opposite. You learn by doing. Every lesson drops you into a problem, lets you poke at it, gives instant feedback, and only then shows the idea behind it. You play with a concept until it clicks instead of watching someone explain it.

That is harder to build than a video player. It means real interactive problems, not multiple-choice trivia. It means visual simulations the learner can manipulate. It means instant, specific feedback on every tap. And it means a path that adapts: track what someone has mastered, fill gaps before they grow, and recommend what to do next. Wrap it in streaks and milestones so people come back tomorrow.

Your job: pick one subject and build a learn-by-doing app that teaches it well. Real interactions, real mastery tracking, a path that brings people back. Depth in one area, not a shallow tour of many.
Why This Matters
Passive content does not stick. Active problem-solving does. You are building the thing that makes hard ideas feel easy: a lesson someone can touch, get wrong, and figure out on their own. Pick a subject you can make genuinely great, and the depth will show.
Pick Your Domain
Before you write code, commit to one subject. The whole platform gets built for that subject. This is the most important decision you will make this week, so choose something you can teach through interaction, not just text.

Good picks, with the kind of interaction that fits each:
Algebra: drag terms across an equation, balance both sides, plot lines on a grid.
Probability and statistics: run simulations, drag distributions, sample from a deck or dice and watch the result.
Physics: adjust a slider on a projectile, a circuit, or a pendulum and watch it respond.
Python or programming: small code or logic puzzles with instant run-and-check feedback.
Geometry: drag points, measure angles, build and transform shapes.
Logic and puzzles: deduction grids, truth tables, step-by-step reasoning you build.

You can pick something off this list or bring your own. The bar: it must be teachable through hands-on interaction and visuals, and you must be able to build several real lessons in it this week. State your chosen subject at the top of your README and design everything around it.
The Cadence: Build in Three Phases
This project has a strict order. Build the app first. Add intelligence second. Add learning science third. Do not skip ahead. Each phase has to stand on its own before the next one starts.

Phase 1, MVP by Wednesday: the core learn-by-doing app. No AI. None.
Phase 2, AI features by Friday: decide what AI should do here, then build it.
Phase 3, Learning science by Sunday: layer evidence-based techniques on top.

The reason for the order: if the app does not teach without AI, no AI will save it. Prove the core experience works, then make it smarter, then make it stick.
Phase 1: MVP (by Wednesday)
This is a hard gate, and it has a hard rule: no AI features in the MVP. No model calls, no generated content, no chatbot tutor. Build the learn-by-doing app by hand so the core experience stands on its own. To pass, you need:
A chosen subject, stated clearly, with the whole app built for a specific user persona
One interactive lesson on a real concept in that subject, built around hands-on problems, not a video or a wall of text
At least one problem the learner manipulates directly (drag, tap, adjust a slider, plot a point, reorder steps)
A visual element they can interact with (a diagram, simulation, or chart that responds), appropriate to your subject
Instant, specific feedback on each answer, right or wrong, with a short explanation, written by you, not generated
Progress that persists: finish part of a lesson, come back, pick up where you left off
Accounts and names (auth)
Works on mobile screen sizes
Deployed and public

The MVP is not about how many lessons you have. It is about whether one lesson actually teaches your subject without any AI doing the work. A single hand-built lesson that makes a hard idea click beats a library of click-next slideshows.
Example Architecture
At minimum:
A content model that describes a lesson as a sequence of interactive steps (concept, problem, feedback), not a blob of HTML. This is what lets you add lessons in your subject fast, and later lets AI generate them.
A frontend that renders those steps, captures the learner's interactions, and gives instant feedback driven by the content model.
A progress and mastery layer that records what the learner has done, what they got right, and what to show next within your subject.
A persistence layer so progress, streaks, and history survive across sessions and devices.
Interactive Lessons
A lesson is a short sequence of steps, each one interactive. A step introduces an idea, then makes the learner do something with it: solve a problem, manipulate a figure, predict an outcome, sort items. Every answer gets instant feedback. Wrong answers get a hint or an explanation, not just a red X. Keep lessons short, a few minutes each, so finishing one feels good.

Build at least one rich problem type beyond multiple choice, and make it fit your subject. A slider that changes a graph, a draggable diagram, a number line you plot on, a tap-to-build sequence, a small code or logic puzzle. The interaction should teach the idea, not decorate it.
Visual and Hands-On
Brilliant lessons are visual. A concept should have something the learner can see change as they act. Show a simulation, animate a result, or update a chart in response to input. The learner should be able to experiment and watch what happens. The right visual depends on your subject, so design it for the concepts you are teaching.
Course Path and Mastery
Group your lessons into a course with a clear path through the subject. Track what the learner has mastered and unlock or recommend what comes next. Remember where they stopped. When they get something wrong repeatedly, surface a review or an easier step before moving on. The path should feel like it knows where they are in your subject.
The Habit Loop
People learn when they come back. Add streaks, milestones, and a sense of daily progress. Show how far they have come and what is next. Make finishing a lesson satisfying. This is not decoration. It is the difference between an app people open once and one they open every day.
Persistence and Mobile
Progress, streaks, and history persist across sessions and devices. Leave mid-lesson, come back on your phone, and continue. The app works well on mobile screen sizes, since that is where a lot of learning happens.
MVP Testing Scenario
We will test with:
A learner completing one lesson in your subject end to end, getting some problems wrong, and using the feedback to recover.
A learner manipulating the interactive element and watching the visual respond in real time.
A learner leaving mid-lesson and returning to confirm progress and streak persist.
A learner finishing a lesson and seeing the path recommends a sensible next step in the subject.
The whole thing on a phone-sized screen.
MVP Performance Targets
Feedback on an answer appears instantly, under 100ms.
Interactive visuals stay smooth at 60 FPS while the learner manipulates them.
Lessons load fast, under 2 seconds to first interaction.
Works on mobile screen sizes with touch input.
Multiple concurrent learners with no slowdown.
We test on your deployed app. Make it hold up under load.
Depth Over Breadth
This is the rule that decides Phase 1. We would rather see five excellent lessons that build on each other in one subject than thirty thin lessons spread across many. Pick a subject, map a real learning path through it, and make each lesson teach. A learner should be able to start your course knowing little and come out understanding something real. Breadth is easy and forgettable. Depth is what makes Brilliant Brilliant.
