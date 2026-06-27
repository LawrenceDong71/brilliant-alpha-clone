import type { GeneratableStep, VerifyFailure } from '../types'
import type { Feedback } from '../../content/types'

export type ParseResult =
  | { ok: true; step: GeneratableStep }
  | { ok: false; failures: VerifyFailure[] }

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function fail(code: string, message: string): { ok: false; failures: VerifyFailure[] } {
  return { ok: false, failures: [{ code, message }] }
}

function parseFeedback(raw: unknown, failures: VerifyFailure[]): Feedback {
  const r = isRecord(raw) ? raw : {}
  const correct = typeof r.correct === 'string' ? r.correct : ''
  const explanation = typeof r.explanation === 'string' ? r.explanation : ''
  const hints = Array.isArray(r.hints)
    ? r.hints.filter((h): h is string => typeof h === 'string')
    : []
  if (!correct) failures.push({ code: 'feedback/missing-correct', message: 'feedback.correct is required.' })
  if (!explanation)
    failures.push({ code: 'feedback/missing-explanation', message: 'feedback.explanation is required.' })
  return { correct, hints, explanation }
}

function numField(
  obj: Record<string, unknown>,
  key: string,
  failures: VerifyFailure[],
): number {
  const v = obj[key]
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    failures.push({ code: `schema/missing-number:${key}`, message: `${key} must be a finite number.` })
    return NaN
  }
  return v
}

function strField(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key]
  return typeof v === 'string' ? v : undefined
}

/**
 * Validate raw model JSON into a typed `GeneratableStep`. This is the schema
 * gate of the §2.5 suite: anything that isn't exactly a known step shape is
 * rejected here, before any math verification.
 */
export function parseStep(raw: unknown, id: string): ParseResult {
  if (!isRecord(raw)) return fail('schema/not-object', 'Candidate must be a JSON object.')
  const type = raw.type
  const prompt = strField(raw, 'prompt')
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return fail('schema/missing-prompt', 'prompt is required.')
  }

  const failures: VerifyFailure[] = []
  const feedback = parseFeedback(raw.feedback, failures)
  const base = { id, prompt, feedback }

  switch (type) {
    case 'areaBuild': {
      const width = numField(raw, 'width', failures)
      const height = numField(raw, 'height', failures)
      const target = numField(raw, 'target', failures)
      if (failures.length) return { ok: false, failures }
      return {
        ok: true,
        step: { ...base, type, width, height, target, unit: strField(raw, 'unit'), context: strField(raw, 'context') },
      }
    }
    case 'triangleArea': {
      const triBase = numField(raw, 'base', failures)
      const height = numField(raw, 'height', failures)
      const target = numField(raw, 'target', failures)
      if (failures.length) return { ok: false, failures }
      return {
        ok: true,
        step: {
          ...base,
          type,
          base: triBase,
          height,
          target,
          context: strField(raw, 'context'),
          unit: strField(raw, 'unit'),
        },
      }
    }
    case 'pythagSolve': {
      const hypotenuse = numField(raw, 'hypotenuse', failures)
      const knownLeg = numField(raw, 'knownLeg', failures)
      const targetLeg = numField(raw, 'targetLeg', failures)
      if (failures.length) return { ok: false, failures }
      return {
        ok: true,
        step: { ...base, type, hypotenuse, knownLeg, targetLeg, context: strField(raw, 'context') },
      }
    }
    case 'angleLock': {
      if (!Array.isArray(raw.dials) || raw.dials.length === 0) {
        failures.push({ code: 'schema/missing-dials', message: 'dials must be a non-empty array.' })
        return { ok: false, failures }
      }
      const dials = raw.dials.map((d) => {
        const dr = isRecord(d) ? d : {}
        return {
          a: numField(dr, 'a', failures),
          b: numField(dr, 'b', failures),
          context: typeof dr.context === 'string' ? dr.context : undefined,
        }
      })
      const snap = raw.snapDegrees
      const tol = raw.tolerance
      if (failures.length) return { ok: false, failures }
      return {
        ok: true,
        step: {
          ...base,
          type,
          dials,
          snapDegrees: typeof snap === 'number' ? snap : undefined,
          tolerance: typeof tol === 'number' ? tol : undefined,
        },
      }
    }
    default:
      return fail('schema/unknown-type', `Unsupported or missing step type: ${String(type)}.`)
  }
}
