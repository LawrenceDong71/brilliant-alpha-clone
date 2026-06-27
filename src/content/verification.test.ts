import { describe, expect, it } from 'vitest'
import { LESSONS } from './lessons'
import type { Step } from './types'

/**
 * Prototype of the PHASE2-AI-PRD.md §2.5 self-verification suite, run here against
 * the hand-authored curriculum. Each check is an independent re-derivation of a
 * step's answer key / solvability — exactly the kind of oracle that must gate any
 * AI-generated step before it renders. They live here so the invariants are pinned
 * now and the same helpers can be reused by the runtime verifier later.
 */
const allSteps: Step[] = LESSONS.flatMap((l) => l.steps)

function stepsOfType<T extends Step['type']>(type: T): Extract<Step, { type: T }>[] {
  return allSteps.filter((s): s is Extract<Step, { type: T }> => s.type === type)
}

describe('answer keys are mathematically consistent (mathjs-oracle prototype)', () => {
  it('areaBuild target equals width x height', () => {
    for (const s of stepsOfType('areaBuild')) {
      expect(s.target, s.id).toBe(s.width * s.height)
    }
  })

  it('triangleArea target equals half x base x height', () => {
    for (const s of stepsOfType('triangleArea')) {
      expect(s.target, s.id).toBe((s.base * s.height) / 2)
    }
  })

  it('decomposeArea total equals the number of filled cells', () => {
    for (const s of stepsOfType('decomposeArea')) {
      expect(s.total, s.id).toBe(s.cells.length)
    }
  })

  it('braceIt frames are Pythagorean (whole-number hypotenuse)', () => {
    for (const s of stepsOfType('braceIt')) {
      for (const f of s.frames) {
        const c = Math.hypot(f.w, f.h)
        expect(c, `${s.id} ${f.w}x${f.h}`).toBeCloseTo(Math.round(c), 9)
      }
    }
  })

  it('pythagSolve missing leg satisfies a^2 + b^2 = c^2', () => {
    for (const s of stepsOfType('pythagSolve')) {
      expect(s.knownLeg ** 2 + s.targetLeg ** 2, s.id).toBe(s.hypotenuse ** 2)
    }
  })

  it('pythagBalance missing leg satisfies a^2 + b^2 = c^2', () => {
    for (const s of stepsOfType('pythagBalance')) {
      expect(s.knownLeg ** 2 + s.targetLeg ** 2, s.id).toBe(s.hypotenuse ** 2)
    }
  })
})

describe('interactive steps are solvable & non-degenerate', () => {
  it('angleLock dials leave a positive missing angle on the snap grid', () => {
    for (const s of stepsOfType('angleLock')) {
      const snap = s.snapDegrees ?? 5
      for (const d of s.dials) {
        const third = 180 - d.a - d.b
        expect(third, `${s.id} ${d.a}/${d.b} positive`).toBeGreaterThan(0)
        expect(third % snap, `${s.id} ${d.a}/${d.b} on grid`).toBe(0)
      }
    }
  })

  it('trussRescue panels leave a positive missing angle', () => {
    for (const s of stepsOfType('trussRescue')) {
      for (const p of s.panels) {
        expect(180 - p.a - p.b, `${s.id} ${p.a}/${p.b}`).toBeGreaterThan(0)
      }
    }
  })

  it('multipleChoice correctOptionId points at a real option', () => {
    for (const s of stepsOfType('multipleChoice')) {
      const ids = s.options.map((o) => o.id)
      expect(ids, s.id).toContain(s.correctOptionId)
    }
  })

  it('sortBins items reference real bins', () => {
    for (const s of stepsOfType('sortBins')) {
      const bins = new Set(s.bins.map((b) => b.id))
      for (const item of s.items) {
        expect(bins.has(item.correctBin), `${s.id} ${item.id}`).toBe(true)
      }
    }
  })

  it('connectDots order references real dots', () => {
    for (const s of stepsOfType('connectDots')) {
      const dots = new Set(s.dots.map((d) => d.id))
      for (const id of s.order) {
        expect(dots.has(id), `${s.id} ${id}`).toBe(true)
      }
    }
  })

  it('clockAngles targets are positive multiples of 30 within a half turn', () => {
    for (const s of stepsOfType('clockAngles')) {
      for (const t of s.targets) {
        expect(t, `${s.id} positive`).toBeGreaterThan(0)
        expect(t, `${s.id} <= 180`).toBeLessThanOrEqual(180)
        expect(t % 30, `${s.id} multiple of 30`).toBe(0)
      }
    }
  })

  it('angleDrag does not start already solved', () => {
    for (const s of stepsOfType('angleDrag')) {
      expect(Math.abs(s.startDegrees - s.targetDegrees), s.id).toBeGreaterThan(
        s.toleranceDegrees,
      )
    }
  })

  it('slideShape requires an actual move', () => {
    for (const s of stepsOfType('slideShape')) {
      expect(Math.abs(s.vector.x) + Math.abs(s.vector.y), s.id).toBeGreaterThan(0)
    }
  })
})
