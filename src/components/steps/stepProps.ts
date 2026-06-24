import type { Step } from '../../content/types'

/**
 * Shared props for interactive step components. A step registers a `checker`
 * function with the lesson player; pressing "Check" calls it to evaluate the
 * learner's current manipulation. `locked` freezes interaction after success.
 */
export interface InteractiveStepProps<T extends Step = Step> {
  step: T
  setChecker: (fn: () => boolean) => void
  locked: boolean
}
