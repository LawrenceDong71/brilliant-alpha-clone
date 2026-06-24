# GeoSpark — Learn Geometry by Doing

**Subject: Geometry.** GeoSpark is a Brilliant.org-style, learn-by-doing app for middle and high school
geometry. Every lesson drops you into an interactive problem — drag a point, rotate a ray, resize a
shape — and gives instant, hand-written feedback. This is the **Phase 1 MVP**: no AI, runs locally.

## What's inside

- **6 hand-authored lessons** forming a linear path: Points/Lines/Rays → Angles → Triangles & the
  angle sum → Pythagorean theorem → Area & Perimeter → Transformations & Symmetry.
- **Direct-manipulation problems** rendered as SVG (drag rays/points/vertices, sliders, number-line
  plotting) with live readouts and instant client-side checking.
- **Instant, specific feedback** — every step has hand-written positive feedback, escalating hints,
  and a full explanation that surfaces after repeated misses.
- **Persistent progress** in Cloud Firestore: resume mid-lesson, on any device, with your streak intact.
- **Accounts** via Firebase Auth (email/password + Google), with display names.
- **Habit loop**: daily streak, linear unlock, "recommended next lesson", and review-on-repeated-wrong.
- **Mobile-first**, touch-friendly UI.

## Tech stack

Vite + React 19 + TypeScript · Firebase Authentication · Cloud Firestore.

## Getting started

```bash
npm install
```

### 1. Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com) and create a project.
2. Add a **Web app** to get your config.
3. Under **Build → Authentication → Sign-in method**, enable **Email/Password** and **Google**.
4. Under **Build → Firestore Database**, create a database (production mode is fine; rules below).

### 2. Add your config

Copy `.env.example` to `.env.local` and fill in the values from your Firebase web app config:

```bash
cp .env.example .env.local
```

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> If `.env.local` is missing, the app renders a friendly setup screen instead of crashing.

### 3. Firestore security rules

Paste the contents of [`firestore.rules`](firestore.rules) into the Firestore **Rules** tab so each
user can only read/write their own data.

### 4. Run

```bash
npm run dev
```

Open the printed local URL. Sign up, and start the first lesson.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build
- `npm run lint` — run ESLint

## Project structure

```
src/
  lib/firebase.ts        Firebase init (env-driven)
  content/               Content model types + the 6 hardcoded lessons (data, not HTML)
  auth/                  Auth context + protected routes
  progress/              Firestore progress, streaks, recommendations
  components/
    figures/             SVG geometry helpers + static illustrations
    steps/               Interactive step components (drag, slider, plot, MC, ...)
  pages/                 Login, Home (course path), Lesson player, Done, Setup
```

## Not in Phase 1

No AI of any kind, no deployment, no generated lessons — by design. See `PRD.md`.
