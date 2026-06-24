import { useEffect, useMemo, useRef, useState } from 'react'
import type { Point, SlideShapeStep as Step } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox } from '../figures/geometry'

const VB = 264
const PAD = 26

const centroid = (pts: Point[]): Point => ({
  x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
  y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
})

const pointInPoly = (x: number, y: number, pts: Point[]) => {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x
    const yi = pts[i].y
    const xj = pts[j].x
    const yj = pts[j].y
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export function SlideShapeStep({ step, setChecker, locked }: InteractiveStepProps<Step>) {
  const { min, max } = step.grid
  const span = max - min
  const unit = (VB - 2 * PAD) / span
  const gx = (x: number) => PAD + (x - min) * unit
  const gy = (y: number) => VB - PAD - (y - min) * unit

  const svgRef = useRef<SVGSVGElement | null>(null)
  const [off, setOff] = useState({ dx: 0, dy: 0 })
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)

  const bounds = useMemo(() => {
    const xs = step.shape.map((p) => p.x)
    const ys = step.shape.map((p) => p.y)
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
  }, [step.shape])

  useEffect(() => {
    setChecker(
      () =>
        Math.abs(off.dx - step.vector.x) <= step.tolerance &&
        Math.abs(off.dy - step.vector.y) <= step.tolerance,
    )
  }, [off, step.vector, step.tolerance, setChecker])

  const toContent = (cx: number, cy: number): Point => {
    const p = clientToViewBox(svgRef.current!, cx, cy, VB, VB)
    return { x: (p.x - PAD) / unit + min, y: (VB - PAD - p.y) / unit + min }
  }

  const cur = step.shape.map((p) => ({ x: p.x + off.dx, y: p.y + off.dy }))
  const baseCen = centroid(step.shape)
  const curCen = { x: baseCen.x + off.dx, y: baseCen.y + off.dy }
  const target = step.shape.map((p) => ({ x: p.x + step.vector.x, y: p.y + step.vector.y }))

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (locked) return
    const c = toContent(e.clientX, e.clientY)
    const nearHandle = Math.hypot(c.x - curCen.x, c.y - curCen.y) <= 1.4
    if (pointInPoly(c.x, c.y, cur) || nearHandle) {
      drag.current = { sx: c.x, sy: c.y, ox: off.dx, oy: off.dy }
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return
    const c = toContent(e.clientX, e.clientY)
    let ndx = Math.round(drag.current.ox + (c.x - drag.current.sx))
    let ndy = Math.round(drag.current.oy + (c.y - drag.current.sy))
    ndx = Math.max(min - bounds.minX, Math.min(max - bounds.maxX, ndx))
    ndy = Math.max(min - bounds.minY, Math.min(max - bounds.maxY, ndy))
    setOff({ dx: ndx, dy: ndy })
  }
  const onUp = () => {
    drag.current = null
  }

  const poly = (pts: Point[]) => pts.map((p) => `${gx(p.x)},${gy(p.y)}`).join(' ')

  const lines = []
  for (let i = min; i <= max; i++) {
    lines.push(
      <line key={`v${i}`} x1={gx(i)} y1={gy(min)} x2={gx(i)} y2={gy(max)} stroke="var(--grid)" strokeWidth={1} />,
      <line key={`h${i}`} x1={gx(min)} y1={gy(i)} x2={gx(max)} y2={gy(i)} stroke="var(--grid)" strokeWidth={1} />,
    )
  }
  const axes = min <= 0 && max >= 0

  const ax = gx(baseCen.x)
  const ay = gy(baseCen.y)
  const bx = gx(curCen.x)
  const by = gy(curCen.y)
  const ang = Math.atan2(by - ay, bx - ax)
  const ah = 8
  const moved = off.dx !== 0 || off.dy !== 0

  return (
    <div className="interactive">
      <div className="readout small">
        <span>vector = ({off.dx >= 0 ? '+' : ''}{off.dx}, {off.dy >= 0 ? '+' : ''}{off.dy})</span>
        <span className="readout-label">drag the {step.shapeLabel ?? 'shape'} onto the dashed outline</span>
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

        {/* start ghost */}
        <polygon points={poly(step.shape)} fill="var(--fig-stroke)" opacity={0.1} stroke="var(--fig-stroke)" strokeWidth={1.5} strokeOpacity={0.3} strokeDasharray="2 4" />

        {/* dashed target outline */}
        <polygon points={poly(target)} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="7 5" strokeLinejoin="round" />

        {/* live translation vector arrow */}
        {moved && (
          <g>
            <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#7c5cff" strokeWidth={2.5} strokeLinecap="round" />
            <path
              d={`M ${bx} ${by} L ${bx - ah * Math.cos(ang - 0.4)} ${by - ah * Math.sin(ang - 0.4)} L ${bx - ah * Math.cos(ang + 0.4)} ${by - ah * Math.sin(ang + 0.4)} Z`}
              fill="#7c5cff"
            />
          </g>
        )}

        {/* live shape */}
        <polygon
          points={poly(cur)}
          fill="#b49cff"
          fillOpacity={0.55}
          stroke="#7c5cff"
          strokeWidth={2.5}
          strokeLinejoin="round"
          style={{ cursor: locked ? 'default' : 'grab' }}
        />
        <circle cx={bx} cy={by} r={4} fill="#7c5cff" />
      </svg>
      <button type="button" className="btn ghost full" disabled={locked || !moved} onClick={() => setOff({ dx: 0, dy: 0 })}>
        Start over
      </button>
    </div>
  )
}
