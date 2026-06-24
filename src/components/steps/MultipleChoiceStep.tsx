import { useEffect, useState } from 'react'
import type { MultipleChoiceStep as MCStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { StaticFigure } from '../figures/StaticFigure'

export function MultipleChoiceStep({ step, setChecker, locked }: InteractiveStepProps<MCStep>) {
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    setChecker(() => selected === step.correctOptionId)
  }, [selected, step.correctOptionId, setChecker])

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
            onClick={() => setSelected(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
