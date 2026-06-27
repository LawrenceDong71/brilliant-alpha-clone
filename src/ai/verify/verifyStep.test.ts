import { describe, expect, it } from 'vitest'
import { verifyStep } from './verifyStep'
import type { GeneratableStep } from '../types'

const fb = () => ({ correct: 'Nice.', hints: ['try'], explanation: 'Because math.' })

const area = (width: number, height: number, target: number): GeneratableStep => ({
  type: 'areaBuild',
  id: 't',
  prompt: 'p',
  feedback: fb(),
  width,
  height,
  target,
})

const triangle = (base: number, height: number, target: number): GeneratableStep => ({
  type: 'triangleArea',
  id: 't',
  prompt: 'p',
  feedback: fb(),
  base,
  height,
  target,
})

const pythag = (hypotenuse: number, knownLeg: number, targetLeg: number): GeneratableStep => ({
  type: 'pythagSolve',
  id: 't',
  prompt: 'p',
  feedback: fb(),
  hypotenuse,
  knownLeg,
  targetLeg,
})

const angle = (a: number, b: number, snapDegrees = 5): GeneratableStep => ({
  type: 'angleLock',
  id: 't',
  prompt: 'p',
  feedback: fb(),
  snapDegrees,
  dials: [{ a, b }],
})

describe('verifyStep — accepts correct, solvable problems', () => {
  it('areaBuild with target = w*h', () => {
    expect(verifyStep(area(7, 4, 28)).ok).toBe(true)
  })
  it('triangleArea with target = ½bh', () => {
    expect(verifyStep(triangle(10, 6, 30)).ok).toBe(true)
  })
  it('pythagSolve on a Pythagorean triple', () => {
    expect(verifyStep(pythag(10, 8, 6)).ok).toBe(true)
  })
  it('angleLock with the answer on the snap grid', () => {
    expect(verifyStep(angle(90, 35)).ok).toBe(true)
  })
})

describe('verifyStep — rejects wrong / degenerate problems', () => {
  it('flags an inconsistent area answer', () => {
    const r = verifyStep(area(7, 4, 30))
    expect(r.ok).toBe(false)
    expect(r.failures.map((f) => f.code)).toContain('consistency/target')
  })
  it('flags a non-Pythagorean triple', () => {
    expect(verifyStep(pythag(10, 8, 5)).ok).toBe(false)
  })
  it('flags a hypotenuse that is not the longest side', () => {
    expect(verifyStep(pythag(6, 8, 10)).ok).toBe(false)
  })
  it('flags an angle answer off the snap grid', () => {
    const r = verifyStep(angle(90, 33))
    expect(r.ok).toBe(false)
    expect(r.failures.some((f) => f.code.startsWith('solvable/'))).toBe(true)
  })
  it('flags a degenerate triangle (a+b ≥ 180)', () => {
    expect(verifyStep(angle(100, 100)).ok).toBe(false)
  })
  it('flags empty feedback', () => {
    const bad = { ...area(7, 4, 28), feedback: { correct: '', hints: [], explanation: '' } }
    const r = verifyStep(bad)
    expect(r.ok).toBe(false)
    expect(r.failures.map((f) => f.code)).toContain('feedback/empty-correct')
  })
})
