import type { ConceptStep as ConceptStepType } from '../../content/types'
import { StaticFigure } from '../figures/StaticFigure'

export function ConceptStep({ step }: { step: ConceptStepType }) {
  return (
    <div className="concept">
      {step.figure && (
        <div className="figure-wrap">
          <StaticFigure figure={step.figure} />
        </div>
      )}
      <p className="concept-body">{step.body}</p>
    </div>
  )
}
