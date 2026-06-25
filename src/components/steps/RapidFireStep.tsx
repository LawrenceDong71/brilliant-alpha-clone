import { useEffect, useMemo, useState } from 'react'
import type { RapidFireStep as RFStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import type { RapidFireConfig } from './rapidfire/types'
import { useRapidFire } from './rapidfire/useRapidFire'
import { CourtScene } from './rapidfire/CourtScene'
import { RapidFireHud } from './rapidfire/RapidFireHud'

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

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

export function RapidFireStep({ step, setChecker, locked }: InteractiveStepProps<RFStep>) {
  const reduceMotion = usePrefersReducedMotion()
  const [seed] = useState(() => Date.now())

  const config = useMemo<RapidFireConfig>(
    () => ({
      rounds: step.rounds ?? 7,
      secondsPerRound: step.secondsPerRound ?? 5,
      anglePool: step.anglePool ?? [15, 30, 45, 60, 75, 90, 105, 120, 135, 150],
      optionsPerRound: step.optionsPerRound ?? 3,
      passRatio: step.passRatio ?? 0.6,
      seed,
    }),
    [step.rounds, step.secondsPerRound, step.anglePool, step.optionsPerRound, step.passRatio, seed],
  )

  const game = useRapidFire(config, { paused: locked })

  useEffect(() => {
    setChecker(() => game.finished && game.passed)
  }, [game.finished, game.passed, setChecker])

  const round = game.round
  const chosenAngle = game.selectedIndex != null ? round.choices[game.selectedIndex] : null
  const reveal = game.phase !== 'playing'
  // Obtuse rounds put the hoop up-and-to-the-LEFT; the angle is the wide outward
  // one (from the ground, past 90°) — call that out so it isn't read as the small angle.
  const obtuseRound = round.correctAngle > 90

  return (
    <div className="interactive">
      <p className="sort-help">Quick — eyeball the shot: which angle sends the ball into the hoop?</p>
      {!game.finished && (
        <p
          className="sort-help"
          style={{
            margin: 0,
            minHeight: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: obtuseRound ? 700 : 400,
            color: obtuseRound ? 'var(--warn)' : 'var(--muted)',
          }}
        >
          {obtuseRound
            ? 'Hoop on the left? Read the wide outward angle — the one past 90° (obtuse), not the small angle.'
            : 'Heads up: the angle is read from the ground, sweeping up and over.'}
        </p>
      )}
      <CourtScene
        ball={round.ball}
        hoop={round.hoop}
        correctAngle={round.correctAngle}
        chosenAngle={chosenAngle}
        reveal={reveal}
        result={game.lastResult}
        reduceMotion={reduceMotion}
      />
      <RapidFireHud
        phase={game.phase}
        roundIndex={game.roundIndex}
        totalRounds={game.totalRounds}
        timeFraction={game.timeFraction}
        choices={round.choices}
        selectedIndex={game.selectedIndex}
        correctIndex={round.correctIndex}
        reveal={reveal}
        result={game.lastResult}
        score={game.score}
        streak={game.streak}
        bestStreak={game.bestStreak}
        finished={game.finished}
        passed={game.passed}
        passThreshold={game.passThreshold}
        onAnswer={game.answer}
        onPlayAgain={game.playAgain}
        reduceMotion={reduceMotion}
      />
    </div>
  )
}
