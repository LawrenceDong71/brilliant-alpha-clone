import { useEffect, useMemo, useState } from 'react'
import type { CornerTearStep as TearStep, Point } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { angleAtDeg } from '../figures/geometry'

const VB_W = 280
const VB_H = 300

// triangle region
const gx = (x: number) => 30 + x * 22
const gy = (y: number) => 170 - y * 15

// baseline assembly
const O = { x: 140, y: 252 }
const R = 80

type VKey = 'A' | 'B' | 'C'
const COLORS: Record<VKey, string> = { A: '#e9696b', B: '#5b8def', C: '#37b893' }

const polar = (deg: number, r: number): Point => {
  const rad = (deg * Math.PI) / 180
  return { x: O.x + r * Math.cos(rad), y: O.y - r * Math.sin(rad) }
}
/** Minor sector (interior < 180°) from O between two angles. */
const sector = (a1: number, a2: number, r: number) => {
  const p1 = polar(a1, r)
  const p2 = polar(a2, r)
  return `M ${O.x} ${O.y} L ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y} Z`
}

export function CornerTearStep({ step, setChecker, locked }: InteractiveStepProps<TearStep>) {
  const { A, B, C } = step.triangle
  const [placed, setPlaced] = useState<VKey[]>([])

  const angles = useMemo<Record<VKey, number>>(
    () => ({
      A: angleAtDeg(A, B, C),
      B: angleAtDeg(B, A, C),
      C: angleAtDeg(C, A, B),
    }),
    [A, B, C],
  )

  useEffect(() => {
    setChecker(() => placed.length === 3)
  }, [placed, setChecker])

  const place = (key: VKey) => {
    if (locked || placed.includes(key)) return
    setPlaced((p) => [...p, key])
  }

  const screen: Record<VKey, Point> = {
    A: { x: gx(A.x), y: gy(A.y) },
    B: { x: gx(B.x), y: gy(B.y) },
    C: { x: gx(C.x), y: gy(C.y) },
  }
  const centroid = {
    x: (screen.A.x + screen.B.x + screen.C.x) / 3,
    y: (screen.A.y + screen.B.y + screen.C.y) / 3,
  }

  // corner wedge at a vertex: minor arc between the two edge directions
  const cornerPath = (v: VKey) => {
    const others = (['A', 'B', 'C'] as VKey[]).filter((k) => k !== v)
    const p = screen[v]
    const ang = (q: Point) => (Math.atan2(p.y - q.y, q.x - p.x) * 180) / Math.PI
    const a1 = ang(screen[others[0]])
    const a2 = ang(screen[others[1]])
    const p1 = { x: p.x + 24 * Math.cos((a1 * Math.PI) / 180), y: p.y - 24 * Math.sin((a1 * Math.PI) / 180) }
    const p2 = { x: p.x + 24 * Math.cos((a2 * Math.PI) / 180), y: p.y - 24 * Math.sin((a2 * Math.PI) / 180) }
    return `M ${p.x} ${p.y} L ${p1.x} ${p1.y} A 24 24 0 0 1 ${p2.x} ${p2.y} Z`
  }

  // assembled wedges along the baseline, accumulating from the left ray (180°)
  const assembled = placed.map((key, i) => {
    const start = 180 - placed.slice(0, i).reduce((s, k) => s + angles[k], 0)
    return { key, start, end: start - angles[key] }
  })
  const total = Math.round(placed.reduce((s, k) => s + angles[k], 0))

  return (
    <div className="interactive">
      <p className="sort-help">
        {placed.length < 3 ? 'Tap each colored corner to tear it off and lay it on the table edge.' : 'Three corners, one straight line.'}
      </p>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="interactive-svg" style={{ touchAction: 'none' }}>
        <polygon
          points={`${screen.A.x},${screen.A.y} ${screen.B.x},${screen.B.y} ${screen.C.x},${screen.C.y}`}
          fill="var(--accent-bg)"
          stroke="var(--accent)"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {(['A', 'B', 'C'] as VKey[]).map((key) => {
          const taken = placed.includes(key)
          const p = screen[key]
          const dx = centroid.x - p.x
          const dy = centroid.y - p.y
          const m = Math.hypot(dx, dy) || 1
          return (
            <g key={key} onClick={() => place(key)} style={{ cursor: !taken && !locked ? 'pointer' : 'default' }}>
              <path d={cornerPath(key)} fill={COLORS[key]} opacity={taken ? 0.18 : 0.85} />
              <text x={p.x + (dx / m) * 30} y={p.y + (dy / m) * 30 + 4} fontSize={12} fill="var(--text-h)" textAnchor="middle">
                {Math.round(angles[key])}°
              </text>
              <circle cx={p.x} cy={p.y} r={18} fill="transparent" />
            </g>
          )
        })}

        {/* table edge */}
        <line x1={O.x - R - 14} y1={O.y} x2={O.x + R + 14} y2={O.y} stroke="var(--border)" strokeWidth={3} strokeLinecap="round" />
        {assembled.map(({ key, start, end }) => (
          <path key={key} d={sector(start, end, R)} fill={COLORS[key]} opacity={0.85} />
        ))}
        <circle cx={O.x} cy={O.y} r={3.5} fill="var(--text-h)" />
        <text x={O.x} y={O.y + 24} fontSize={14} fill="var(--text-h)" textAnchor="middle" fontWeight={600}>
          {total}°{placed.length === 3 ? ' = a straight line!' : ''}
        </text>
      </svg>
      <button type="button" className="btn ghost full" disabled={locked || placed.length === 0} onClick={() => setPlaced([])}>
        Start over
      </button>
    </div>
  )
}
