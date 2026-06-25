import { useEffect, useRef, useState } from 'react'
import type { AngleLockStep as LockStep, Point } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox } from '../figures/geometry'

const VB_W = 300
const VB_H = 232
const O = { x: 150, y: 196 }
const R = 120

/** Polar point: baseline runs right (0°) to left (180°), upper half. */
const polar = (deg: number, r: number): Point => {
  const rad = (deg * Math.PI) / 180
  return { x: O.x + r * Math.cos(rad), y: O.y - r * Math.sin(rad) }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function AngleLockStep({ step, setChecker, locked }: InteractiveStepProps<LockStep>) {
  const dials = step.dials
  const snap = step.snapDegrees ?? 5
  const tol = step.tolerance ?? 0

  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragging = useRef(false)
  const shakeTimer = useRef<number | null>(null)

  const [current, setCurrent] = useState(0)
  const [needle, setNeedle] = useState(90)
  const [solved, setSolved] = useState<number[]>([]) // committed answer per cracked tumbler
  const [wrong, setWrong] = useState(false)
  const [shake, setShake] = useState(false)

  const allCracked = current >= dials.length

  useEffect(() => {
    setChecker(() => current >= dials.length)
  }, [current, dials.length, setChecker])

  useEffect(() => () => { if (shakeTimer.current) window.clearTimeout(shakeTimer.current) }, [])

  const dial = dials[Math.min(current, dials.length - 1)]
  const answer = 180 - dial.a - dial.b

  const update = (clientX: number, clientY: number) => {
    if (!svgRef.current) return
    const p = clientToViewBox(svgRef.current, clientX, clientY, VB_W, VB_H)
    let a = (Math.atan2(O.y - p.y, p.x - O.x) * 180) / Math.PI
    a = clamp(a, 0, 180)
    a = Math.round(a / snap) * snap
    setNeedle(a)
    setWrong(false)
  }
  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (locked || allCracked) return
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    update(e.clientX, e.clientY)
  }
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragging.current) update(e.clientX, e.clientY)
  }
  const onUp = () => {
    dragging.current = false
  }

  const lockIn = () => {
    if (locked || allCracked) return
    if (Math.abs(needle - answer) <= tol) {
      setSolved((s) => [...s, needle])
      setCurrent((c) => c + 1)
      setNeedle(90)
      setWrong(false)
    } else {
      setWrong(true)
      setShake(true)
      if (shakeTimer.current) window.clearTimeout(shakeTimer.current)
      shakeTimer.current = window.setTimeout(() => setShake(false), 420)
    }
  }

  // --- protractor tick marks ---
  const ticks = []
  for (let d = 0; d <= 180; d += 5) {
    const major = d % 30 === 0
    const p1 = polar(d, R)
    const p2 = polar(d, R - (major ? 14 : 8))
    ticks.push(
      <line key={`t${d}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--border)" strokeWidth={major ? 1.6 : 1} />,
    )
    if (major) {
      const lp = polar(d, R - 26)
      ticks.push(
        <text key={`l${d}`} x={lp.x} y={lp.y + 4} fontSize={9} fill="var(--muted)" textAnchor="middle">{d}</text>,
      )
    }
  }

  const handle = polar(needle, R - 4)
  const knob = polar(needle, R - 4)

  // mini triangle hint (generic shape; corners labelled a, b, ?)
  const triA = { x: 232, y: 86 }
  const triB = { x: 290, y: 86 }
  const triC = { x: 258, y: 44 }

  return (
    <div className="interactive">
      <div className="readout">
        <span className="readout-value">{allCracked ? '✓' : `${needle}°`}</span>
        <span className="readout-label">
          {allCracked ? 'safe cracked' : `dialing tumbler ${current + 1} of ${dials.length}`}
        </span>
      </div>

      <div className="lock-tumblers" aria-label="Combination progress">
        {dials.map((d, i) => {
          const done = i < current
          const active = i === current
          return (
            <span key={i} className={`lock-pip${done ? ' done' : ''}${active ? ' active' : ''}`}>
              {done ? `✓ ${solved[i]}°` : active ? '?' : '•'}
              {d.context && <span className="lock-pip-ctx">{d.context}</span>}
            </span>
          )
        })}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className={`interactive-svg${shake ? ' lock-shake' : ''}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        style={{ touchAction: 'none', cursor: locked || allCracked ? 'default' : 'grab' }}
      >
        {/* dial face */}
        <path d={`M ${O.x - R} ${O.y} A ${R} ${R} 0 0 1 ${O.x + R} ${O.y} Z`} fill="var(--accent-bg)" />
        <path d={`M ${O.x - R} ${O.y} A ${R} ${R} 0 0 1 ${O.x + R} ${O.y}`} fill="none" stroke="var(--border)" strokeWidth={2} />
        <line x1={O.x - R} y1={O.y} x2={O.x + R} y2={O.y} stroke="var(--border)" strokeWidth={2} />
        {ticks}

        {allCracked ? (
          <text x={O.x} y={O.y - R / 2} fontSize={20} fill="var(--accent)" textAnchor="middle" fontWeight={800}>
            UNLOCKED
          </text>
        ) : (
          <>
            {/* known-angle hint: mini triangle with two corners + a ? */}
            <polygon
              points={`${triA.x},${triA.y} ${triB.x},${triB.y} ${triC.x},${triC.y}`}
              fill="var(--card)"
              stroke="var(--border)"
              strokeWidth={1.5}
            />
            <text x={triA.x + 6} y={triA.y - 4} fontSize={10} fill="var(--text-h)" textAnchor="middle" fontWeight={700}>{dial.a}°</text>
            <text x={triB.x - 6} y={triB.y - 4} fontSize={10} fill="var(--text-h)" textAnchor="middle" fontWeight={700}>{dial.b}°</text>
            <text x={triC.x} y={triC.y + 13} fontSize={11} fill="var(--accent)" textAnchor="middle" fontWeight={800}>?</text>

            {/* needle */}
            <line x1={O.x} y1={O.y} x2={handle.x} y2={handle.y} stroke="var(--accent)" strokeWidth={3.5} strokeLinecap="round" />
            <circle cx={knob.x} cy={knob.y} r={9} fill="var(--accent)" stroke="#fff" strokeWidth={2} />
          </>
        )}

        {/* hub */}
        <circle cx={O.x} cy={O.y} r={7} fill="var(--text-h)" />
        <circle cx={O.x} cy={O.y} r={3} fill="var(--card)" />
      </svg>

      {allCracked ? (
        <p className="sort-help lock-success">Safe cracked! Every missing corner was 180° minus the two you were given.</p>
      ) : (
        <>
          <button type="button" className="btn primary full" disabled={locked} onClick={lockIn}>
            Lock in {needle}°{dial.context ? ` for the ${dial.context}` : ''}
          </button>
          <p className={`sort-help${wrong ? ' lock-wrong' : ''}`}>
            {wrong
              ? "That tumbler won't budge. The three corners of a triangle always add to 180° — recompute and try again."
              : `Two corners are ${dial.a}° and ${dial.b}°. Work out the missing corner, spin the dial to it, then lock it in.`}
          </p>
        </>
      )}
    </div>
  )
}
