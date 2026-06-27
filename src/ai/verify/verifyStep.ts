import { evaluate } from 'mathjs'
import type { GeneratableStep, VerifyFailure, VerifyResult } from '../types'

const EPS = 1e-9

function approxEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= EPS
}

/** mathjs is the oracle: re-derive a value from a formula string + scope. */
function oracle(formula: string, scope: Record<string, number>): number {
  return Number(evaluate(formula, scope))
}

type Checker = (push: (code: string, message: string) => void) => void

function run(checks: Checker): VerifyResult {
  const failures: VerifyFailure[] = []
  checks((code, message) => failures.push({ code, message }))
  return { ok: failures.length === 0, failures }
}

function checkFeedback(step: GeneratableStep, push: (code: string, message: string) => void): void {
  if (!step.feedback.correct.trim()) push('feedback/empty-correct', 'feedback.correct is empty.')
  if (!step.feedback.explanation.trim())
    push('feedback/empty-explanation', 'feedback.explanation is empty.')
}

/**
 * The §2.5 verification suite for a single generated step: schema is assumed
 * (see parseStep); this re-derives the answer with mathjs (consistency), and
 * enforces bounds, non-degeneracy, and feedback presence. Returns every failure
 * so the repair prompt can fix all of them at once.
 */
export function verifyStep(step: GeneratableStep): VerifyResult {
  switch (step.type) {
    case 'areaBuild':
      return run((push) => {
        const { width, height, target } = step
        if (!Number.isInteger(width) || width < 1 || width > 12)
          push('bounds/width', 'width must be an integer in 1..12.')
        if (!Number.isInteger(height) || height < 1 || height > 12)
          push('bounds/height', 'height must be an integer in 1..12.')
        if (width <= 1 && height <= 1)
          push('degenerate/too-small', 'rectangle must be larger than 1x1.')
        if (!approxEqual(target, oracle('w * h', { w: width, h: height })))
          push('consistency/target', `target must equal width*height (${width * height}).`)
        checkFeedback(step, push)
      })

    case 'triangleArea':
      return run((push) => {
        const { base, height, target } = step
        if (!Number.isInteger(base) || base < 1 || base > 16)
          push('bounds/base', 'base must be an integer in 1..16.')
        if (!Number.isInteger(height) || height < 1 || height > 16)
          push('bounds/height', 'height must be an integer in 1..16.')
        if (!approxEqual(target, oracle('b * h / 2', { b: base, h: height })))
          push('consistency/target', `target must equal base*height/2 (${(base * height) / 2}).`)
        if (target <= 0) push('degenerate/area', 'area must be positive.')
        checkFeedback(step, push)
      })

    case 'pythagSolve':
      return run((push) => {
        const { hypotenuse, knownLeg, targetLeg } = step
        for (const [k, v] of [
          ['hypotenuse', hypotenuse],
          ['knownLeg', knownLeg],
          ['targetLeg', targetLeg],
        ] as const) {
          if (!Number.isInteger(v) || v < 1)
            push(`bounds/${k}`, `${k} must be a positive integer (keep problems clean).`)
        }
        if (hypotenuse <= knownLeg || hypotenuse <= targetLeg)
          push('degenerate/hypotenuse', 'hypotenuse must be the longest side.')
        const lhs = oracle('a^2 + b^2', { a: knownLeg, b: targetLeg })
        const rhs = oracle('c^2', { c: hypotenuse })
        if (!approxEqual(lhs, rhs))
          push('consistency/pythagorean', 'knownLeg^2 + targetLeg^2 must equal hypotenuse^2.')
        checkFeedback(step, push)
      })

    case 'angleLock':
      return run((push) => {
        const snap = step.snapDegrees ?? 5
        if (snap <= 0) push('bounds/snap', 'snapDegrees must be positive.')
        if (step.dials.length === 0) push('schema/no-dials', 'at least one dial is required.')
        step.dials.forEach((d, i) => {
          if (d.a <= 0 || d.b <= 0 || d.a >= 180 || d.b >= 180)
            push(`bounds/dial-${i}`, `dial ${i}: angles a,b must be in (0,180).`)
          const third = oracle('180 - a - b', { a: d.a, b: d.b })
          if (third <= 0)
            push(`degenerate/dial-${i}`, `dial ${i}: a+b must be < 180 so a third angle exists.`)
          else if (!approxEqual(third % snap, 0) && !approxEqual(third % snap, snap))
            push(`solvable/dial-${i}`, `dial ${i}: the answer ${third} must land on the ${snap}° snap grid.`)
        })
        checkFeedback(step, push)
      })
  }
}
