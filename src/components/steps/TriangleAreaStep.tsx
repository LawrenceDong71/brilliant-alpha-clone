import { useEffect, useRef, useState } from 'react'
import type { TriangleAreaStep as TriStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox } from '../figures/geometry'

const VB_W = 300
const VB_H = 240
const PAD_X = 18
const PAD_TOP = 16
const PAD_BOTTOM = 30

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export function TriangleAreaStep({ step, setChecker, locked }: InteractiveStepProps<TriStep>) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragging = useRef(false)
  const [boxW, setBoxW] = useState(1)
  const [boxH, setBoxH] = useState(1)

  const { base, height } = step
  const gridMax = step.gridMax ?? Math.max(base, height) + 2

  useEffect(() => {
    setChecker(() => boxW === base && boxH === height)
  }, [boxW, boxH, base, height, setChecker])

  // Square cell sized to fit the work area, leaving padding for axis labels.
  const cell = Math.max(8, Math.floor(Math.min(VB_W - 2 * PAD_X, VB_H - PAD_TOP - PAD_BOTTOM) / gridMax))
  const gridPx = cell * gridMax
  const originX = Math.round((VB_W - gridPx) / 2) // V.x (left edge of grid)
  const bottomY = VB_H - PAD_BOTTOM // V.y in SVG; grid is y-up so we invert below
  const topY = bottomY - gridPx

  // Grid (math, y-up) -> SVG coords.
  const gx = (col: number) => originX + col * cell
  const gy = (row: number) => bottomY - row * cell

  const toCell = (clientX: number, clientY: number) => {
    const p = clientToViewBox(svgRef.current!, clientX, clientY, VB_W, VB_H)
    setBoxW(clamp(Math.round((p.x - originX) / cell), 1, gridMax))
    setBoxH(clamp(Math.round((bottomY - p.y) / cell), 1, gridMax))
  }

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (locked) return
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    toCell(e.clientX, e.clientY)
  }
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragging.current) toCell(e.clientX, e.clientY)
  }
  const onUp = () => {
    dragging.current = false
  }

  const solved = boxW === base && boxH === height

  // Faint reference grid lines.
  const cols: number[] = []
  for (let c = 0; c <= gridMax; c++) cols.push(gx(c))
  const rows: number[] = []
  for (let r = 0; r <= gridMax; r++) rows.push(gy(r))

  // Primary right triangle: V=(0,0), (base,0), (0,height).
  const triPts = `${gx(0)},${gy(0)} ${gx(base)},${gy(0)} ${gx(0)},${gy(height)}`
  // Twin triangle (the same triangle turned 180° about the rectangle centre).
  const twinPts = `${gx(base)},${gy(height)} ${gx(0)},${gy(height)} ${gx(base)},${gy(0)}`

  // Learner's bounding box, anchored at V and spanning (0,0)->(boxW,boxH).
  const boxTopY = gy(boxH)
  const boxPxW = boxW * cell
  const boxPxH = boxH * cell
  const handleX = gx(boxW)

  const unit = step.unit ?? ' sq units'

  return (
    <div className="interactive">
      <div className="readout">
        {solved ? (
          <>
            <span className="readout-value">
              {step.target}
              {unit}
            </span>
            <span className="readout-label">
              triangle area = ½ × {base} × {height}
            </span>
          </>
        ) : (
          <>
            <span className="readout-value">
              {boxW} × {boxH}
            </span>
            <span className="readout-label">your box</span>
          </>
        )}
      </div>

      <p className="sort-help">
        Drag the corner to box the {step.context ?? 'triangle'} inside a rectangle. How much of the rectangle does it fill?
      </p>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="interactive-svg"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        style={{ touchAction: 'none', cursor: locked ? 'default' : 'grab' }}
      >
        {/* Faint unit grid so the learner can size whole cells. */}
        {cols.map((x) => (
          <line key={`c${x}`} x1={x} y1={topY} x2={x} y2={bottomY} stroke="var(--border)" strokeWidth={1} opacity={0.6} />
        ))}
        {rows.map((y) => (
          <line key={`r${y}`} x1={originX} y1={y} x2={originX + gridPx} y2={y} stroke="var(--border)" strokeWidth={1} opacity={0.6} />
        ))}

        {/* Twin triangle — fades in on success to tile the rectangle's other half. */}
        <polygon
          points={twinPts}
          fill="var(--good)"
          fillOpacity={0.22}
          stroke="var(--good)"
          strokeWidth={1.5}
          strokeLinejoin="round"
          style={{ opacity: solved ? 1 : 0, transition: 'opacity 240ms ease' }}
        />

        {/* The sail: primary right triangle, translucent accent fill. */}
        <polygon points={triPts} fill="var(--accent)" fillOpacity={0.24} stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" />

        {/* The learner's bounding rectangle: dashed until it boxes the triangle exactly. */}
        <rect
          x={originX}
          y={boxTopY}
          width={boxPxW}
          height={boxPxH}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={solved ? 3 : 2}
          strokeDasharray={solved ? undefined : '5 4'}
        />

        {/* Leg labels. */}
        <text x={gx(base / 2)} y={bottomY + 16} fontSize={11} textAnchor="middle" fill="var(--muted)">
          base
        </text>
        <text x={originX - 8} y={gy(height / 2)} fontSize={11} textAnchor="end" dominantBaseline="central" fill="var(--muted)">
          height
        </text>

        {/* Right-angle vertex marker at V. */}
        <circle cx={gx(0)} cy={gy(0)} r={4} fill="var(--fig-stroke)" />

        {/* Draggable corner handle on the box's far corner. */}
        <circle
          cx={handleX}
          cy={boxTopY}
          r={8}
          fill="var(--accent)"
          stroke="var(--card)"
          strokeWidth={2}
          style={{ cursor: locked ? 'default' : 'grab' }}
        />
        <path
          d={`M${handleX - 3} ${boxTopY} H${handleX + 3} M${handleX} ${boxTopY - 3} V${boxTopY + 3}`}
          stroke="var(--card)"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </svg>

      {solved && (
        <p className="sort-help" style={{ color: 'var(--good)', fontWeight: 600 }}>
          Two identical triangles fill the rectangle — so the triangle is exactly half: ½ × {base} × {height} = {step.target}.
        </p>
      )}
    </div>
  )
}
