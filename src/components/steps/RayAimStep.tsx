import { useEffect, useState } from 'react'
import type { RayAimStep as RayStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { SeaTopDown } from './rayaim/SeaTopDown'
import { CoordinateGrid } from './rayaim/CoordinateGrid'
import { Harbor } from './rayaim/Harbor'
import { SearchBeam } from './rayaim/SearchBeam'
import { RayGeometry } from './rayaim/RayGeometry'
import { Boat } from './rayaim/Boat'
import { GameHud } from './rayaim/GameHud'
import { ConceptCoach } from './rayaim/ConceptCoach'
import { RayQuiz } from './rayaim/RayQuiz'
import { useLighthouseGame } from './rayaim/useLighthouseGame'

const VB = 264
const PAD = 26
const GOAL_RADIUS = 18
const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

/** Concept check shown once the ship is home — grounded in what the learner just did. */
const QUIZ = {
  question: 'While you steered the ship home, what stayed in exactly the same place the whole time?',
  options: [
    { id: 'ship', label: 'The ship' },
    { id: 'endpoint', label: 'The lighthouse' },
    { id: 'direction', label: 'The beam’s direction' },
    { id: 'edge', label: 'The edge of the sea' },
  ],
  correctId: 'endpoint',
  explanation:
    'Right — a ray has one fixed endpoint. You rotated the beam’s direction and the ship drifted, but the lighthouse never moved.',
}

/** Honour the OS "reduce motion" setting (SMIL ignores the media query on its own). */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(reducedMotionQuery).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(reducedMotionQuery)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export function RayAimStep({ step, setChecker, locked }: InteractiveStepProps<RayStep>) {
  const { min, max } = step.grid
  const span = max - min
  const unit = (VB - 2 * PAD) / span
  const gx = (x: number) => PAD + (x - min) * unit
  const gy = (y: number) => VB - PAD - (y - min) * unit
  const invGx = (px: number) => min + (px - PAD) / unit
  const invGy = (py: number) => min + (VB - PAD - py) / unit

  const reduceMotion = usePrefersReducedMotion()

  // Lighthouse/home = origin; ship spawns at target. Both in viewBox pixels.
  const home = { x: gx(step.origin.x), y: gy(step.origin.y) }
  const shipStart = { x: gx(step.target.x), y: gy(step.target.y) }

  const game = useLighthouseGame(
    { home, shipStart, beamStartDeg: step.startDeg, winRadius: GOAL_RADIUS },
    { reduceMotion, paused: locked },
  )

  // Completion requires BOTH guiding the ship home AND answering the concept check.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const quizCorrect = selectedId === QUIZ.correctId
  useEffect(() => {
    setChecker(() => game.won && quizCorrect)
  }, [game.won, quizCorrect, setChecker])

  // Live math, in grid units, for the coach + annotations.
  const shipCoord = { x: invGx(game.shipX), y: invGy(game.shipY) }
  const distanceUnits = game.distance / unit

  return (
    <div className="interactive">
      <ConceptCoach
        phase={game.phase}
        directionDeg={game.beamDeg}
        endpointCoord={step.origin}
        shipCoord={shipCoord}
        distanceUnits={distanceUnits}
        illuminated={game.illuminated}
        won={game.won}
      />
      <p className="sort-help">
        Drag (or use ← →) to aim the ray. Keep the light on the ship and it sails home.
      </p>
      <svg
        viewBox={`0 0 ${VB} ${VB}`}
        className="interactive-svg sea"
        role="application"
        aria-label="Top-down sea on a coordinate grid. Aim the lighthouse ray to keep the drifting ship lit so it sails home."
        tabIndex={0}
        onPointerDown={game.bind.onPointerDown}
        onPointerMove={game.bind.onPointerMove}
        onPointerUp={game.bind.onPointerUp}
        onKeyDown={game.bind.onKeyDown}
        style={{ touchAction: 'none', isolation: 'isolate' }}
      >
        <clipPath id="rayclip">
          <rect x={0} y={0} width={VB} height={VB} rx={16} />
        </clipPath>
        <g clipPath="url(#rayclip)">
          <SeaTopDown size={VB} homeX={home.x} homeY={home.y} reduceMotion={reduceMotion} />
          <CoordinateGrid size={VB} pad={PAD} min={min} max={max} />
          <Harbor x={home.x} y={home.y} goalRadius={GOAL_RADIUS} arrived={game.won} reduceMotion={reduceMotion} />
          <SearchBeam
            originX={home.x}
            originY={home.y}
            angleDeg={game.beamDeg}
            halfAngleDeg={11}
            length={270}
            lit={game.illuminated}
            reduceMotion={reduceMotion}
          />
          <RayGeometry
            originX={home.x}
            originY={home.y}
            angleDeg={game.beamDeg}
            length={250}
            lit={game.illuminated}
            endpointLabel="L"
            endpointCoord={step.origin}
            shipX={game.shipX}
            shipY={game.shipY}
            shipCoord={shipCoord}
          />
          <Boat
            x={game.shipX}
            y={game.shipY}
            heading={game.heading}
            moving={game.phase === 'guiding'}
            illuminated={game.illuminated}
            spotId={game.spotId}
            arrived={game.won}
            reduceMotion={reduceMotion}
          />
        </g>
      </svg>
      <GameHud
        progress={game.progress}
        phase={game.phase}
        distance={distanceUnits}
        won={game.won}
        reduceMotion={reduceMotion}
      />
      {game.won && (
        <RayQuiz
          question={QUIZ.question}
          options={QUIZ.options}
          correctId={QUIZ.correctId}
          explanation={QUIZ.explanation}
          selectedId={selectedId}
          onSelect={setSelectedId}
          locked={locked}
        />
      )}
    </div>
  )
}
