import { useEffect, useRef, useState } from 'react'
import type { AreaBuildStep as ABStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox } from '../figures/geometry'

const VB_W = 320
const VB_H = 248
// Give the learner a little room past the target so they have to find the exact size.
const MAX_COLS = 8
const MAX_ROWS = 5
const CELL = 34
const GRID_W = MAX_COLS * CELL
const GRID_H = MAX_ROWS * CELL
const ORIGIN_X = Math.round((VB_W - GRID_W) / 2)
const ORIGIN_Y = 24

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export function AreaBuildStep({ step, setChecker, locked }: InteractiveStepProps<ABStep>) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragging = useRef(false)
  const [w, setW] = useState(0)
  const [h, setH] = useState(0)

  useEffect(() => {
    setChecker(() => w === step.width && h === step.height)
  }, [w, h, step.width, step.height, setChecker])

  const update = (clientX: number, clientY: number) => {
    const p = clientToViewBox(svgRef.current!, clientX, clientY, VB_W, VB_H)
    setW(clamp(Math.round((p.x - ORIGIN_X) / CELL), 0, MAX_COLS))
    setH(clamp(Math.round((p.y - ORIGIN_Y) / CELL), 0, MAX_ROWS))
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

  const unit = step.unit ?? ''
  const area = w * h
  const solved = w === step.width && h === step.height
  const rugW = w * CELL
  const rugH = h * CELL
  const handleX = ORIGIN_X + rugW
  const handleY = ORIGIN_Y + rugH

  // Reference grid lines (faint), spanning the whole work area.
  const vLines: number[] = []
  for (let c = 0; c <= MAX_COLS; c++) vLines.push(ORIGIN_X + c * CELL)
  const hLines: number[] = []
  for (let r = 0; r <= MAX_ROWS; r++) hLines.push(ORIGIN_Y + r * CELL)

  // Target outline geometry.
  const tW = step.width * CELL
  const tH = step.height * CELL

  return (
    <div className="interactive">
      <div className="readout">
        <span className="readout-value">
          {w} × {h} = {area}
          {unit}
        </span>
        <span className="readout-label">drag to roll out the rug</span>
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
        <defs>
          {/* Warm woven-rug pattern, one motif per unit square. */}
          <pattern id="ab-rug-weave" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <rect width={CELL} height={CELL} fill="#c2552f" />
            <path d={`M0 0 H${CELL} V${CELL} H0 Z`} fill="none" stroke="#9c3f20" strokeWidth={1} />
            <path
              d={`M${CELL / 2} 5 L${CELL - 6} ${CELL / 2} L${CELL / 2} ${CELL - 5} L6 ${CELL / 2} Z`}
              fill="#e8b04b"
              stroke="#f3e6cf"
              strokeWidth={1}
            />
            <circle cx={CELL / 2} cy={CELL / 2} r={3} fill="#9c3f20" />
          </pattern>
          <linearGradient id="ab-rug-sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.16} />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity={0} />
            <stop offset="1" stopColor="#000000" stopOpacity={0.12} />
          </linearGradient>
        </defs>

        {/* Faint reference grid so the learner sees available unit squares. */}
        <rect
          x={ORIGIN_X}
          y={ORIGIN_Y}
          width={GRID_W}
          height={GRID_H}
          fill="var(--accent-bg)"
          stroke="var(--border)"
          strokeWidth={1}
          rx={4}
        />
        {vLines.map((x) => (
          <line key={`v${x}`} x1={x} y1={ORIGIN_Y} x2={x} y2={ORIGIN_Y + GRID_H} stroke="var(--border)" strokeWidth={1} opacity={0.6} />
        ))}
        {hLines.map((y) => (
          <line key={`h${y}`} x1={ORIGIN_X} y1={y} x2={ORIGIN_X + GRID_W} y2={y} stroke="var(--border)" strokeWidth={1} opacity={0.6} />
        ))}

        {/* Dashed target outline — the goal size to roll the rug out to. */}
        <rect
          x={ORIGIN_X}
          y={ORIGIN_Y}
          width={tW}
          height={tH}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          opacity={0.7}
          rx={3}
        />
        <text x={ORIGIN_X + tW} y={ORIGIN_Y + tH + 14} fontSize={10} textAnchor="end" fill="var(--accent)" opacity={0.8}>
          target {step.width} × {step.height}
        </text>

        {/* The rolled-out rug, grown from the origin corner. */}
        {rugW > 0 && rugH > 0 && (
          <g>
            <rect x={ORIGIN_X} y={ORIGIN_Y} width={rugW} height={rugH} fill="url(#ab-rug-weave)" rx={3} />
            {/* Cream inner border to read as a real rug. */}
            <rect
              x={ORIGIN_X + 3}
              y={ORIGIN_Y + 3}
              width={rugW - 6}
              height={rugH - 6}
              fill="none"
              stroke="#f3e6cf"
              strokeWidth={2}
              rx={2}
            />
            <rect x={ORIGIN_X} y={ORIGIN_Y} width={rugW} height={rugH} fill="url(#ab-rug-sheen)" rx={3} />
            {/* Crisp outer edge, brighter when the size is exactly right. */}
            <rect
              x={ORIGIN_X}
              y={ORIGIN_Y}
              width={rugW}
              height={rugH}
              fill="none"
              stroke={solved ? 'var(--accent)' : '#7a2f16'}
              strokeWidth={solved ? 3 : 2}
              rx={3}
            />
          </g>
        )}

        {/* Live width / height brackets so the formula maps onto the figure. */}
        {rugW > 0 && (
          <text x={ORIGIN_X + rugW / 2} y={ORIGIN_Y - 8} fontSize={12} fontWeight={700} textAnchor="middle" fill="var(--text-h)">
            {w}
          </text>
        )}
        {rugH > 0 && (
          <text
            x={ORIGIN_X - 9}
            y={ORIGIN_Y + rugH / 2}
            fontSize={12}
            fontWeight={700}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--text-h)"
          >
            {h}
          </text>
        )}

        {/* Drag handle on the rug's far corner. */}
        <circle
          cx={handleX}
          cy={handleY}
          r={9}
          fill="var(--accent)"
          stroke="#fff"
          strokeWidth={2}
          style={{ cursor: locked ? 'default' : 'grab' }}
        />
        <path
          d={`M${handleX - 3} ${handleY} H${handleX + 3} M${handleX} ${handleY - 3} V${handleY + 3}`}
          stroke="#fff"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </svg>
      <button
        type="button"
        className="btn ghost full"
        onClick={() => {
          setW(0)
          setH(0)
        }}
        disabled={locked || (w === 0 && h === 0)}
      >
        Roll back up
      </button>
    </div>
  )
}
