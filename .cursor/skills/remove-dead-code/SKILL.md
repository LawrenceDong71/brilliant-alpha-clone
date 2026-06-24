---
name: remove-dead-code
description: Find and safely remove dead code (unused exports, files, components, variables, imports, types, and props) from this Vite + React 19 + TypeScript + Firebase app. Use when the user asks to remove dead code, delete unused code, clean up the codebase, prune unused exports/files, or tidy up imports.
disable-model-invocation: true
---

# Remove Dead Code

Systematically find and remove unused code from this Vite + React + TypeScript codebase, verifying after each change that the build and lint still pass.

## Scope of "dead code"

- Unused files/modules (no importers)
- Unused `export`s (exported but never imported)
- Unused local variables, functions, imports, and parameters
- Unused React components, hooks, and props
- Unused TypeScript types/interfaces
- Unreachable code and `if (false)` / commented-out blocks
- Unused `package.json` dependencies and scripts

## Workflow

Copy this checklist and track progress:

```
Dead Code Cleanup:
- [ ] Step 1: Establish a clean baseline (build + lint pass)
- [ ] Step 2: Detect candidates
- [ ] Step 3: Verify each candidate is truly unused
- [ ] Step 4: Remove in small batches
- [ ] Step 5: Re-run build + lint after each batch
- [ ] Step 6: Summarize what was removed
```

### Step 1: Baseline

Confirm the project compiles and lints before touching anything. If baseline fails, stop and report — do not mix unrelated fixes into a dead-code cleanup.

```bash
npm run build && npm run lint
```

### Step 2: Detect candidates

The TS config already enables `noUnusedLocals` and `noUnusedParameters`, so unused locals/params/imports surface via the build. For cross-file dead code (unused exports and files), use `knip` (no config needed for a Vite/React app):

```bash
npx knip
```

`knip` reports: unused files, unused exports, unused exported types, unused dependencies, and unlisted dependencies. Prefer it over manual searching.

If `knip` is unavailable/blocked, fall back to manual detection per symbol:

```bash
# Is this export imported anywhere? (run from repo root)
rg "fromYourSymbol|YourSymbol" src --type ts --type tsx
```

Use the Grep tool for these searches rather than raw shell when possible.

### Step 3: Verify before deleting

A symbol is only dead if ALL of these hold. Do not delete on a single signal.

- No imports anywhere in `src/` (check both `import { X }` and `import X`)
- Not referenced by string in routing/config (e.g. `react-router` route elements, lesson registries in `src/content/`)
- Not a public entry point: keep `src/main.tsx`, `index.html` references, `vite-env.d.ts`, and Vite/TS/ESLint config files
- Not used only in `scripts/*.mjs` (Firebase admin scripts run outside the Vite build)

**Project-specific watch-outs:**
- `src/content/lessons.ts` and step components in `src/components/steps/` may be wired together by data/registry rather than direct import. Confirm a step component is unreferenced in the lesson content before removing it.
- Firebase calls can have side effects; an "unused" import from `src/lib/firebase.ts` may still be needed for initialization.

### Step 4: Remove in small batches

- Delete whole unused files with the Delete tool; remove unused exports/symbols with StrReplace.
- Group related removals (e.g. one component + its now-unused imports/types) into one batch.
- After deleting a file, remove its now-orphaned imports too — these will show up in the next build.

### Step 5: Verify after each batch

```bash
npm run build && npm run lint
```

If anything fails, fix or revert that batch before continuing. Never end with a failing build.

### Step 6: Summarize

Report what was removed grouped by category (files, exports, deps), and note anything you intentionally kept and why (e.g. side-effect imports, registry-referenced components).

## Anti-patterns

- Do not delete based only on "looks unused" — verify with build + search.
- Do not remove config, entry points, or type-declaration files.
- Do not bundle behavior changes or refactors into a dead-code PR.
- Do not silence the TS unused checks instead of removing the code.
