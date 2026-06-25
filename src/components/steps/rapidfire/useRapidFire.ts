import { useCallback, useEffect, useRef, useState } from 'react'
import { makeRng, makeRounds } from './shotRounds'
import type {
  RapidFireConfig,
  RapidFirePhase,
  RoundResult,
  ShotRound,
  UseRapidFireResult,
} from './types'

const DT_MAX = 0.05 // clamp huge frame gaps (tab refocus) to ~50ms of simulated time
const REVEAL_DWELL_MS = 1100 // how long the answer reveal lingers before auto-advancing

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

// Everything render needs in one object, mirrored from the refs by the loop/handlers.
type Snapshot = Omit<
  UseRapidFireResult,
  'finished' | 'passed' | 'passThreshold' | 'answer' | 'playAgain'
>

function buildRounds(config: RapidFireConfig, seed: number): ShotRound[] {
  const rng = makeRng(seed)
  return makeRounds(rng, {
    rounds: config.rounds,
    anglePool: config.anglePool,
    optionsPerRound: config.optionsPerRound,
  })
}

function makeSnapshot(config: RapidFireConfig, rounds: ShotRound[], solved: boolean): Snapshot {
  const totalRounds = rounds.length
  if (solved) {
    // Revisiting an already-cleared step: show the finished, fully-passed state.
    const lastIndex = Math.max(0, totalRounds - 1)
    return {
      phase: 'done',
      roundIndex: lastIndex,
      totalRounds,
      round: rounds[lastIndex],
      timeFraction: 1,
      selectedIndex: null,
      lastResult: null,
      score: config.rounds,
      streak: config.rounds,
      bestStreak: config.rounds,
    }
  }
  return {
    phase: 'playing',
    roundIndex: 0,
    totalRounds,
    round: rounds[0],
    timeFraction: 1,
    selectedIndex: null,
    lastResult: null,
    score: 0,
    streak: 0,
    bestStreak: 0,
  }
}

interface InitialRun {
  rounds: ShotRound[]
  snapshot: Snapshot
}

// Deterministic from the seed, so recomputing per render (only the first render's value is
// retained by useState/useRef) stays pure — no Date.now()/Math.random() in the render path.
function makeInitial(config: RapidFireConfig, seed: number, solved: boolean): InitialRun {
  const rounds = buildRounds(config, seed)
  return { rounds, snapshot: makeSnapshot(config, rounds, solved) }
}

export function useRapidFire(
  config: RapidFireConfig,
  opts?: { paused?: boolean },
): UseRapidFireResult {
  const pausedAtMount = !!opts?.paused
  const init0 = makeInitial(config, config.seed, pausedAtMount)

  // Latest config, mirrored in an effect so the loop/handlers never read a stale closure.
  const paramsRef = useRef(config)

  // Fast values the loop/handlers read — only touched in effects, the rAF callback, the
  // reveal timer, or the answer/playAgain handlers (never during render).
  const roundsRef = useRef(init0.rounds)
  const roundIndexRef = useRef(init0.snapshot.roundIndex)
  const phaseRef = useRef<RapidFirePhase>(init0.snapshot.phase)
  const scoreRef = useRef(init0.snapshot.score)
  const streakRef = useRef(init0.snapshot.streak)
  const bestStreakRef = useRef(init0.snapshot.bestStreak)
  const remainingRef = useRef(config.secondsPerRound * 1000) // ms left in the current round
  const pausedRef = useRef(pausedAtMount)
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // One state object, mirrored from the refs once per simulated frame / per handler.
  const [state, setState] = useState<Snapshot>(init0.snapshot)

  useEffect(() => {
    paramsRef.current = config
  })

  useEffect(() => {
    pausedRef.current = !!opts?.paused
  }, [opts?.paused])

  const applyInit = useCallback((seed: number, solved: boolean) => {
    if (dwellTimerRef.current != null) {
      clearTimeout(dwellTimerRef.current)
      dwellTimerRef.current = null
    }
    const rounds = buildRounds(paramsRef.current, seed)
    const snap = makeSnapshot(paramsRef.current, rounds, solved)
    roundsRef.current = rounds
    roundIndexRef.current = snap.roundIndex
    phaseRef.current = snap.phase
    scoreRef.current = snap.score
    streakRef.current = snap.streak
    bestStreakRef.current = snap.bestStreak
    remainingRef.current = paramsRef.current.secondsPerRound * 1000
    lastTimeRef.current = null // restart the timer baseline so the next frame has no dt spike
    setState(snap)
  }, [])

  const advance = useCallback(() => {
    const rounds = roundsRef.current
    const lastIndex = rounds.length - 1
    if (roundIndexRef.current >= lastIndex) {
      phaseRef.current = 'done'
      setState((s) => ({ ...s, phase: 'done' }))
      return
    }
    const nextIndex = roundIndexRef.current + 1
    roundIndexRef.current = nextIndex
    phaseRef.current = 'playing'
    remainingRef.current = paramsRef.current.secondsPerRound * 1000
    setState((s) => ({
      ...s,
      phase: 'playing',
      roundIndex: nextIndex,
      round: rounds[nextIndex],
      selectedIndex: null,
      lastResult: null,
      timeFraction: 1,
    }))
  }, [])

  const scheduleAdvance = useCallback(() => {
    if (dwellTimerRef.current != null) clearTimeout(dwellTimerRef.current)
    dwellTimerRef.current = setTimeout(() => {
      dwellTimerRef.current = null
      advance()
    }, REVEAL_DWELL_MS)
  }, [advance])

  // Countdown timer: rAF + delta time, mirrored to `timeFraction` each frame. It only ticks
  // during 'playing' and while unpaused; reaching zero is a timeout for the round.
  useEffect(() => {
    const tick = (dt: number) => {
      if (phaseRef.current !== 'playing') return
      const totalMs = paramsRef.current.secondsPerRound * 1000
      const remaining = remainingRef.current - dt * 1000
      if (remaining <= 0) {
        remainingRef.current = 0
        phaseRef.current = 'reveal'
        streakRef.current = 0
        setState((s) => ({
          ...s,
          phase: 'reveal',
          selectedIndex: null,
          lastResult: 'timeout',
          streak: 0,
          timeFraction: 0,
        }))
        scheduleAdvance()
        return
      }
      remainingRef.current = remaining
      const fraction = totalMs > 0 ? clamp01(remaining / totalMs) : 0
      setState((s) => (s.timeFraction === fraction ? s : { ...s, timeFraction: fraction }))
    }

    const frame = (now: number) => {
      const last = lastTimeRef.current
      lastTimeRef.current = now
      if (!pausedRef.current && last != null) {
        let dt = (now - last) / 1000
        if (dt < 0) dt = 0
        if (dt > DT_MAX) dt = DT_MAX
        tick(dt)
      }
      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lastTimeRef.current = null
    }
  }, [scheduleAdvance])

  // Cancel a pending reveal -> advance timer on unmount.
  useEffect(() => {
    return () => {
      if (dwellTimerRef.current != null) {
        clearTimeout(dwellTimerRef.current)
        dwellTimerRef.current = null
      }
    }
  }, [])

  const answer = useCallback(
    (choiceIndex: number) => {
      if (pausedRef.current) return
      if (phaseRef.current !== 'playing') return
      const round = roundsRef.current[roundIndexRef.current]
      const result: RoundResult = choiceIndex === round.correctIndex ? 'correct' : 'wrong'
      phaseRef.current = 'reveal' // stops the countdown via the tick gate
      if (result === 'correct') {
        scoreRef.current += 1
        streakRef.current += 1
        if (streakRef.current > bestStreakRef.current) bestStreakRef.current = streakRef.current
      } else {
        streakRef.current = 0
      }
      setState((s) => ({
        ...s,
        phase: 'reveal',
        selectedIndex: choiceIndex,
        lastResult: result,
        score: scoreRef.current,
        streak: streakRef.current,
        bestStreak: bestStreakRef.current,
      }))
      scheduleAdvance()
    },
    [scheduleAdvance],
  )

  const playAgain = useCallback(() => {
    // Fresh randomised run: derive a new seed from the base seed, last score, and the clock.
    const newSeed = paramsRef.current.seed + scoreRef.current * 1000 + (Date.now() % 1000)
    applyInit(newSeed, false)
  }, [applyInit])

  const passThreshold = Math.ceil(config.rounds * config.passRatio)
  const finished = state.phase === 'done'
  const passed = state.score >= passThreshold

  return {
    ...state,
    finished,
    passed,
    passThreshold,
    answer,
    playAgain,
  }
}
