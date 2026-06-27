export interface Point {
  x: number
  y: number
}

export interface Feedback {
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
 * Build a sequence of target angles using two draggable clock hands. The hands
 * snap to the 12 hour marks (each hour = 30°), so multiples of 30 are exact.
 */
export interface ClockAnglesStep extends StepBase {
  type: 'clockAngles'
  /** Target angles (degrees) the learner forms in order, e.g. [90, 30, 120]. */
  targets: number[]
}

/**
 * Discover Area of a triangle = ½ × base × height by boxing a right triangle
 * inside its bounding rectangle and seeing it fill exactly half.
 */
export interface TriangleAreaStep extends StepBase {
  type: 'triangleArea'
  base: number
  height: number
  /** The triangle's area = base × height / 2. */
  target: number
  context?: string
  unit?: string
  /** Grid extent (cells on each axis). Defaults to ~max(base, height) + 2. */
  gridMax?: number
}

/**
 * Find a non-rectangle's area by DECOMPOSITION: drag a divider to split the
 * shape into two rectangles whose areas add up to the total.
 */
/**
 * Rapid-fire "lines of symmetry" round: shapes flash by on a per-shape timer and
 * the learner taps how many lines of symmetry each has. The shape pool and art
 * live in the component; the step just tunes pace and length.
 */
export interface SymmetryRapidStep extends StepBase {
  type: 'symmetryRapid'
  /** Seconds allowed per shape before it auto-misses. Defaults to 6. */
  secondsPerShape?: number
  /** How many shapes in one run. Defaults to 8. */
  rounds?: number
}

export interface DecomposeAreaStep extends StepBase {
  type: 'decomposeArea'
  cols: number
  rows: number
  /** Filled cells of the shape, each [col, row]. */
  cells: Array<[number, number]>
  /** Expected total area (number of filled cells). */
  total: number
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
  /**
   * Sequence of target rotations (degrees, counterclockwise positive) the
   * learner must hit one after another. Each is submitted and checked on its
   * own; the step completes once every round is cleared.
   */
  targets: number[]
  toleranceDegrees: number
  /** Snap increment for the dragged angle (degrees). Defaults to 5. */
  snapDegrees?: number
  /** Cosmetic label drawn on the shape, e.g. "car". */
  shapeLabel?: string
}

/**
 * "Clip the segment" activity. A faint infinite line runs across the canvas
 * (arrows on both ends). A real object (e.g. a pencil) lies along part of it.
 * The learner drags two endpoint stops along the line to bracket exactly the
 * object — turning the endless line into a finite segment with two endpoints.
 */
export interface ClipSegmentStep extends StepBase {
  type: 'clipSegment'
  /** Axis range shown; the line is horizontal at mid-height. */
  min: number
  max: number
  /** Target stop positions along the axis: the object's two ends. */
  startTarget: number
  endTarget: number
  /** Allowed error (axis units) when checking each stop. */
  tolerance: number
  /** Cosmetic theme/label for the object on the line. */
  context?: string
  instruction?: string
}

/**
 * "Brace It!" capstone mini-game for the Pythagorean theorem. Each round shows a wobbly
 * rectangular frame whose two side lengths are stamped on it; the learner must compute the
 * diagonal brace length (the hypotenuse, c = √(w² + h²)), cut a board to that length, and
 * fit it to lock the frame square. The frame is drawn schematically (not to pixel-scale),
 * so the only way through is to actually apply a² + b² = c². Passes once every frame is braced.
 */
export interface BraceItStep extends StepBase {
  type: 'braceIt'
  /** Each round's rectangular frame. Use Pythagorean triples so the brace is a whole number. */
  frames: Array<{ w: number; h: number }>
  /** Highest length on the cut ruler. Defaults to (max brace + 3). */
  maxCut?: number
  unit?: string
}

/**
 * "Give the dog room" — fixed-perimeter area discovery. The learner drags a corner of a
 * rectangular pen whose fence length (perimeter) is fixed, so width and height trade off
 * (width + height = perimeter / 2). Area = width × height changes as the shape changes and
 * is maximized by the square. Passes once the learner shapes the pen to its maximum area.
 */
export interface PenShapeStep extends StepBase {
  type: 'penShape'
  /** Total fence length (perimeter) in units; use a multiple of 4 so the square has integer sides (e.g. 16). */
  perimeter: number
  /** Starting width; height is derived as perimeter/2 − width. */
  startWidth: number
  /** A reference/rival rectangle drawn faintly for comparison. */
  rival?: { width: number; height: number; label?: string }
  /** Unit label, e.g. 'm'. */
  unit?: string
}

/**
 * "Crack the angle safe" combination-lock puzzle. Each dial is a triangle with two
 * known corners; the learner must work out the missing third corner (the three
 * interior angles total 180°), spin a protractor needle to it, and lock the tumbler.
 * There is no target marker and no running sum shown, so the only way through is to
 * actually compute 180 − a − b. The safe opens once every tumbler is locked.
 */
export interface AngleLockStep extends StepBase {
  type: 'angleLock'
  dials: Array<{ a: number; b: number; context?: string }>
  /** Needle snaps to this increment in degrees (default 5). Keep dial answers on it. */
  snapDegrees?: number
  /** Allowed slack when matching the dialed value to the answer (default 0). */
  tolerance?: number
}

/**
 * "Balance the squares" — reverse Pythagoras on a balance scale. The square on
 * the hypotenuse (c²) sits on one pan; the square on the known leg (a²) sits on
 * the other. The learner grows the missing leg's square (b²) until the two leg
 * squares balance the hypotenuse square, i.e. a² + b² = c² — revealing leg b.
 */
export interface PythagBalanceStep extends StepBase {
  type: 'pythagBalance'
  /** Hypotenuse length c (e.g. ladder = 10). */
  hypotenuse: number
  /** Known leg length a (e.g. window height = 8). */
  knownLeg: number
  /** Expected missing leg b = √(c² − a²) (e.g. 6) — used for range & feedback. */
  targetLeg: number
  /** Cosmetic real-world label, e.g. "fire ladder". */
  context?: string
}

/**
 * "Build the solution" — reverse Pythagoras as an assembled calculation. The
 * learner drags number tiles into the blanks of a worked solution
 * (c² → a² → c²−a² → √) to find the missing leg. There is no continuous
 * geometric feedback, so the answer can only be reached by actually computing
 * each step; the tile pool includes classic trap values.
 */
export interface PythagSolveStep extends StepBase {
  type: 'pythagSolve'
  /** Hypotenuse length c (e.g. ladder = 10). */
  hypotenuse: number
  /** Known leg length a (e.g. window height = 8). */
  knownLeg: number
  /** Expected missing leg b = √(c² − a²) (e.g. 6). */
  targetLeg: number
  /** Cosmetic real-world label, e.g. "fire ladder". */
  context?: string
}

/**
 * Rapid-fire basketball angle-eyeballing capstone: timed rounds each show a ball
 * and a hoop in a new configuration; the learner quickly picks the shot angle
 * (above horizontal) that would sink it. Practices estimating angles by eye.
 */
export interface RapidFireStep extends StepBase {
  type: 'rapidFire'
  rounds?: number
  secondsPerRound?: number
  anglePool?: number[]
  optionsPerRound?: number
  passRatio?: number
}

/**
 * "Truss Rescue" capstone — repair a storm-damaged truss bridge panel by panel.
 * For each panel the learner first finds the missing corner angle (180° − the
 * two shown) by fitting the correct bracket, then certifies the triangle's type
 * (acute / right / obtuse). The step is solved once every panel is repaired.
 */
export interface TrussRescueStep extends StepBase {
  type: 'trussRescue'
  panels: Array<{
    /** Two known interior angles; the third is 180 − a − b. */
    a: number
    b: number
    /** Short real-world label, e.g. "Ramp brace". */
    context?: string
    /** Optional flavor spec note shown on the panel. */
    spec?: string
  }>
}

/**
 * "Split Sprint" — a timed conveyor mini-game that caps the Area & Perimeter
 * lesson. L-shaped slabs ride in on a belt one at a time; for each, the learner
 * drags a single cut line (horizontal or vertical) until it slices the slab into
 * TWO solid rectangles, then locks the cut before the round timer runs out. Each
 * clear shows the two rectangle areas adding up to the whole — reinforcing "area
 * by decomposition" from the L-shape step, now as an arcade reflex.
 */
export interface SplitSprintStep extends StepBase {
  type: 'splitSprint'
  /**
   * Slabs to clear, presented in random order. Each is a solid region on its own
   * grid (row 0 at the bottom, like the other grid steps). Every slab MUST be
   * splittable into two solid rectangles by a single straight cut.
   */
  shapes: Array<{ cols: number; rows: number; cells: Array<[number, number]> }>
  /** Seconds allowed per slab before it rolls off. Defaults to 7. */
  secondsPerShape?: number
  /** How many slabs in one run (clamped to shapes.length). Defaults to all. */
  rounds?: number
  /** Fraction of rounds that must be cleared to pass the step. Defaults to 0.6. */
  passRatio?: number
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
  | AngleLockStep
  | BraceItStep
  | PenShapeStep
  | AreaBuildStep
  | ClipSegmentStep
  | BattleshipStep
  | ClockAnglesStep
  | TriangleAreaStep
  | DecomposeAreaStep
  | SlideShapeStep
  | MirrorShapeStep
  | SpinShapeStep
  | SymmetryRapidStep
  | SplitSprintStep
  | PythagBalanceStep
  | PythagSolveStep
  | TrussRescueStep
  | RapidFireStep

export interface Lesson {
  id: string
  order: number
  title: string
  summary: string
  estimatedMinutes: number
  steps: Step[]
}
