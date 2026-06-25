/** Shared contract for the rapid-fire basketball angle-eyeballing capstone. */

export interface Pt {
  x: number
  y: number
}

/** Court geometry in SVG viewBox pixels (shared by the generator and the scene). */
export const COURT = {
  width: 340,
  height: 220,
  ground: 192,
  ballY: 183, // ball CENTER y (rests on the ground; radius BALL_R below)
  ballR: 9,
} as const

export type RapidFirePhase = 'playing' | 'reveal' | 'done'
export type RoundResult = 'correct' | 'wrong' | 'timeout'

/** One round: a ball + hoop placed so the straight ball→hoop line is `correctAngle`. */
export interface ShotRound {
  ball: Pt
  hoop: Pt
  /** Degrees above horizontal of the straight ball→hoop sightline (a "nice" angle). */
  correctAngle: number
  /** Angle options shown to the learner, sorted ascending. */
  choices: number[]
  /** Index in `choices` of the correct angle. */
  correctIndex: number
}

export interface RapidFireConfig {
  rounds: number
  secondsPerRound: number
  anglePool: number[]
  optionsPerRound: number
  passRatio: number
  seed: number
}

export interface UseRapidFireResult {
  phase: RapidFirePhase
  roundIndex: number
  totalRounds: number
  round: ShotRound
  /** Remaining time this round, 1 → 0 (drives the timer bar). */
  timeFraction: number
  selectedIndex: number | null
  lastResult: RoundResult | null
  score: number
  streak: number
  bestStreak: number
  finished: boolean
  passed: boolean
  passThreshold: number
  answer: (choiceIndex: number) => void
  playAgain: () => void
}

export interface CourtSceneProps {
  ball: Pt
  hoop: Pt
  /** True ball→hoop angle (degrees) — revealed on answer. */
  correctAngle: number
  /** The angle the learner picked (for the wrong-answer ghost ray); null if none. */
  chosenAngle?: number | null
  /** When true, show the aim line(s) + shot animation. */
  reveal: boolean
  result?: RoundResult | null
  width?: number
  height?: number
  reduceMotion?: boolean
}

export interface RapidFireHudProps {
  phase: RapidFirePhase
  roundIndex: number
  totalRounds: number
  timeFraction: number
  choices: number[]
  selectedIndex: number | null
  correctIndex: number
  reveal: boolean
  result?: RoundResult | null
  score: number
  streak: number
  bestStreak: number
  finished: boolean
  passed: boolean
  passThreshold: number
  onAnswer: (choiceIndex: number) => void
  onPlayAgain: () => void
  reduceMotion?: boolean
}
