import { useEffect, useMemo, useRef, useState } from 'react'
import type { DragTriangleStep as TriStep, Point } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { angleAtDeg, clientToViewBox } from '../figures/geometry'

const VB_W = 280
const VB_H = 250
const PAD = 34
const UX = (VB_W - 2 * PAD) / 10
const UY = (VB_H - 2 * PAD) / 10

const gx = (x: number) => PAD + x * UX
const gy = (y: number) => VB_H - PAD - y * UY

type VKey = 'A' | 'B' | 'C'

export function DragTriangleStep({ step, setChecker, locked }: InteractiveStepProps<TriStep>) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [pts, setPts] = useState<Record<VKey, Point>>(step.initial)
  const dragId = useRef<VKey | null>(null)

  const angles = useMemo<Record<VKey, number>>(
    () => ({
      A: angleAtDeg(pts.A, pts.B, pts.C),
      B: angleAtDeg(pts.B, pts.A, pts.C),
      C: angleAtDeg(pts.C, pts.A, pts.B),
    }),
    [pts],
  )

  useEffect(() => {
    setChecker(
      () => Math.abs(angles[step.targetVertex] - step.targetAngle) <= step.toleranceDegrees,
    )
  }, [angles, step.targetVertex, step.targetAngle, step.toleranceDegrees, setChecker])

  const toContent = (clientX: number, clientY: number): Point => {
    const p = clientToViewBox(svgRef.current!, clientX, clientY, VB_W, VB_H)
    return {
      x: Math.max(0.5, Math.min(9.5, (p.x - PAD) / UX)),
      y: Math.max(0.5, Math.min(9.5, (VB_H - PAD - p.y) / UY)),
    }
  }

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (locked) return
    const p = clientToViewBox(svgRef.current!, e.clientX, e.clientY, VB_W, VB_H)
    let best: VKey | null = null
    let bestDist = 30
    for (const key of step.draggable) {
      const d = Math.hypot(gx(pts[key].x) - p.x, gy(pts[key].y) - p.y)
      if (d < bestDist) {
        bestDist = d
        best = key
      }
    }
    if (best) {
      dragId.current = best
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragId.current) return
    const c = toContent(e.clientX, e.clientY)
    setPts((prev) => ({ ...prev, [dragId.current as VKey]: c }))
  }
  const onUp = () => {
    dragId.current = null
  }

  const labelPos = (key: VKey): Point => {
    const c = { x: (pts.A.x + pts.B.x + pts.C.x) / 3, y: (pts.A.y + pts.B.y + pts.C.y) / 3 }
    const p = pts[key]
    const dx = c.x - p.x
    const dy = c.y - p.y
    const m = Math.hypot(dx, dy) || 1
    return { x: gx(p.x) + (dx / m) * 26, y: gy(p.y) - (dy / m) * 26 }
  }

  return (
    <div className="interactive">
      <div className="readout small">
        <span>∠A {Math.round(angles.A)}° · ∠B {Math.round(angles.B)}° · ∠C {Math.round(angles.C)}°</span>
        <span className="readout-label">sum = {Math.round(angles.A + angles.B + angles.C)}°</span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="interactive-svg"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        style={{ touchAction: 'none' }}
      >
        <polygon
          points={`${gx(pts.A.x)},${gy(pts.A.y)} ${gx(pts.B.x)},${gy(pts.B.y)} ${gx(pts.C.x)},${gy(pts.C.y)}`}
          fill="var(--accent-bg)"
          stroke="var(--accent)"
          strokeWidth={3}
          strokeLinejoin="round"
        />
        {(['A', 'B', 'C'] as VKey[]).map((key) => {
          const lp = labelPos(key)
          const isDrag = step.draggable.includes(key)
          return (
            <g key={key}>
              <text x={lp.x - 6} y={lp.y + 4} fontSize={13} fill="var(--text-h)">
                {key}:{Math.round(angles[key])}°
              </text>
              <circle
                cx={gx(pts[key].x)}
                cy={gy(pts[key].y)}
                r={isDrag ? 10 : 5}
                fill={isDrag ? 'var(--accent)' : 'var(--fig-stroke)'}
                style={{ cursor: isDrag && !locked ? 'grab' : 'default' }}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
