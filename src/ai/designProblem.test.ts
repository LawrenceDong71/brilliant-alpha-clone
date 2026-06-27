import { describe, expect, it, vi } from 'vitest'
import { designProblem } from './designProblem'
import { mockProvider } from './provider'
import type { AiProvider, DesignProblemInput } from './provider'

const validArea = (target: number) => ({
  type: 'areaBuild',
  prompt: 'p',
  width: 7,
  height: 4,
  target,
  feedback: { correct: 'c', hints: [], explanation: 'e' },
})

describe('designProblem loop', () => {
  it('returns a verified step from the mock on the first attempt', async () => {
    const out = await designProblem('a 5 by 3 area rug', { provider: mockProvider })
    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(out.attempts).toBe(1)
      expect(out.step.type).toBe('areaBuild')
      if (out.step.type === 'areaBuild') {
        expect(out.step.target).toBe(out.step.width * out.step.height)
      }
    }
  })

  it('repairs a bad first candidate, then succeeds (feedback loop)', async () => {
    const calls: DesignProblemInput[] = []
    let n = 0
    const flaky: AiProvider = {
      async designProblem(input) {
        calls.push(input)
        n += 1
        return n === 1 ? validArea(30) : validArea(28) // 30 is wrong (7*4=28)
      },
    }
    const out = await designProblem('rug', { provider: flaky })
    expect(out.ok).toBe(true)
    if (out.ok) expect(out.attempts).toBe(2)
    // The repair pass must have received the prior failures.
    expect(calls[1].repair).toBeDefined()
    expect(calls[1].repair?.failures.length).toBeGreaterThan(0)
  })

  it('gives up (ok:false) when the model never produces valid content', async () => {
    const alwaysBad: AiProvider = {
      designProblem: vi.fn(async () => validArea(999)),
    }
    const out = await designProblem('rug', { provider: alwaysBad, maxRepairs: 2 })
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.attempts).toBe(3) // 1 initial + 2 repairs
      expect(out.failures.length).toBeGreaterThan(0)
    }
  })
})
