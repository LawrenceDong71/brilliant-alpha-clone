import { useEffect, useRef, useState } from 'react'
import type { LadderStep as LStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox } from '../figures/geometry'

const VB = 300
const PADL = 42
const PADR = 24
const PADT = 22
const PADB = 40

export function LadderStep({ step, setChecker, locked }: InteractiveStepProps<LStep>) {
  const L = step.ladderLength
  const scale = Math.min((VB - PADL - PADR) / L, (VB - PADT - PADB) / L)
  const sx = (wx: number) => PADL + wx * scale
  const sy = (wy: number) => VB - PADB - wy * scale

  const svgRef = useRef<SVGSVGElement | null>(null)
  const [d, setD] = useState(L * 0.75)
  const dragging = useRef(false)

  const h = Math.sqrt(Math.max(0, L * L - d * d))

  useEffect(() => {
    setChecker(() => Math.abs(h - step.windowHeight) <= step.tolerance)
  }, [h, step.windowHeight, step.tolerance, setChecker])

  const update = (clientX: number, clientY: number) => {
    const p = clientToViewBox(svgRef.current!, clientX, clientY, VB, VB)
    const world = (p.x - PADL) / scale
    setD(Math.max(0.4, Math.min(L - 0.2, Math.round(world * 2) / 2)))
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

  const baseX = sx(d)
  const topY = sy(h)
  const reached = Math.abs(h - step.windowHeight) <= step.tolerance

  return (
    <div className="interactive">
      <div className="readout small">
        <span>Base distance = {d.toFixed(1)} m</span>
        <span className="readout-label">Ladder = {L} m</span>
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
        {/* building wall */}
        <rect x={sx(0) - 16} y={sy(L)} width={16} height={sy(0) - sy(L)} fill="rgba(120,130,150,0.18)" />
        <line x1={sx(0)} y1={sy(0)} x2={sx(0)} y2={sy(L)} stroke="var(--border)" strokeWidth={3} />
        {/* ground */}
        <line x1={sx(0)} y1={sy(0)} x2={sx(L)} y2={sy(0)} stroke="var(--border)" strokeWidth={3} />
        {/* window target */}
        <rect
          x={sx(0) - 14}
          y={sy(step.windowHeight) - 11}
          width={22}
          height={22}
          rx={2}
          fill={reached ? 'rgba(55,184,147,0.35)' : 'rgba(91,141,239,0.25)'}
          stroke={reached ? 'var(--good)' : '#5b8def'}
          strokeWidth={2}
        />
        <text x={sx(0) - 22} y={sy(step.windowHeight) + 4} fontSize={13} textAnchor="end" fill="var(--text-h)">🪟</text>
        {/* ladder */}
        <line x1={baseX} y1={sy(0)} x2={sx(0)} y2={topY} stroke="#b8772e" strokeWidth={5} strokeLinecap="round" />
        {/* base handle */}
        <circle cx={baseX} cy={sy(0)} r={9} fill="var(--accent)" style={{ cursor: locked ? 'default' : 'grab' }} />
      </svg>
      <p className="sort-help">Drag the base of the ladder until its top touches the window.</p>
    </div>
  )
}
