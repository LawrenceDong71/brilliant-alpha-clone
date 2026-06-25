import { useEffect, useRef, useState } from 'react'
import type { ClockAnglesStep as ClockStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox, dist } from '../figures/geometry'

const VB = 240
const C = { x: 120, y: 120 }
const R = 92
const L = 78
const AR = 34

/** Tip of a hand at clock angle `c` (0 = 12 o'clock, increasing clockwise). */
function tip(c: number, len: number = L) {
  const r = (c * Math.PI) / 180
  return { x: C.x + len * Math.sin(r), y: C.y - len * Math.cos(r) }
}

/** Smaller angle (0..180) between two clock angles. */
function angleBetween(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return Math.min(d, 360 - d)
}

const HOURS = Array.from({ length: 12 }, (_, i) => i * 30)

export function ClockAnglesStep({ step, setChecker, locked }: InteractiveStepProps<ClockStep>) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [cA, setCA] = useState(0)
  const [cB, setCB] = useState(60)
  const [activeHand, setActiveHand] = useState<'A' | 'B' | null>(null)
  const [doneCount, setDoneCount] = useState(0)

  const targets = step.targets
  const n = targets.length
  const allDone = doneCount >= n
  const currentTarget = targets[Math.min(doneCount, n - 1)]
  const between = angleBetween(cA, cB)

  useEffect(() => {
    setChecker(() => allDone)
  }, [allDone, setChecker])

  // All state writes happen here, inside the pointer drag handler (never during
  // render), so the react-compiler lint rules are satisfied.
  const update = (clientX: number, clientY: number, hand: 'A' | 'B') => {
    const svg = svgRef.current
    if (!svg) return
    const p = clientToViewBox(svg, clientX, clientY, VB, VB)
    const mathDeg = (Math.atan2(C.y - p.y, p.x - C.x) * 180) / Math.PI
    const clock = (((90 - mathDeg) % 360) + 360) % 360
    const snapped = (Math.round(clock / 30) * 30) % 360

    const nextA = hand === 'A' ? snapped : cA
    const nextB = hand === 'B' ? snapped : cB
    if (hand === 'A') setCA(snapped)
    else setCB(snapped)

    // Snapping guarantees `nextBetween` is an exact multiple of 30, so an
    // equality test against the target is reliable. Use a functional update so
    // rapid pointermove events cannot double-count a single target.
    const nextBetween = angleBetween(nextA, nextB)
    setDoneCount((done) => (done < n && nextBetween === targets[done] ? done + 1 : done))
  }

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (locked) return
    const svg = svgRef.current
    if (!svg) return
    const p = clientToViewBox(svg, e.clientX, e.clientY, VB, VB)
    const hand: 'A' | 'B' = dist(p, tip(cA)) <= dist(p, tip(cB)) ? 'A' : 'B'
    setActiveHand(hand)
    e.currentTarget.setPointerCapture(e.pointerId)
    update(e.clientX, e.clientY, hand)
  }
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!activeHand || locked) return
    update(e.clientX, e.clientY, activeHand)
  }
  const onUp = () => {
    setActiveHand(null)
  }

  const tipA = tip(cA)
  const tipB = tip(cB)
  const arcStart = tip(cA, AR)
  const arcEnd = tip(cB, AR)
  // Clockwise screen gap from A to B; pick the sweep flag that draws the minor
  // (i.e. `between`) arc. large-arc-flag stays 0 because between <= 180.
  const cwGap = (((cB - cA) % 360) + 360) % 360
  const sweep = cwGap <= 180 ? 1 : 0
  const arcD = `M ${arcStart.x} ${arcStart.y} A ${AR} ${AR} 0 0 ${sweep} ${arcEnd.x} ${arcEnd.y}`

  return (
    <div className="interactive">
      <div className="readout">
        {allDone ? (
          <>
            <span className="readout-value">✓</span>
            <span className="readout-label">all angles built!</span>
          </>
        ) : (
          <>
            <span className="readout-value">{currentTarget}°</span>
            <span className="readout-label">
              make this angle · {Math.min(doneCount + 1, n)} of {n}
            </span>
          </>
        )}
      </div>

      <div className="sort-help">
        Now: {between}°
        <span style={{ display: 'inline-flex', gap: 4, marginLeft: 10, verticalAlign: 'middle' }}>
          {targets.map((_, i) => (
            <span
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                display: 'inline-block',
                background: i < doneCount ? 'var(--good)' : 'var(--border)',
              }}
            />
          ))}
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB} ${VB}`}
        className="interactive-svg"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        aria-label="Interactive clock. Drag the two hands to build the target angle between them."
        style={{ touchAction: 'none', cursor: locked ? 'default' : 'grab' }}
      >
        <circle cx={C.x} cy={C.y} r={R} fill="var(--card)" stroke="var(--fig-stroke)" strokeWidth={3} />
        {HOURS.map((c) => {
          const major = c % 90 === 0
          const inner = tip(c, major ? 80 : 84)
          const outer = tip(c, R)
          return (
            <line
              key={c}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--fig-stroke)"
              strokeWidth={major ? 3 : 1.5}
              strokeLinecap="round"
            />
          )
        })}
        <path d={arcD} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
        <line x1={C.x} y1={C.y} x2={tipB.x} y2={tipB.y} stroke="var(--fig-stroke)" strokeWidth={4} strokeLinecap="round" />
        <circle cx={tipB.x} cy={tipB.y} r={8} fill="var(--fig-stroke)" />
        <line x1={C.x} y1={C.y} x2={tipA.x} y2={tipA.y} stroke="var(--accent)" strokeWidth={4} strokeLinecap="round" />
        <circle cx={tipA.x} cy={tipA.y} r={9} fill="var(--accent)" />
        <circle cx={C.x} cy={C.y} r={5} fill="var(--fig-stroke)" />
      </svg>

      {allDone && <div className="sort-help">Great — you built every angle!</div>}
    </div>
  )
}
