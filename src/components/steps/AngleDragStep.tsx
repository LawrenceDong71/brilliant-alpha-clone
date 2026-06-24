import { useEffect, useRef, useState } from 'react'
import type { AngleDragStep as AngleStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox } from '../figures/geometry'

const VB_W = 300
const VB_H = 190
const V = { x: 150, y: 165 }
const RAY_LEN = 135
const ARC_R = 46

export function AngleDragStep({ step, setChecker, locked }: InteractiveStepProps<AngleStep>) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [deg, setDeg] = useState(step.startDegrees)
  const dragging = useRef(false)

  useEffect(() => {
    setChecker(() => Math.abs(deg - step.targetDegrees) <= step.toleranceDegrees)
  }, [deg, step.targetDegrees, step.toleranceDegrees, setChecker])

  const update = (clientX: number, clientY: number) => {
    if (!svgRef.current) return
    const p = clientToViewBox(svgRef.current, clientX, clientY, VB_W, VB_H)
    let a = (Math.atan2(V.y - p.y, p.x - V.x) * 180) / Math.PI
    a = Math.max(0, Math.min(180, a))
    setDeg(Math.round(a))
  }

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (locked) return
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    update(e.clientX, e.clientY)
  }
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return
    update(e.clientX, e.clientY)
  }
  const onUp = () => {
    dragging.current = false
  }

  const rad = (deg * Math.PI) / 180
  const fixedEnd = { x: V.x + RAY_LEN, y: V.y }
  const movEnd = { x: V.x + RAY_LEN * Math.cos(rad), y: V.y - RAY_LEN * Math.sin(rad) }
  const arcEnd = { x: V.x + ARC_R * Math.cos(rad), y: V.y - ARC_R * Math.sin(rad) }

  return (
    <div className="interactive">
      <div className="readout">
        <span className="readout-value">{deg}°</span>
        <span className="readout-label">drag the blue ray</span>
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
        <line x1={V.x} y1={V.y} x2={fixedEnd.x} y2={fixedEnd.y} stroke="var(--fig-stroke)" strokeWidth={3} strokeLinecap="round" />
        <path d={`M ${V.x + ARC_R} ${V.y} A ${ARC_R} ${ARC_R} 0 0 0 ${arcEnd.x} ${arcEnd.y}`} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
        <line x1={V.x} y1={V.y} x2={movEnd.x} y2={movEnd.y} stroke="var(--accent)" strokeWidth={4} strokeLinecap="round" />
        <circle cx={movEnd.x} cy={movEnd.y} r={9} fill="var(--accent)" />
        <circle cx={V.x} cy={V.y} r={5} fill="var(--fig-stroke)" />
      </svg>
    </div>
  )
}
