export interface Point {
  x: number
  y: number
}

interface Feedback {
  /** Positive reinforcement shown on a correct answer. */
  correct: string
  /** Escalating hints. hints[0] after the first miss, hints[1] after the second, etc. */
  hints: string[]
  /** Full written explanation, revealed after repeated misses. */
  explanation: string
}

interface StepBase {
  id: string
  prompt: string
  feedback: Feedback
}

/** Small static illustrations used by concept / multiple-choice steps. */
export type Figure =
  | { kind: 'pointsLines' }
  | { kind: 'angle'; degrees: number }
  | { kind: 'triangle' }
  | { kind: 'rightTriangle'; a: number; b: number }
  | { kind: 'rectangle'; w: number; h: number }
  | { kind: 'reflection' }
  | { kind: 'clock'; hour: number; minute: number }
  | { kind: 'anglesHook' }
  | { kind: 'transformTrio' }
  | { kind: 'translation' }
  | { kind: 'rotation' }
  | { kind: 'symmetryLines' }
  | { kind: 'rotationalSymmetry' }
  | { kind: 'pointDot' }
  | { kind: 'pointsScatter' }
  | { kind: 'segment' }
  | { kind: 'ray' }
  | { kind: 'line' }
  | { kind: 'truss' }
  | { kind: 'triangleAngles' }
  | { kind: 'triangleTypes' }
  | { kind: 'areaVsPerimeter'; w: number; h: number }
  | { kind: 'unitSquares'; w: number; h: number }
  | { kind: 'areaProduct'; w: number; h: number }
  | { kind: 'perimeterWalk'; w: number; h: number }
  | { kind: 'perimeterSides'; w: number; h: number }
  | { kind: 'areaFormulas' }

export interface ConceptStep extends StepBase {
  type: 'concept'
  body: string
  figure?: Figure
}

export interface MultipleChoiceStep extends StepBase {
  type: 'multipleChoice'
  figure?: Figure
  options: { id: string; label: string }[]
  correctOptionId: string
}

/** Drag a ray around a vertex to match a target angle (degrees). */
export interface AngleDragStep extends StepBase {
  type: 'angleDrag'
  targetDegrees: number
  toleranceDegrees: number
  startDegrees: number
}

/** Drag a triangle vertex; interior angles update live and always sum to 180. */
export interface DragTriangleStep extends StepBase {
  type: 'dragTriangle'
  initial: { A: Point; B: Point; C: Point }
  draggable: Array<'A' | 'B' | 'C'>
  targetVertex: 'A' | 'B' | 'C'
  targetAngle: number
  toleranceDegrees: number
}

/** Adjust one or two sliders; a figure responds and a derived value is checked. */
export interface SliderStep extends StepBase {
  type: 'slider'
  figure: 'rightTriangle' | 'rectangle'
  sliders: Array<{
    key: string
    label: string
    min: number
    max: number
    step: number
    initial: number
  }>
  compute: 'hypotenuse' | 'area' | 'perimeter'
  target: number
  tolerance: number
  unit?: string
}

/** Drag points on a coordinate grid to target positions (used for plotting & reflections). */
export interface DragPointStep extends StepBase {
  type: 'dragPoint'
  grid: { min: number; max: number }
  points: Array<{ id: string; label: string; start: Point; target: Point }>
  tolerance: number
  fixedPoints?: Array<{ id: string; label: string; at: Point }>
  mirrorLine?: { axis: 'x' | 'y'; at: number }
  connect?: 'fixedToDrag' | 'none'
}

/** Place a marker on a number line at a target value. */
export interface PlotStep extends StepBase {
  type: 'plot'
  min: number
  max: number
  step: number
  target: number
  tolerance: number
  unit?: string
}

/** Drag/tap real-world items into the correct category bins. */
export interface SortBinsStep extends StepBase {
  type: 'sortBins'
  bins: Array<{ id: string; label: string }>
  items: Array<{ id: string; label: string; correctBin: string }>
}

/**
 * "Aim to hit the target" mini-game: set a launch angle so a projectile
 * (e.g. a basketball) lands in a target zone. Range = 100 * sin(2*angle).
 */
export interface AngleTargetStep extends StepBase {
  type: 'angleTarget'
  /** Horizontal position of the hoop on the 0..110 world. */
  targetCenter: number
  /** Catch tolerance (diameter). The score window is ±targetWidth/2. */
  targetWidth: number
  /** Height of the rim above the ground (world units). Defaults to 0 (ground target). */
  targetHeight?: number
  startAngle: number
  /** Cosmetic labels so the same component can be re-themed. */
  projectileLabel?: string
  targetLabel?: string
}

/** Tap points (e.g. stars) in the correct order to draw connecting segments. */
export interface ConnectDotsStep extends StepBase {
  type: 'connectDots'
  grid: { min: number; max: number }
  dots: Array<{ id: string; at: Point }>
  /** Correct sequence of dot ids to connect. */
  order: string[]
  closed?: boolean
  instruction?: string
}

/**
 * Aim a ray (a lighthouse beam) from a fixed origin. Drives the "guide the ship
 * home" mini-game: `origin` is the lighthouse/home, `target` is where the ship
 * spawns, and `startDeg` is the beam's initial angle. The learner keeps the ship
 * inside the beam so it can sail home.
 */
export interface RayAimStep extends StepBase {
  type: 'rayAim'
  grid: { min: number; max: number }
  origin: Point
  target: Point
  toleranceDeg: number
  startDeg: number
  originLabel?: string
  targetLabel?: string
}

/**
 * "Crow's flight" on a city grid. The walked L-path (east then north from
 * `origin` to `target`) is drawn faintly; the learner drags a crow marker and
 * a live right triangle tracks the two legs and diagonal distance.
 */
export interface DistanceFlightStep extends StepBase {
  type: 'distanceFlight'
  grid: { min: number; max: number }
  origin: Point
  target: Point
  tolerance: number
  startLabel?: string
  targetLabel?: string
  unit?: string
}

/** Tap a triangle's three corners to "tear" them off and lay them on a line, showing they sum to 180°. */
export interface CornerTearStep extends StepBase {
  type: 'cornerTear'
  triangle: { A: Point; B: Point; C: Point }
}

/** Drag the legs of a right triangle and watch the squares on each side; goal is to hit a target hypotenuse. */
export interface PythagSquaresStep extends StepBase {
  type: 'pythagSquares'
  initialA: number
  initialB: number
  minLeg: number
  maxLeg: number
  targetC: number
  tolerance: number
}

/** Slide a fixed-length ladder's base along the ground so its top reaches a window at a given height. */
export interface LadderStep extends StepBase {
  type: 'ladder'
  ladderLength: number
  windowHeight: number
  tolerance: number
}

/**
 * Grid-based area/perimeter activity. The region is a set of unit cells [col, row]
 * (row 0 at the bottom). In `area` mode the learner taps cells to lay tiles; in
 * `perimeter` mode they tap boundary edges to put up fence panels.
 */
export interface GridShapeStep extends StepBase {
  type: 'gridShape'
  cols: number
  rows: number
  cells: Array<[number, number]>
  mode: 'area' | 'perimeter'
  instruction?: string
}

/**
 * Complete a symmetric figure. Half of it (`given`) is pre-filled; the learner taps
 * cells to paint the mirror image across the central axis. `cols` should be even for
 * a vertical mirror, `rows` even for a horizontal mirror.
 */
export interface MirrorGridStep extends StepBase {
  type: 'mirrorGrid'
  cols: number
  rows: number
  given: Array<[number, number]>
  axis: 'vertical' | 'horizontal'
  instruction?: string
}

/**
 * "Fill the gap to 180°" activity. Two known angle wedges (`given`) are laid
 * side by side along a straight baseline; the learner drags a ray to grow a
 * third wedge until the three together fill the straight line (180°). The third
 * angle's measure is shown live, so finding a missing angle becomes a hands-on
 * act of closing the gap rather than reading a slider.
 */
export interface AngleFillStep extends StepBase {
  type: 'angleFill'
  given: [number, number]
  tolerance: number
  /** Short real-world label drawn near the wedges, e.g. "ramp brace". */
  context?: string
}

/**
 * "Build the area" activity. The learner drags to grow a rectangle (e.g. an area
 * rug) out of unit squares on a grid; the live area = current width × height is
 * shown as it grows. Passes when the built rectangle reaches the target size.
 * A more hands-on replacement for plotting an answer on a number line.
 */
export interface AreaBuildStep extends StepBase {
  type: 'areaBuild'
  width: number
  height: number
  /** Expected area (width × height). */
  target: number
  unit?: string
  /** Real-world label for the rectangle, e.g. "area rug". */
  context?: string
}

/**
 * Battleship capstone: each shot is a POINT (a coordinate); each ship is a
 * SEGMENT (two endpoints, finite length). Reinforces points & segments on the
 * coordinate plane as the finale of "Points, Lines & Rays".
 */
export interface BattleshipStep extends StepBase {
  type: 'battleship'
  /** Board is size×size, coords 1..size. Default 8. */
  size?: number
  /** Ship lengths (distinct). Default [2, 3, 4]. */
  fleet?: number[]
}

/**
 * "Slide it home" translation activity. The learner drags a whole polygon (e.g. a
 * boat) across a coordinate grid. A faint ghost marks the start, a live vector arrow
 * runs from the start reference point to the current one with a (Δx, Δy) readout, and
 * a dashed target outline shows where it must dock. Dragging snaps to integer units;
 * passing requires the applied translation to equal `vector`.
 */
export interface SlideShapeStep extends StepBase {
  type: 'slideShape'
  grid: { min: number; max: number }
  /** Polygon vertices (math coords) at the start position. */
  shape: Point[]
  /** Required translation vector to dock onto the dashed target outline. */
  vector: Point
  /** Max per-axis error (grid units) allowed when checking. */
  tolerance: number
  /** Cosmetic label drawn on the shape, e.g. "boat". */
  shapeLabel?: string
}

/**
 * "Mirror in the lake" reflection activity. A draggable polygon sits on the near
 * side of a mirror line; its mirror image is drawn live (watery translucent fill) on
 * the far side and updates symmetrically as the learner drags. A dashed target outline
 * sits on the reflection side; passing requires the live mirror image to land on it.
 */
export interface MirrorShapeStep extends StepBase {
  type: 'mirrorShape'
  grid: { min: number; max: number }
  /** Draggable shape's start vertices (math coords), on the near side of the mirror. */
  shape: Point[]
  /** Mirror line: an axis at a value (e.g. the y-axis at x = 0). */
  mirror: { axis: 'x' | 'y'; at: number }
  /** Dashed target outline (math coords) on the reflection side; the live mirror image must dock here. */
  target: Point[]
  /** Max per-vertex error (grid units) allowed when checking. */
  tolerance: number
  /** Cosmetic label drawn on the shape. */
  shapeLabel?: string
}

/**
 * "Spin the wheel" rotation activity. The learner drags a handle to turn a whole
 * polygon about a fixed center (like a Ferris wheel car about its hub). A live sweep
 * arc and degree readout track the angle; a dashed target outline shows the goal
 * orientation. The dragged angle snaps to `snapDegrees`; passing requires it to be
 * within `toleranceDegrees` of `targetAngle` (CCW positive).
 */
export interface SpinShapeStep extends StepBase {
  type: 'spinShape'
  grid: { min: number; max: number }
  /** Shape vertices at 0° (math coords). */
  shape: Point[]
  /** Fixed center of rotation. */
  center: Point
  /** Target rotation in degrees, counterclockwise positive. */
  targetAngle: number
  toleranceDegrees: number
  /** Snap increment for the dragged angle (degrees). Defaults to 5. */
  snapDegrees?: number
  /** Cosmetic label drawn on the shape, e.g. "car". */
  shapeLabel?: string
}

export type Step =
  | ConceptStep
  | MultipleChoiceStep
  | AngleDragStep
  | DragTriangleStep
  | SliderStep
  | DragPointStep
  | DistanceFlightStep
  | PlotStep
  | SortBinsStep
  | AngleTargetStep
  | ConnectDotsStep
  | RayAimStep
  | CornerTearStep
  | PythagSquaresStep
  | LadderStep
  | GridShapeStep
  | MirrorGridStep
  | AngleFillStep
  | AreaBuildStep
  | BattleshipStep
  | SlideShapeStep
  | MirrorShapeStep
  | SpinShapeStep

export interface Lesson {
  id: string
  order: number
  title: string
  summary: string
  estimatedMinutes: number
  steps: Step[]
}
