import type { Step } from '../../content/types'
import { ConceptStep } from './ConceptStep'
import { MultipleChoiceStep } from './MultipleChoiceStep'
import { AngleDragStep } from './AngleDragStep'
import { DragTriangleStep } from './DragTriangleStep'
import { SliderStep } from './SliderStep'
import { DragPointStep } from './DragPointStep'
import { DistanceFlightStep } from './DistanceFlightStep'
import { PlotStep } from './PlotStep'
import { SortBinsStep } from './SortBinsStep'
import { AngleTargetStep } from './AngleTargetStep'
import { ConnectDotsStep } from './ConnectDotsStep'
import { RayAimStep } from './RayAimStep'
import { CornerTearStep } from './CornerTearStep'
import { PythagSquaresStep } from './PythagSquaresStep'
import { LadderStep } from './LadderStep'
import { GridShapeStep } from './GridShapeStep'
import { MirrorGridStep } from './MirrorGridStep'
import { AngleFillStep } from './AngleFillStep'
import { AngleLockStep } from './AngleLockStep'
import { BraceItStep } from './BraceItStep'
import { SlideShapeStep } from './SlideShapeStep'
import { MirrorShapeStep } from './MirrorShapeStep'
import { SpinShapeStep } from './SpinShapeStep'
import { RapidSymmetryStep } from './RapidSymmetryStep'
import { SplitSprintStep } from './SplitSprintStep'
import { BattleshipStep } from './BattleshipStep'
import { ClockAnglesStep } from './ClockAnglesStep'
import { AreaBuildStep } from './AreaBuildStep'
import { ClipSegmentStep } from './ClipSegmentStep'
import { PythagBalanceStep } from './PythagBalanceStep'
import { TriangleAreaStep } from './TriangleAreaStep'
import { DecomposeAreaStep } from './DecomposeAreaStep'
import { PythagSolveStep } from './PythagSolveStep'
import { TrussRescueStep } from './TrussRescueStep'
import { PenShapeStep } from './PenShapeStep'
import { RapidFireStep } from './RapidFireStep'

interface Props {
  step: Step
  setChecker: (fn: () => boolean) => void
  locked: boolean
}

export function StepRenderer({ step, setChecker, locked }: Props) {
  switch (step.type) {
    case 'concept':
      return <ConceptStep step={step} />
    case 'multipleChoice':
      return <MultipleChoiceStep step={step} setChecker={setChecker} locked={locked} />
    case 'angleDrag':
      return <AngleDragStep step={step} setChecker={setChecker} locked={locked} />
    case 'dragTriangle':
      return <DragTriangleStep step={step} setChecker={setChecker} locked={locked} />
    case 'slider':
      return <SliderStep step={step} setChecker={setChecker} locked={locked} />
    case 'dragPoint':
      return <DragPointStep step={step} setChecker={setChecker} locked={locked} />
    case 'distanceFlight':
      return <DistanceFlightStep step={step} setChecker={setChecker} locked={locked} />
    case 'plot':
      return <PlotStep step={step} setChecker={setChecker} locked={locked} />
    case 'sortBins':
      return <SortBinsStep step={step} setChecker={setChecker} locked={locked} />
    case 'angleTarget':
      return <AngleTargetStep step={step} setChecker={setChecker} locked={locked} />
    case 'connectDots':
      return <ConnectDotsStep step={step} setChecker={setChecker} locked={locked} />
    case 'rayAim':
      return <RayAimStep step={step} setChecker={setChecker} locked={locked} />
    case 'cornerTear':
      return <CornerTearStep step={step} setChecker={setChecker} locked={locked} />
    case 'pythagSquares':
      return <PythagSquaresStep step={step} setChecker={setChecker} locked={locked} />
    case 'ladder':
      return <LadderStep step={step} setChecker={setChecker} locked={locked} />
    case 'gridShape':
      return <GridShapeStep step={step} setChecker={setChecker} locked={locked} />
    case 'mirrorGrid':
      return <MirrorGridStep step={step} setChecker={setChecker} locked={locked} />
    case 'angleFill':
      return <AngleFillStep step={step} setChecker={setChecker} locked={locked} />
    case 'angleLock':
      return <AngleLockStep step={step} setChecker={setChecker} locked={locked} />
    case 'braceIt':
      return <BraceItStep step={step} setChecker={setChecker} locked={locked} />
    case 'battleship':
      return <BattleshipStep step={step} setChecker={setChecker} locked={locked} />
    case 'clockAngles':
      return <ClockAnglesStep step={step} setChecker={setChecker} locked={locked} />
    case 'slideShape':
      return <SlideShapeStep step={step} setChecker={setChecker} locked={locked} />
    case 'mirrorShape':
      return <MirrorShapeStep step={step} setChecker={setChecker} locked={locked} />
    case 'spinShape':
      return <SpinShapeStep step={step} setChecker={setChecker} locked={locked} />
    case 'symmetryRapid':
      return <RapidSymmetryStep step={step} setChecker={setChecker} locked={locked} />
    case 'splitSprint':
      return <SplitSprintStep step={step} setChecker={setChecker} locked={locked} />
    case 'areaBuild':
      return <AreaBuildStep step={step} setChecker={setChecker} locked={locked} />
    case 'clipSegment':
      return <ClipSegmentStep step={step} setChecker={setChecker} locked={locked} />
    case 'pythagBalance':
      return <PythagBalanceStep step={step} setChecker={setChecker} locked={locked} />
    case 'pythagSolve':
      return <PythagSolveStep step={step} setChecker={setChecker} locked={locked} />
    case 'triangleArea':
      return <TriangleAreaStep step={step} setChecker={setChecker} locked={locked} />
    case 'decomposeArea':
      return <DecomposeAreaStep step={step} setChecker={setChecker} locked={locked} />
    case 'penShape':
      return <PenShapeStep step={step} setChecker={setChecker} locked={locked} />
    case 'rapidFire':
      return <RapidFireStep step={step} setChecker={setChecker} locked={locked} />
    case 'trussRescue':
      return <TrussRescueStep step={step} setChecker={setChecker} locked={locked} />
    default:
      return null
  }
}
