import type { StepState } from './types'
import type { Lesson } from '../content/types'

/** Full value of a question answered on the first try. */
export const POINTS_BASE = 100
/** Points lost for each wrong attempt (no floor — a question can drop to 0). */
export const POINTS_PENALTY = 25
/** Fraction of a lesson's points needed to unlock the next lesson. */
export const PASS_RATIO = 0.6

/** What a question is worth if solved right now, given how many wrong tries so far. */
export function questionWorth(attempts: number): number {
  return Math.max(POINTS_BASE - POINTS_PENALTY * attempts, 0)
}

/** Points actually earned for a graded step (0 until solved). */
function stepPoints(state: Pick<StepState, 'attempts' | 'solved'>): number {
  if (!state.solved) return 0
  return questionWorth(state.attempts)
}

/** Maximum points obtainable in a lesson (100 per gradable question). */
export function lessonMaxPoints(lesson: Lesson): number {
  return lesson.steps.filter((s) => s.type !== 'concept').length * POINTS_BASE
}

/**
 * Points earned in a lesson. Counts ONLY the lesson's current gradable steps (ignoring
 * concept steps and any stale step entries left over from edited content), and clamps to
 * the lesson max so the displayed score can never exceed the maximum.
 */
export function lessonPoints(
  lesson: Lesson,
  steps: Record<string, Pick<StepState, 'attempts' | 'solved'>>,
): number {
  const earned = lesson.steps
    .filter((s) => s.type !== 'concept')
    .reduce((sum, s) => sum + (steps[s.id] ? stepPoints(steps[s.id]) : 0), 0)
  return Math.min(earned, lessonMaxPoints(lesson))
}

/** Points needed to pass (unlock the next lesson). */
export function passThreshold(maxPoints: number): number {
  return Math.ceil(maxPoints * PASS_RATIO)
}

/** Whether an earned score clears the pass bar. */
export function hasPassed(points: number, maxPoints: number): boolean {
  return points >= passThreshold(maxPoints)
}
