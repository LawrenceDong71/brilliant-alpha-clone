import type { GridShapeStep as GStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { KitchenFloorGrid } from './KitchenFloorGrid'
import { GardenFenceGrid } from './GardenFenceGrid'

/**
 * Grid-based area/perimeter activity. Delegates to a themed renderer:
 * - area mode  → tile a realistic kitchen floor
 * - perimeter mode → fence a realistic garden
 * Both share the same checker contract (cover every tile / every fence panel).
 */
export function GridShapeStep(props: InteractiveStepProps<GStep>) {
  return props.step.mode === 'area' ? (
    <KitchenFloorGrid {...props} />
  ) : (
    <GardenFenceGrid {...props} />
  )
}
