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
