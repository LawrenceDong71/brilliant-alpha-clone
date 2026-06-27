import { useCallback, useRef, useState } from 'react'
import type { Step } from '../../content/types'
import { StepRenderer } from './StepRenderer'

interface Props {
  step: Step
  onSolved?: () => void
}

/**
 * Renders a single `Step` with the same check / hint / explanation flow as
 * `LessonPage`, but standalone (no scoring or progress persistence). Reused by
 * AI Design-a-Problem (Feature B) and AI-generated lessons (Feature A).
 */
export function StepPlayer({ step, onSolved }: Props) {
  const [attempts, setAttempts] = useState(0)
  const [solved, setSolved] = useState(false)
  const checkerRef = useRef<() => boolean>(() => false)
  const setChecker = useCallback((fn: () => boolean) => {
    checkerRef.current = fn
  }, [])

  const isConcept = step.type === 'concept'
  const revealed = attempts >= 2

  const check = () => {
    if (checkerRef.current()) {
      setSolved(true)
      onSolved?.()
    } else {
      setAttempts((a) => a + 1)
    }
  }

  const hint =
    attempts > 0 && step.feedback.hints.length > 0
      ? step.feedback.hints[Math.min(attempts - 1, step.feedback.hints.length - 1)]
      : ''

  return (
    <div className="lesson-body">
      <h2 className="step-prompt">{step.prompt}</h2>

      <StepRenderer key={step.id} step={step} setChecker={setChecker} locked={solved} />

      {solved && (
        <div className="feedback correct">
          <strong>Correct!</strong> {step.feedback.correct}
        </div>
      )}
      {!isConcept && !solved && attempts > 0 && (
        <div className="feedback incorrect">
          <strong>Not quite.</strong> Try again.
        </div>
      )}
      {!solved && hint && (
        <div className="feedback hint">
          <strong>Hint:</strong> {hint}
        </div>
      )}
      {!solved && revealed && (
        <div className="feedback explain">
          <strong>Explanation:</strong> {step.feedback.explanation}
        </div>
      )}

      {!isConcept && !solved && (
        <div className="lesson-footer">
          <div className="footer-row">
            <button className="btn primary grow" onClick={check}>
              Check
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
