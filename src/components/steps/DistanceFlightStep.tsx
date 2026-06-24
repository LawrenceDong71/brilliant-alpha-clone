import { useEffect, useRef, useState } from 'react'
import type { DistanceFlightStep as DFStep, Point } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox, dist } from '../figures/geometry'

const VB = 264
const PAD = 26
const HIT = 28

function formatDistance(d: number): string {
  return Math.abs(d - Math.round(d)) < 1e-9 ? String(Math.round(d)) : d.toFixed(1)
}

export function DistanceFlightStep({ step, setChecker, locked }: InteractiveStepProps<DFStep>) {
  const { min, max } = step.grid
  const span = max - min
  const unit = (VB - 2 * PAD) / span
  const gx = (x: number) => PAD + (x - min) * unit
  const gy = (y: number) => VB - PAD - (y - min) * unit

  const svgRef = useRef<SVGSVGElement | null>(null)
  const [crow, setCrow] = useState<Point>(step.origin)
  const dragging = useRef(false)

  const { origin, target } = step
  const legH = Math.abs(crow.x - origin.x)
  const legV = Math.abs(crow.y - origin.y)
  const diagonal = dist(origin, crow)
  const landed = dist(crow, target) <= step.tolerance
  const revealDistance = landed || locked
  const unitSuffix = step.unit ?? ''

  useEffect(() => {
    setChecker(() => dist(crow, target) <= step.tolerance)
  }, [crow, target, step.tolerance, setChecker])

  const toContent = (cx: number, cy: number): Point | null => {
    if (!svgRef.current) return null
    const p = clientToViewBox(svgRef.current, cx, cy, VB, VB)
    const x = Math.round((p.x - PAD) / unit + min)
    const y = Math.round((VB - PAD - p.y) / unit + min)
    return { x: Math.max(min, Math.min(max, x)), y: Math.max(min, Math.min(max, y)) }
  }

  const update = (clientX: number, clientY: number) => {
    const next = toContent(clientX, clientY)
    if (next) setCrow(next)
  }

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (locked || !svgRef.current) return
    const p = clientToViewBox(svgRef.current, e.clientX, e.clientY, VB, VB)
    const dCrow = Math.hypot(gx(crow.x) - p.x, gy(crow.y) - p.y)
    if (dCrow > HIT) return
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

  const gridLines: React.ReactNode[] = []
  for (let i = min; i <= max; i++) {
    gridLines.push(
      <line key={`v${i}`} x1={gx(i)} y1={gy(min)} x2={gx(i)} y2={gy(max)} stroke="var(--grid)" strokeWidth={1} />,
      <line key={`h${i}`} x1={gx(min)} y1={gy(i)} x2={gx(max)} y2={gy(i)} stroke="var(--grid)" strokeWidth={1} />,
    )
  }

  // light "city blocks" between the streets for a map feel
  const blocks: React.ReactNode[] = []
  for (let i = min; i < max; i++) {
    for (let j = min; j < max; j++) {
      blocks.push(
        <rect key={`b${i}-${j}`} x={gx(i) + 2} y={gy(j + 1) + 2} width={unit - 4} height={unit - 4} rx={1.5} fill="rgba(120,130,150,0.06)" />,
      )
    }
  }

  // block-number labels along the two axes so the learner can count
  const axisLabels: React.ReactNode[] = []
  for (let i = min; i <= max; i += 3) {
    axisLabels.push(
      <text key={`bx${i}`} x={gx(i)} y={gy(min) + 16} fontSize={10} textAnchor="middle" fill="var(--muted)">{i}</text>,
      <text key={`ly${i}`} x={gx(min) - 12} y={gy(i) + 3} fontSize={10} textAnchor="middle" fill="var(--muted)">{i}</text>,
    )
  }

  const originPx = { x: gx(origin.x), y: gy(origin.y) }
  const crowPx = { x: gx(crow.x), y: gy(crow.y) }
  const targetPx = { x: gx(target.x), y: gy(target.y) }
  const rightPx = { x: gx(crow.x), y: gy(origin.y) }

  const tick = 5
  const rightMark = [
    `${rightPx.x},${rightPx.y}`,
    `${rightPx.x},${rightPx.y - tick}`,
    `${rightPx.x - tick},${rightPx.y - tick}`,
    `${rightPx.x - tick},${rightPx.y}`,
  ].join(' ')

  const labelMid = (a: Point, b: Point, dx: number, dy: number) => ({
    x: (gx(a.x) + gx(b.x)) / 2 + dx,
    y: (gy(a.y) + gy(b.y)) / 2 + dy,
  })
  const dMid = labelMid(origin, crow, -10, -10)

  return (
    <div className="interactive">
      <div className="readout small">
        <span className="readout-label">Straight-line flight: {revealDistance ? `${formatDistance(diagonal)}${unitSuffix}` : '?'}</span>
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
        {blocks}
        {gridLines}
        {min <= 0 && max >= 0 && (
          <>
            <line x1={gx(0)} y1={gy(min)} x2={gx(0)} y2={gy(max)} stroke="var(--fig-stroke)" strokeWidth={1.5} />
            <line x1={gx(min)} y1={gy(0)} x2={gx(max)} y2={gy(0)} stroke="var(--fig-stroke)" strokeWidth={1.5} />
          </>
        )}
        {axisLabels}

        {/* compass */}
        <g opacity={0.75}>
          <line x1={VB - 20} y1={38} x2={VB - 20} y2={22} stroke="var(--muted)" strokeWidth={1.5} strokeLinecap="round" />
          <path d={`M ${VB - 20} 17 l -4 8 l 8 0 z`} fill="var(--muted)" />
          <text x={VB - 20} y={52} fontSize={10} textAnchor="middle" fill="var(--muted)">N</text>
        </g>

        {/* live right triangle as the crow is dragged */}
        {(legH > 0 || legV > 0) && (
          <>
            <line x1={originPx.x} y1={originPx.y} x2={rightPx.x} y2={rightPx.y} stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" />
            <line x1={rightPx.x} y1={rightPx.y} x2={crowPx.x} y2={crowPx.y} stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" />
            <line x1={originPx.x} y1={originPx.y} x2={crowPx.x} y2={crowPx.y} stroke="var(--fig-stroke)" strokeWidth={3} strokeLinecap="round" />
            <polyline points={rightMark} fill="none" stroke="var(--fig-stroke)" strokeWidth={1.5} />
            <text x={dMid.x} y={dMid.y} fontSize={13} textAnchor="middle" fill="var(--accent)" fontWeight={700}>
              {revealDistance ? formatDistance(diagonal) : '?'}
            </text>
          </>
        )}

        {/* the nest is hidden until the crow actually arrives */}
        {revealDistance && (
          <>
            <circle cx={targetPx.x} cy={targetPx.y} r={13} fill="rgba(55,184,147,0.25)" stroke="var(--good)" strokeWidth={2} />
            <text x={targetPx.x} y={targetPx.y - 16} fontSize={11} textAnchor="middle" fill="var(--good)" fontWeight={700}>{step.targetLabel ?? 'Nest'}</text>
            <text x={targetPx.x} y={targetPx.y + 5} fontSize={14} textAnchor="middle" pointerEvents="none">🏠</text>
          </>
        )}

        {/* you (start) */}
        <text x={originPx.x} y={originPx.y - 9} fontSize={16} textAnchor="middle" pointerEvents="none">📍</text>
        <text x={originPx.x + 2} y={originPx.y + 17} fontSize={11} textAnchor="middle" fill="var(--text)">{step.startLabel ?? 'You'}</text>

        {/* draggable crow */}
        <circle
          cx={crowPx.x}
          cy={crowPx.y}
          r={11}
          fill="var(--accent)"
          style={{ cursor: locked ? 'default' : 'grab' }}
        />
        <text x={crowPx.x} y={crowPx.y + 4} fontSize={14} textAnchor="middle" pointerEvents="none">🐦</text>
      </svg>
      <p className="sort-help">Count the blocks and fly the crow straight to your nest. The straight-line distance stays hidden until you arrive.</p>
    </div>
  )
}
