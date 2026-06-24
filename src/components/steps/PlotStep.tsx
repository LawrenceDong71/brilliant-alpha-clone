import { useEffect, useRef, useState } from 'react'
import type { PlotStep as PlotStepType } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox } from '../figures/geometry'

const VB_W = 300
const VB_H = 96
const X0 = 24
const X1 = 276
const Y = 54

export function PlotStep({ step, setChecker, locked }: InteractiveStepProps<PlotStepType>) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const span = step.max - step.min
  const [value, setValue] = useState(step.min)
  const dragging = useRef(false)

  useEffect(() => {
    setChecker(() => Math.abs(value - step.target) <= step.tolerance)
  }, [value, step.target, step.tolerance, setChecker])

  const valToX = (v: number) => X0 + ((v - step.min) / span) * (X1 - X0)

  const update = (clientX: number, clientY: number) => {
    const p = clientToViewBox(svgRef.current!, clientX, clientY, VB_W, VB_H)
    const raw = step.min + ((p.x - X0) / (X1 - X0)) * span
    const snapped = Math.round(raw / step.step) * step.step
    setValue(Math.max(step.min, Math.min(step.max, snapped)))
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

  const tickEvery = step.step * Math.max(1, Math.round(span / step.step / 9))
  const ticks: number[] = []
  for (let v = step.min; v <= step.max + 1e-9; v += tickEvery) ticks.push(Math.round(v))

  return (
    <div className="interactive">
      <div className="readout">
        <span className="readout-value">{value}{step.unit ?? ''}</span>
        <span className="readout-label">drag the marker</span>
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
        <line x1={X0} y1={Y} x2={X1} y2={Y} stroke="var(--fig-stroke)" strokeWidth={2.5} strokeLinecap="round" />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={valToX(t)} y1={Y - 6} x2={valToX(t)} y2={Y + 6} stroke="var(--fig-stroke)" strokeWidth={1.5} />
            <text x={valToX(t)} y={Y + 24} fontSize={11} textAnchor="middle" fill="var(--text)">{t}</text>
          </g>
        ))}
        <line x1={valToX(value)} y1={Y - 18} x2={valToX(value)} y2={Y} stroke="var(--accent)" strokeWidth={3} />
        <circle cx={valToX(value)} cy={Y - 18} r={10} fill="var(--accent)" style={{ cursor: locked ? 'default' : 'grab' }} />
      </svg>
    </div>
  )
}
