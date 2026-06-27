import type { Step } from '../content/types'

/**
 * The subset of `Step` that "Design-a-Problem" (Feature B) is allowed to
 * generate. Every type here has an answer that `mathjs` can independently
 * re-derive from the other fields, so the §2.5 verifier can prove it correct
 * and solvable before it ever renders. (Other step types are added as their
 * verifiers are written.)
 */
export type GeneratableStep = Extract<
  Step,
  { type: 'areaBuild' | 'triangleArea' | 'pythagSolve' | 'angleLock' }
>

export type GeneratableType = GeneratableStep['type']

export const GENERATABLE_TYPES: readonly GeneratableType[] = [
  'areaBuild',
  'triangleArea',
  'pythagSolve',
  'angleLock',
] as const

export function isGeneratableStep(step: Step): step is GeneratableStep {
  return (GENERATABLE_TYPES as readonly string[]).includes(step.type)
}

/** A single failed check from the verifier, fed back into the repair prompt. */
export interface VerifyFailure {
  code: string
  message: string
}

export interface VerifyResult {
  ok: boolean
  failures: VerifyFailure[]
}

/** Outcome of the full generate -> verify -> repair loop. */
export type DesignOutcome =
  | { ok: true; step: GeneratableStep; attempts: number }
  | { ok: false; attempts: number; failures: VerifyFailure[] }
