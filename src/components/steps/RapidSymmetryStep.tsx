import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { SymmetryRapidStep as RapidStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'

type Phase = 'ready' | 'playing' | 'done'

interface ShapeDef {
  id: string
  name: string
  lines: number
}

// The shape pool. Each shape's `lines` is its number of lines of symmetry.
const POOL: ShapeDef[] = [
  { id: 'scalene', name: 'Scalene triangle', lines: 0 },
  { id: 'parallelogram', name: 'Parallelogram', lines: 0 },
  { id: 'isosceles', name: 'Isosceles triangle', lines: 1 },
  { id: 'arrow', name: 'Arrow', lines: 1 },
  { id: 'rectangle', name: 'Rectangle', lines: 2 },
  { id: 'equilateral', name: 'Equilateral triangle', lines: 3 },
  { id: 'square', name: 'Square', lines: 4 },
  { id: 'cross', name: 'Plus / cross', lines: 4 },
  { id: 'pentagon', name: 'Regular pentagon', lines: 5 },
  { id: 'hexagon', name: 'Regular hexagon', lines: 6 },
]

const OPTIONS = [0, 1, 2, 3, 4, 5, 6]

const ACC = 'var(--accent)'
const ACC_BG = 'var(--accent-bg)'

const regular = (n: number, r = 54, cx = 80, cy = 84, startDeg = -90) => {
  const pts: string[] = []
  for (let i = 0; i < n; i++) {
    const a = ((startDeg + (i * 360) / n) * Math.PI) / 180
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

function ShapeArt({ kind }: { kind: string }) {
  const common = {
    fill: ACC_BG,
    stroke: ACC,
    strokeWidth: 3,
    strokeLinejoin: 'round' as const,
  }
  let el: ReactNode = null
  switch (kind) {
    case 'equilateral':
      el = <polygon points={regular(3)} {...common} />
      break
    case 'pentagon':
      el = <polygon points={regular(5)} {...common} />
      break
    case 'hexagon':
      el = <polygon points={regular(6)} {...common} />
      break
    case 'square':
      el = <rect x={28} y={32} width={104} height={104} rx={2} {...common} />
      break
    case 'rectangle':
      el = <rect x={20} y={52} width={120} height={64} rx={2} {...common} />
      break
    case 'isosceles':
      el = <polygon points="80,26 116,130 44,130" {...common} />
      break
    case 'scalene':
      el = <polygon points="34,122 132,138 100,42" {...common} />
      break
    case 'parallelogram':
      el = <polygon points="44,120 116,120 132,48 60,48" {...common} />
      break
    case 'arrow':
      el = <polygon points="80,24 122,72 100,72 100,132 60,132 60,72 38,72" {...common} />
      break
    case 'cross':
      el = (
        <polygon
          points="60,30 100,30 100,64 134,64 134,104 100,104 100,138 60,138 60,104 26,104 26,64 60,64"
          {...common}
        />
      )
      break
  }
  return (
    <svg viewBox="0 0 160 160" width={188} height={188} role="img" aria-label="shape">
      {el}
    </svg>
  )
}

const shuffle = (n: number) => {
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function RapidSymmetryStep({ step, setChecker, locked }: InteractiveStepProps<RapidStep>) {
  const perQ = step.secondsPerShape ?? 6
  const runLen = Math.min(step.rounds ?? 8, POOL.length)

  const [phase, setPhase] = useState<Phase>('ready')
  const [order, setOrder] = useState<number[]>([])
  const [pos, setPos] = useState(0)
  const [timeLeft, setTimeLeft] = useState(perQ)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [flash, setFlash] = useState<null | { ok: boolean; correct: number; picked: number | null }>(null)
  const [finished, setFinished] = useState(false)

  const advanceRef = useRef<number | undefined>(undefined)
  const streakRef = useRef(0)
  const bestRef = useRef(0)
  const stateRef = useRef({ phase, pos, order, flash })

  useEffect(() => {
    stateRef.current = { phase, pos, order, flash }
  }, [phase, pos, order, flash])

  useEffect(() => {
    setChecker(() => finished)
  }, [finished, setChecker])

  useEffect(() => () => window.clearTimeout(advanceRef.current), [])

  const resolve = useCallback(
    (picked: number | null) => {
      const s = stateRef.current
      if (s.phase !== 'playing' || s.flash) return
      const shape = POOL[s.order[s.pos]]
      const ok = picked === shape.lines
      setFlash({ ok, correct: shape.lines, picked })
      if (ok) {
        setScore((v) => v + 1)
        streakRef.current += 1
        if (streakRef.current > bestRef.current) bestRef.current = streakRef.current
        setStreak(streakRef.current)
      } else {
        streakRef.current = 0
        setStreak(0)
      }
      window.clearTimeout(advanceRef.current)
      advanceRef.current = window.setTimeout(() => {
        const cur = stateRef.current
        const next = cur.pos + 1
        setFlash(null)
        if (next >= cur.order.length) {
          setPhase('done')
          setFinished(true)
          setBest(bestRef.current)
        } else {
          setPos(next)
          setTimeLeft(perQ)
        }
      }, ok ? 650 : 1150)
    },
    [perQ],
  )

  // Per-shape countdown. Pauses while a result is flashing.
  useEffect(() => {
    if (phase !== 'playing' || flash) return
    if (timeLeft <= 0) {
      resolve(null)
      return
    }
    const id = window.setTimeout(() => setTimeLeft((t) => +(t - 0.1).toFixed(1)), 100)
    return () => window.clearTimeout(id)
  }, [phase, flash, timeLeft, resolve])

  const start = () => {
    if (locked) return
    streakRef.current = 0
    bestRef.current = 0
    setOrder(shuffle(POOL.length).slice(0, runLen))
    setPos(0)
    setScore(0)
    setStreak(0)
    setBest(0)
    setTimeLeft(perQ)
    setFlash(null)
    setFinished(false)
    setPhase('playing')
  }

  if (phase === 'ready') {
    return (
      <div className="interactive rapid">
        <div className="rapid-card">
          <p className="rapid-big">Lines of Symmetry — Rapid Fire</p>
          <p className="rapid-sub">
            {runLen} shapes, {perQ}s each. Tap how many lines of symmetry each shape has before the
            timer runs out. Build a streak!
          </p>
          <button type="button" className="btn primary full" disabled={locked} onClick={start}>
            Start
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    const perfect = score === runLen
    return (
      <div className="interactive rapid">
        <div className="rapid-card">
          <p className="rapid-big">{perfect ? 'Flawless!' : 'Time!'}</p>
          <p className="rapid-score">
            {score} / {runLen}
          </p>
          <p className="rapid-sub">Best streak: {best} in a row.</p>
          <button type="button" className="btn ghost full" disabled={locked} onClick={start}>
            Play again
          </button>
          <p className="rapid-sub" style={{ marginTop: 4 }}>Press Check below to finish the lesson.</p>
        </div>
      </div>
    )
  }

  // playing
  const shape = POOL[order[pos]]
  const frac = Math.max(0, Math.min(1, timeLeft / perQ))
  const low = frac < 0.34

  return (
    <div className="interactive rapid">
      <div className="rapid-hud">
        <span>
          Shape {pos + 1}/{runLen}
        </span>
        <span>Score {score}</span>
        <span>🔥 {streak}</span>
      </div>

      <div className="rapid-timer">
        <div
          className="rapid-timer-fill"
          style={{ width: `${frac * 100}%`, background: low ? 'var(--bad)' : 'var(--accent)' }}
        />
      </div>

      <div className="rapid-stage">
        <ShapeArt kind={shape.id} />
        {flash && (
          <div className={`rapid-flash ${flash.ok ? 'ok' : 'no'}`}>
            {flash.ok ? 'Correct!' : `${flash.correct} line${flash.correct === 1 ? '' : 's'}`}
          </div>
        )}
      </div>

      <p className="sort-help">How many lines of symmetry?</p>
      <div className="rapid-options">
        {OPTIONS.map((n) => {
          let cls = 'btn rapid-opt'
          if (flash) {
            if (n === flash.correct) cls += ' good'
            else if (n === flash.picked) cls += ' bad'
          }
          return (
            <button
              key={n}
              type="button"
              className={cls}
              disabled={locked || !!flash}
              onClick={() => resolve(n)}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}
