import { useEffect, useRef, useState } from 'react'
import type { AngleFillStep as FillStep, Point } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox } from '../figures/geometry'

const VB_W = 300
const VB_H = 195
const O = { x: 150, y: 162 }
const R = 120

const COLOR_A = '#e9696b'
const COLOR_B = '#5b8def'
const COLOR_C = '#37b893'

/** Polar point with the baseline running right (0°) to left (180°), upper half. */
const polar = (deg: number, r: number): Point => {
  const rad = (deg * Math.PI) / 180
  return { x: O.x + r * Math.cos(rad), y: O.y - r * Math.sin(rad) }
}

/** Sector from O spanning [a1, a2] (each span < 180°). */
const sector = (a1: number, a2: number, r: number) => {
  const p1 = polar(a1, r)
  const p2 = polar(a2, r)
  return `M ${O.x} ${O.y} L ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y} Z`
}

const wedgeLabel = (mid: number, r: number) => polar(mid, r)

export function AngleFillStep({ step, setChecker, locked }: InteractiveStepProps<FillStep>) {
  const [a1, a2] = step.given
  const base = a1 + a2
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragging = useRef(false)
  const [fillTo, setFillTo] = useState(Math.min(178, base + 20))

  const third = Math.max(0, Math.round(fillTo - base))

  useEffect(() => {
    setChecker(() => Math.abs(fillTo - 180) <= step.tolerance)
  }, [fillTo, step.tolerance, setChecker])

  const update = (clientX: number, clientY: number) => {
    if (!svgRef.current) return
    const p = clientToViewBox(svgRef.current, clientX, clientY, VB_W, VB_H)
    let a = (Math.atan2(O.y - p.y, p.x - O.x) * 180) / Math.PI
    a = Math.max(base + 1, Math.min(180, a))
    setFillTo(Math.round(a))
  }
  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (locked) return
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

  const closed = Math.abs(fillTo - 180) <= step.tolerance
  const handle = polar(fillTo, R)
  const lA = wedgeLabel(a1 / 2, R * 0.62)
  const lB = wedgeLabel(a1 + a2 / 2, R * 0.62)
  const lC = wedgeLabel(base + third / 2, R * 0.62)

  return (
    <div className="interactive">
      <div className="readout">
        <span className="readout-value">{third}°</span>
        <span className="readout-label">
          third corner · total {Math.round(fillTo)}° / 180°
        </span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="interactive-svg"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        style={{ touchAction: 'none', cursor: locked ? 'default' : 'grab' }}
      >
        {/* straight-line goal */}
        <line x1={O.x - R - 12} y1={O.y} x2={O.x + R + 12} y2={O.y} stroke="var(--border)" strokeWidth={3} strokeLinecap="round" />
        {/* remaining gap to fill */}
        {!closed && <path d={sector(fillTo, 180, R)} fill="var(--accent)" opacity={0.07} />}
        <path d={`M ${polar(fillTo, R).x} ${polar(fillTo, R).y} A ${R} ${R} 0 0 1 ${polar(180, R).x} ${polar(180, R).y}`} fill="none" stroke="var(--border)" strokeWidth={1.5} strokeDasharray="5 5" />

        {/* fixed given wedges */}
        <path d={sector(0, a1, R)} fill={COLOR_A} opacity={0.85} />
        <path d={sector(a1, base, R)} fill={COLOR_B} opacity={0.85} />
        {/* draggable third wedge */}
        <path d={sector(base, fillTo, R)} fill={COLOR_C} opacity={0.85} />

        {/* labels */}
        <text x={lA.x} y={lA.y + 4} fontSize={13} fill="#fff" textAnchor="middle" fontWeight={600}>{a1}°</text>
        <text x={lB.x} y={lB.y + 4} fontSize={13} fill="#fff" textAnchor="middle" fontWeight={600}>{a2}°</text>
        {third >= 8 && <text x={lC.x} y={lC.y + 4} fontSize={13} fill="#fff" textAnchor="middle" fontWeight={600}>{third}°</text>}

        {/* draggable ray + handle */}
        <line x1={O.x} y1={O.y} x2={handle.x} y2={handle.y} stroke="var(--text-h)" strokeWidth={3} strokeLinecap="round" />
        <circle cx={handle.x} cy={handle.y} r={9} fill="var(--accent)" stroke="#fff" strokeWidth={2} />

        <circle cx={O.x} cy={O.y} r={4} fill="var(--text-h)" />
        {step.context && (
          <text x={O.x} y={O.y + 24} fontSize={12} fill="var(--text)" textAnchor="middle">{step.context}</text>
        )}
        {closed && (
          <text x={O.x} y={26} fontSize={13} fill="var(--accent)" textAnchor="middle" fontWeight={600}>
            straight line — the three corners fill 180°!
          </text>
        )}
      </svg>
      <p className="sort-help">
        Drag the handle to grow the green corner until the three angles together make a flat, straight line.
      </p>
    </div>
  )
}
