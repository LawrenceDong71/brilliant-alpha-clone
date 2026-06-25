import { useEffect, useRef, useState } from 'react'
import type { ClipSegmentStep as CSStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox } from '../figures/geometry'

const VB_W = 320
const VB_H = 180
const X0 = 30
const X1 = 290
const Y = 100
const SNAP = 0.5

type Handle = 'left' | 'right'

export function ClipSegmentStep({ step, setChecker, locked }: InteractiveStepProps<CSStep>) {
  const { min, max, startTarget, endTarget, tolerance } = step
  const span = max - min
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragging = useRef<Handle | null>(null)

  // Start the stops away from the targets so the learner must clip inward.
  const [left, setLeft] = useState(min + 1)
  const [right, setRight] = useState(max - 1)

  const ok =
    Math.abs(left - startTarget) <= tolerance &&
    Math.abs(right - endTarget) <= tolerance &&
    left < right

  useEffect(() => {
    setChecker(() => ok)
  }, [ok, setChecker])

  const valToX = (v: number) => X0 + ((v - min) / span) * (X1 - X0)
  const xToVal = (x: number) => min + ((x - X0) / (X1 - X0)) * span
  const snap = (v: number) => Math.round(v / SNAP) * SNAP
  const clamp = (v: number) => Math.max(min, Math.min(max, v))

  const moveHandle = (clientX: number, clientY: number) => {
    const which = dragging.current
    if (!which) return
    const p = clientToViewBox(svgRef.current!, clientX, clientY, VB_W, VB_H)
    const v = snap(clamp(xToVal(p.x)))
    if (which === 'left') setLeft(Math.min(v, right - SNAP))
    else setRight(Math.max(v, left + SNAP))
  }

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (locked) return
    const p = clientToViewBox(svgRef.current!, e.clientX, e.clientY, VB_W, VB_H)
    const v = xToVal(p.x)
    dragging.current = Math.abs(v - left) <= Math.abs(v - right) ? 'left' : 'right'
    e.currentTarget.setPointerCapture(e.pointerId)
    moveHandle(e.clientX, e.clientY)
  }
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragging.current) moveHandle(e.clientX, e.clientY)
  }
  const onUp = () => {
    dragging.current = null
  }

  const lx = valToX(left)
  const rx = valToX(right)
  const segColor = ok ? '#37b893' : 'var(--accent)'

  return (
    <div className="interactive">
      <p className="sort-help">
        {step.instruction ?? 'Drag the two stops so the lit part covers only the pencil.'}
      </p>

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
          <linearGradient id="cs-pencil-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd64a" />
            <stop offset="0.5" stopColor="#f7c531" />
            <stop offset="1" stopColor="#e0a91f" />
          </linearGradient>
          <marker id="cs-arrow" markerWidth="10" markerHeight="10" refX="7" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill="var(--fig-stroke)" />
          </marker>
        </defs>

        {/* The infinite line: faint, with arrowheads on both far ends */}
        <line
          x1={X0}
          y1={Y}
          x2={X1}
          y2={Y}
          stroke="var(--fig-stroke)"
          strokeOpacity={0.4}
          strokeWidth={2}
          strokeDasharray="2 6"
          markerStart="url(#cs-arrow)"
          markerEnd="url(#cs-arrow)"
        />
        <text x={X0 - 4} y={Y - 12} fontSize={10} fill="var(--muted)" textAnchor="start">
          …forever
        </text>
        <text x={X1 + 4} y={Y - 12} fontSize={10} fill="var(--muted)" textAnchor="end">
          forever…
        </text>

        {/* The pencil lying along the line, marking the two true ends */}
        <Pencil x1={valToX(startTarget)} x2={valToX(endTarget)} y={Y} />

        {/* The clipped portion between the two stops = the segment */}
        <line x1={lx} y1={Y} x2={rx} y2={Y} stroke={segColor} strokeWidth={5} strokeLinecap="round" />

        {/* Draggable endpoint stops */}
        {(['left', 'right'] as Handle[]).map((h) => {
          const x = h === 'left' ? lx : rx
          return (
            <g key={h} style={{ cursor: locked ? 'default' : 'ew-resize' }}>
              <line x1={x} y1={Y - 24} x2={x} y2={Y + 24} stroke={segColor} strokeWidth={3} strokeLinecap="round" />
              <circle cx={x} cy={Y} r={9} fill="#fff" stroke={segColor} strokeWidth={3} />
              <circle cx={x} cy={Y} r={3.5} fill={segColor} />
            </g>
          )
        })}

        {/* Length readout above the segment */}
        <text
          x={(lx + rx) / 2}
          y={Y - 34}
          fontSize={13}
          fontWeight={700}
          textAnchor="middle"
          fill={ok ? '#2c9c79' : 'var(--text-h)'}
        >
          {ok ? 'A segment! length ' : 'length '}
          {(right - left).toFixed(1)}
        </text>
      </svg>

      <div className="readout small">
        <span>Two endpoints, one fixed length</span>
        <span style={{ color: 'var(--muted)', fontWeight: 500 }}>drag the two stops</span>
      </div>
    </div>
  )
}

/** A simple side-on pencil: eraser + ferrule on the left, sharpened tip on the right. */
function Pencil({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  const h = 16
  const top = y - h / 2
  const len = x2 - x1
  const eraserW = Math.min(10, len * 0.12)
  const ferruleW = Math.min(6, len * 0.07)
  const tipW = Math.min(20, len * 0.2)
  const bodyL = x1 + eraserW + ferruleW
  const bodyR = x2 - tipW
  return (
    <g>
      {/* eraser */}
      <rect x={x1} y={top} width={eraserW} height={h} rx={3} fill="#ff9aa8" stroke="#d9697c" strokeWidth={0.8} />
      {/* metal ferrule */}
      <rect x={x1 + eraserW} y={top} width={ferruleW} height={h} fill="#c9ccd2" stroke="#9aa0aa" strokeWidth={0.6} />
      {/* painted body */}
      <rect x={bodyL} y={top} width={bodyR - bodyL} height={h} fill="url(#cs-pencil-body)" stroke="#c79318" strokeWidth={0.6} />
      <line x1={bodyL} y1={y - 2} x2={bodyR} y2={y - 2} stroke="#fff" strokeOpacity={0.5} strokeWidth={1.5} />
      {/* sharpened wood + graphite tip */}
      <path d={`M ${bodyR} ${top} L ${x2 - 4} ${y} L ${bodyR} ${top + h} Z`} fill="#e8c99a" stroke="#c79318" strokeWidth={0.6} />
      <path d={`M ${x2 - 5.5} ${y - 3.2} L ${x2} ${y} L ${x2 - 5.5} ${y + 3.2} Z`} fill="#3a3a3a" />
    </g>
  )
}
