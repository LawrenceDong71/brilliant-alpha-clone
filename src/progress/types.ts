export interface StreakState {
  current: number
  longest: number
  /** YYYY-MM-DD of the last day the learner solved something. */
  lastActiveDate: string
}

export interface StepState {
  attempts: number
  solved: boolean
  /** True if solved on the very first attempt (feeds mastery score). */
  firstTry: boolean
}

/**
 * Phase 3 (learning science): per-concept mastery + spaced-repetition state.
 * Tracked separately from per-lesson progress so the core-6 mastery/points math
 * stays clean.
 */
export interface ConceptMastery {
  concept: import('../content/types').ConceptId
  /** Recent first-try outcomes (most recent last), capped. Drives `level`. */
  history: boolean[]
  /** Rolling first-try success (0..1) over the recent window. */
  level: number
  /** Consecutive first-try successes → position on the spacing ladder. */
  intervalIndex: number
  /** Epoch ms when this concept is next due for review. */
  dueAt: number
  /** Epoch ms of the last encounter (0 = never seen). */
  lastSeen: number
}

export type ConceptMasteryMap = Partial<Record<import('../content/types').ConceptId, ConceptMastery>>

export interface LessonProgress {
  status: 'inProgress' | 'completed'
  currentStepIndex: number
  steps: Record<string, StepState>
  masteryScore: number
  /** Earned points (100 per question, minus 25 per wrong attempt). */
  points: number
  completedAt?: number
  updatedAt: number
}

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  streak: StreakState
}

export type ProgressMap = Record<string, LessonProgress>

export const emptyStreak: StreakState = {
  current: 0,
  longest: 0,
  lastActiveDate: '',
}
