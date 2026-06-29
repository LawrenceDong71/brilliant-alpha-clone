import { useEffect, useState } from 'react'
import type { MultipleChoiceStep as MCStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { StaticFigure } from '../figures/StaticFigure'

export function MultipleChoiceStep({ step, setChecker, locked }: InteractiveStepProps<MCStep>) {
  const [selected, setSelected] = useState<string | null>(null)
  // The option id that was just checked and found wrong (for answer-specific feedback).
  const [checkedWrong, setCheckedWrong] = useState<string | null>(null)

  useEffect(() => {
    setChecker(() => {
      const correct = selected === step.correctOptionId
      setCheckedWrong(correct ? null : selected)
      return correct
    })
  }, [selected, step.correctOptionId, setChecker])

  // Phase 3 (FR-F2): show why the picked option is wrong — without revealing the answer.
  const whyWrong =
    !locked && checkedWrong && checkedWrong === selected
      ? step.options.find((o) => o.id === checkedWrong)?.whyWrong
      : undefined

  return (
    <div className="mc">
      {step.figure && (
        <div className="figure-wrap">
          <StaticFigure figure={step.figure} />
        </div>
      )}
      <div className="mc-options">
        {step.options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={locked}
            className={`mc-option${selected === opt.id ? ' selected' : ''}`}
            onClick={() => {
              setSelected(opt.id)
              setCheckedWrong(null)
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {whyWrong && (
        <div className="feedback incorrect">
          <strong>Not quite.</strong> {whyWrong}
        </div>
      )}
    </div>
  )
}
