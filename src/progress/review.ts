import type { ConceptId } from '../content/types'
import type { ConceptMastery, ConceptMasteryMap } from './types'

/**
 * Phase 3 spaced-repetition + mastery logic (pure functions).
 *
 * Spacing: a simple fixed ladder. A first-try-correct encounter pushes the next
 * review further out; a wrong or skipped encounter resets it to "due next
 * session". Mastery: rolling first-try success over a short recent window.
 */

/** Days until the next review after the Nth consecutive first-try success. */
export const SPACING_LADDER_DAYS = [1, 3, 7, 14, 30]
const DAY_MS = 86_400_000

/** A concept counts as "mastered" at/above this rolling first-try success. */
export const MASTERY_THRESHOLD = 0.75

/** How many recent encounters define the mastery level. */
const HISTORY_WINDOW = 4
/**
 * Minimum encounters before a concept can be "mastered" — prevents a single
 * first-try-correct (1/1 = 100%) from instantly mastering a concept and
 * unlocking the next lesson.
 */
const MIN_ENCOUNTERS = 3
/** Cap on stored history length. */
const HISTORY_CAP = 12

export function emptyConceptMastery(concept: ConceptId, now: number = Date.now()): ConceptMastery {
  return { concept, history: [], level: 0, intervalIndex: 0, dueAt: now, lastSeen: 0 }
}

function levelFrom(history: boolean[]): number {
  const recent = history.slice(-HISTORY_WINDOW)
  if (recent.length === 0) return 0
  return recent.filter(Boolean).length / recent.length
}

/**
 * Record an encounter with a concept and recompute mastery + next due date.
 * Only a first-try-correct answer advances the spacing ladder; anything else
 * (wrong, or correct only after hints) resets review to "next session".
 */
export function recordEncounter(
  prev: ConceptMastery,
  outcome: { firstTry: boolean; correct: boolean },
  now: number = Date.now(),
): ConceptMastery {
  const history = [...prev.history, outcome.firstTry].slice(-HISTORY_CAP)
  const level = levelFrom(history)
  if (outcome.correct && outcome.firstTry) {
    const days = SPACING_LADDER_DAYS[Math.min(prev.intervalIndex, SPACING_LADDER_DAYS.length - 1)]
    return {
      concept: prev.concept,
      history,
      level,
      intervalIndex: Math.min(prev.intervalIndex + 1, SPACING_LADDER_DAYS.length),
      dueAt: now + days * DAY_MS,
      lastSeen: now,
    }
  }
  // Wrong (or needed hints) → resurface next session, reset the ladder.
  return { concept: prev.concept, history, level, intervalIndex: 0, dueAt: now, lastSeen: now }
}

/** A skipped step: not mastered, resurface next session. */
export function recordSkip(prev: ConceptMastery, now: number = Date.now()): ConceptMastery {
  const history = [...prev.history, false].slice(-HISTORY_CAP)
  return { concept: prev.concept, history, level: levelFrom(history), intervalIndex: 0, dueAt: now, lastSeen: now }
}

export function isConceptMastered(m: ConceptMastery | undefined): boolean {
  return !!m && m.history.length >= MIN_ENCOUNTERS && m.level >= MASTERY_THRESHOLD
}

/** Are ALL the given concepts mastered? (Used for lesson-level mastery gating.) */
export function allMastered(map: ConceptMasteryMap, concepts: ConceptId[]): boolean {
  return concepts.length > 0 && concepts.every((c) => isConceptMastered(map[c]))
}

/**
 * Concepts currently due for review: seen before AND past their due date.
 * Soonest-due first. (The Daily Review interleaves these across lessons.)
 */
export function dueConcepts(map: ConceptMasteryMap, now: number = Date.now()): ConceptId[] {
  return Object.values(map)
    .filter((m): m is ConceptMastery => !!m && m.lastSeen > 0 && m.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt)
    .map((m) => m.concept)
}
