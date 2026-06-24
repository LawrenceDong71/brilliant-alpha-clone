import { useEffect, useRef, useState } from 'react'
import type { DragPointStep as DPStep, Point } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox, dist } from '../figures/geometry'

const VB = 264
const PAD = 26

export function DragPointStep({ step, setChecker, locked }: InteractiveStepProps<DPStep>) {
  const { min, max } = step.grid
  const span = max - min
  const unit = (VB - 2 * PAD) / span
  const gx = (x: number) => PAD + (x - min) * unit
  const gy = (y: number) => VB - PAD - (y - min) * unit

  const svgRef = useRef<SVGSVGElement | null>(null)
  const [pos, setPos] = useState<Record<string, Point>>(() =>
    Object.fromEntries(step.points.map((p) => [p.id, p.start])),
  )
  const dragId = useRef<string | null>(null)

  useEffect(() => {
    setChecker(() =>
      step.points.every((p) => dist(pos[p.id], p.target) <= step.tolerance),
    )
  }, [pos, step.points, step.tolerance, setChecker])

  const toContent = (cx: number, cy: number): Point => {
    const p = clientToViewBox(svgRef.current!, cx, cy, VB, VB)
    const x = Math.round((p.x - PAD) / unit + min)
    const y = Math.round((VB - PAD - p.y) / unit + min)
    return { x: Math.max(min, Math.min(max, x)), y: Math.max(min, Math.min(max, y)) }
  }

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (locked) return
    const p = clientToViewBox(svgRef.current!, e.clientX, e.clientY, VB, VB)
    let best: string | null = null
    let bestD = 28
    for (const pt of step.points) {
      const d = Math.hypot(gx(pos[pt.id].x) - p.x, gy(pos[pt.id].y) - p.y)
      if (d < bestD) {
        bestD = d
        best = pt.id
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
    setPos((prev) => ({ ...prev, [dragId.current as string]: c }))
  }
  const onUp = () => {
    dragId.current = null
  }

  const lines = []
  for (let i = min; i <= max; i++) {
    lines.push(
      <line key={`v${i}`} x1={gx(i)} y1={gy(min)} x2={gx(i)} y2={gy(max)} stroke="var(--grid)" strokeWidth={1} />,
      <line key={`h${i}`} x1={gx(min)} y1={gy(i)} x2={gx(max)} y2={gy(i)} stroke="var(--grid)" strokeWidth={1} />,
    )
  }
  const axes = min <= 0 && max >= 0
  const first = step.points[0]

  return (
    <div className="interactive">
      <div className="readout small">
        <span>{first.label} = ({pos[first.id].x}, {pos[first.id].y})</span>
        <span className="readout-label">drag the highlighted point</span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB} ${VB}`}
        className="interactive-svg"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        style={{ touchAction: 'none' }}
      >
        {lines}
        {axes && (
          <>
            <line x1={gx(0)} y1={gy(min)} x2={gx(0)} y2={gy(max)} stroke="var(--fig-stroke)" strokeWidth={1.5} />
            <line x1={gx(min)} y1={gy(0)} x2={gx(max)} y2={gy(0)} stroke="var(--fig-stroke)" strokeWidth={1.5} />
          </>
        )}
        {step.mirrorLine &&
          (step.mirrorLine.axis === 'y' ? (
            <line x1={gx(step.mirrorLine.at)} y1={gy(min)} x2={gx(step.mirrorLine.at)} y2={gy(max)} stroke="var(--accent)" strokeWidth={2} strokeDasharray="6 5" />
          ) : (
            <line x1={gx(min)} y1={gy(step.mirrorLine.at)} x2={gx(max)} y2={gy(step.mirrorLine.at)} stroke="var(--accent)" strokeWidth={2} strokeDasharray="6 5" />
          ))}

        {step.connect === 'fixedToDrag' && step.fixedPoints?.[0] && (
          <line
            x1={gx(step.fixedPoints[0].at.x)}
            y1={gy(step.fixedPoints[0].at.y)}
            x2={gx(pos[first.id].x)}
            y2={gy(pos[first.id].y)}
            stroke="var(--accent)"
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}

        {step.fixedPoints?.map((fp) => (
          <g key={fp.id}>
            <circle cx={gx(fp.at.x)} cy={gy(fp.at.y)} r={6} fill="var(--fig-stroke)" />
            <text x={gx(fp.at.x) + 9} y={gy(fp.at.y) - 8} fontSize={13} fill="var(--text-h)">{fp.label}</text>
          </g>
        ))}

        {step.points.map((pt) => (
          <g key={pt.id}>
            <circle cx={gx(pos[pt.id].x)} cy={gy(pos[pt.id].y)} r={10} fill="var(--accent)" style={{ cursor: locked ? 'default' : 'grab' }} />
            <text x={gx(pos[pt.id].x) + 11} y={gy(pos[pt.id].y) - 9} fontSize={13} fill="var(--accent)">{pt.label}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}
