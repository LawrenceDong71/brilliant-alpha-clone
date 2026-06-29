import { MAX_REPAIRS } from './config'
import { getProvider } from './provider'
import type { AiProvider } from './provider'
import { parseStep } from './verify/parseStep'
import { verifyStep } from './verify/verifyStep'
import type { DesignOutcome, VerifyFailure } from './types'

function makeId(): string {
  return `design-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export interface DesignProblemOptions {
  provider?: AiProvider
  id?: string
  maxRepairs?: number
  /** Phase 3: request a fresh, creative spaced-review variant. */
  creative?: boolean
}

/**
 * The closed-loop §2.5 pipeline for Design-a-Problem:
 *   generate -> parse (schema) -> verify (mathjs oracle) -> repair -> repeat.
 * Returns a verified, solvable step, or `ok:false` after exhausting repairs
 * (callers then decline/fall back — never render failing content).
 */
export async function designProblem(
  scenario: string,
  options: DesignProblemOptions = {},
): Promise<DesignOutcome> {
  const provider = options.provider ?? getProvider()
  const id = options.id ?? makeId()
  const maxRepairs = options.maxRepairs ?? MAX_REPAIRS

  let previous: unknown
  let lastFailures: VerifyFailure[] = []

  for (let attempt = 1; attempt <= maxRepairs + 1; attempt++) {
    const raw = await provider.designProblem({
      scenario,
      creative: options.creative,
      repair:
        previous !== undefined
          ? { previous, failures: lastFailures.map((f) => f.message) }
          : undefined,
    })
    previous = raw

    const parsed = parseStep(raw, id)
    if (!parsed.ok) {
      lastFailures = parsed.failures
      continue
    }

    const verdict = verifyStep(parsed.step)
    if (verdict.ok) return { ok: true, step: parsed.step, attempts: attempt }
    lastFailures = verdict.failures
  }

  return { ok: false, attempts: maxRepairs + 1, failures: lastFailures }
}
