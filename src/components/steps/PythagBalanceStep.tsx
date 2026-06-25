import { useEffect, useRef, useState } from 'react'
import type { PythagBalanceStep as PBStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox } from '../figures/geometry'

const VB_W = 340
const VB_H = 264
const UNIT = 5 // px per world unit for the area-squares
const CX = 170
const PIVOT_Y = 60
const ARM = 118
const STRING = 24
const TRAY_H = 6
const MAX_TILT = 0.18 // radians
const DRAG_PX_PER_UNIT = 9 // viewBox px of horizontal drag to change b by 1

const RED = '#e9696b' // hypotenuse square (c²)
const GREEN = '#37b893' // known-leg square (a²)
const BLUE = '#5b8def' // missing-leg square (b²)

export function PythagBalanceStep({ step, setChecker, locked }: InteractiveStepProps<PBStep>) {
  const a = step.knownLeg
  const c = step.hypotenuse
  const target = step.targetLeg
  const maxSide = Math.max(target + 3, Math.ceil(Math.sqrt(Math.max(0, c * c - a * a))) + 3)

  const svgRef = useRef<SVGSVGElement | null>(null)
  const drag = useRef<{ startX: number; startB: number } | null>(null)
  const [b, setB] = useState(3)

  const leftArea = c * c
  const rightArea = a * a + b * b
  const ok = Math.abs(rightArea - leftArea) < 0.5 && b > 0

  useEffect(() => {
    setChecker(() => ok)
  }, [ok, setChecker])

  const update = (clientX: number, clientY: number) => {
    if (!drag.current) return
    const p = clientToViewBox(svgRef.current!, clientX, clientY, VB_W, VB_H)
    const next = drag.current.startB + Math.round((p.x - drag.current.startX) / DRAG_PX_PER_UNIT)
    setB(Math.max(0, Math.min(maxSide, next)))
  }
  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (locked) return
    const p = clientToViewBox(svgRef.current!, e.clientX, e.clientY, VB_W, VB_H)
    drag.current = { startX: p.x, startB: b }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (drag.current) update(e.clientX, e.clientY)
  }
  const onUp = () => {
    drag.current = null
  }

  // Beam tilt: positive = right pan (legs) heavier → right side dips.
  const phi = Math.max(-MAX_TILT, Math.min(MAX_TILT, (rightArea - leftArea) * 0.004))
  const leftEnd = { x: CX - ARM * Math.cos(phi), y: PIVOT_Y - ARM * Math.sin(phi) }
  const rightEnd = { x: CX + ARM * Math.cos(phi), y: PIVOT_Y + ARM * Math.sin(phi) }

  // Pans hang straight down from each beam end.
  const leftTrayY = leftEnd.y + STRING
  const rightTrayY = rightEnd.y + STRING

  const cPx = c * UNIT
  const aPx = a * UNIT
  const bPx = b * UNIT
  const gap = 5

  // Left pan: the single hypotenuse square, centred on its tray.
  const leftSqX = leftEnd.x - cPx / 2
  const leftSqY = leftTrayY - cPx

  // Right pan: known-leg square + growing missing-leg square, centred as a group.
  const groupW = aPx + gap + bPx
  const rgX = rightEnd.x - groupW / 2
  const greenX = rgX
  const blueX = rgX + aPx + gap
  const greenY = rightTrayY - aPx
  const blueY = rightTrayY - bPx

  return (
    <div className="interactive">
      <div className="readout">
        <span className="readout-value" style={{ color: ok ? '#2c9c79' : 'var(--text-h)' }}>
          {a}² + {b}² {ok ? '=' : '≠'} {c}²
        </span>
        <span className="readout-label">
          {a * a} + {b * b} {ok ? '=' : '≠'} {c * c}
        </span>
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
          <linearGradient id="pb-beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9aa3b2" />
            <stop offset="1" stopColor="#6c7686" />
          </linearGradient>
          <filter id="pb-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.4" floodColor="#000" floodOpacity="0.22" />
          </filter>
        </defs>

        {/* Stand */}
        <polygon points={`${CX - 26},${VB_H - 18} ${CX + 26},${VB_H - 18} ${CX + 8},${PIVOT_Y} ${CX - 8},${PIVOT_Y}`} fill="#cfd5df" stroke="#9aa3b2" strokeWidth={1.5} />
        <rect x={CX - 40} y={VB_H - 22} width={80} height={8} rx={3} fill="#9aa3b2" />

        {/* Strings from beam ends to trays */}
        <line x1={leftEnd.x} y1={leftEnd.y} x2={leftEnd.x} y2={leftTrayY} stroke="#8a93a3" strokeWidth={1.5} />
        <line x1={rightEnd.x} y1={rightEnd.y} x2={rightEnd.x} y2={rightTrayY} stroke="#8a93a3" strokeWidth={1.5} />

        {/* Beam */}
        <g filter="url(#pb-shadow)">
          <rect
            x={-ARM}
            y={-5}
            width={ARM * 2}
            height={10}
            rx={5}
            fill="url(#pb-beam)"
            transform={`translate(${CX} ${PIVOT_Y}) rotate(${(phi * 180) / Math.PI})`}
          />
        </g>
        <circle cx={CX} cy={PIVOT_Y} r={7} fill="#6c7686" stroke="#4a5260" strokeWidth={1.5} />

        {/* Trays */}
        <rect x={leftEnd.x - cPx / 2 - 8} y={leftTrayY} width={cPx + 16} height={TRAY_H} rx={3} fill="#b6bdc9" />
        <rect x={rightEnd.x - groupW / 2 - 8} y={rightTrayY} width={groupW + 16} height={TRAY_H} rx={3} fill="#b6bdc9" />

        {/* Hypotenuse square (c²) on the left pan */}
        <AreaSquare x={leftSqX} y={leftSqY} side={cPx} color={RED} label={`${c}² = ${c * c}`} />

        {/* Known-leg square (a²) on the right pan */}
        <AreaSquare x={greenX} y={greenY} side={aPx} color={GREEN} label={`${a}² = ${a * a}`} />

        {/* Missing-leg square (b²) on the right pan — the draggable one */}
        <g>
          <rect
            x={blueX}
            y={blueY}
            width={bPx}
            height={bPx}
            rx={2}
            fill={ok ? GREEN : BLUE}
            fillOpacity={0.85}
            stroke={ok ? '#1f8f6b' : '#3f6fd0'}
            strokeWidth={1.5}
            style={{ transition: 'fill 150ms ease' }}
          />
          {b > 0 && (
            <text x={blueX + bPx / 2} y={blueY + bPx / 2 + 4} fontSize={11} fontWeight={700} textAnchor="middle" fill="#fff">
              {b}²
            </text>
          )}
          {/* Resize handle at the square's top-right corner */}
          <circle
            cx={blueX + bPx}
            cy={blueY}
            r={7}
            fill="#fff"
            stroke={ok ? '#1f8f6b' : BLUE}
            strokeWidth={3}
            style={{ cursor: locked ? 'default' : 'ew-resize' }}
          />
          <path d={`M ${blueX + bPx - 2.5} ${blueY} h 5 M ${blueX + bPx} ${blueY - 2.5} v 5`} stroke={ok ? '#1f8f6b' : BLUE} strokeWidth={1.6} strokeLinecap="round" />
        </g>

        {/* Reference right triangle, base leg highlighted */}
        <ReferenceTriangle a={a} b={b} c={c} ok={ok} />
      </svg>

      <p className="sort-help">
        Drag the handle to grow the base square (b²) until the scale balances:
        the two leg squares must equal the big hypotenuse square.
      </p>
    </div>
  )
}

function AreaSquare({ x, y, side, color, label }: { x: number; y: number; side: number; color: string; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width={side} height={side} rx={2} fill={color} fillOpacity={0.85} stroke={color} strokeWidth={1.5} />
      <text x={x + side / 2} y={y + side / 2 + 4} fontSize={11} fontWeight={700} textAnchor="middle" fill="#fff">
        {label.split(' ')[0]}
      </text>
    </g>
  )
}

/** A small right triangle (legs a vertical, b horizontal, hyp c) tying the squares to the shape. */
function ReferenceTriangle({ a, b, c, ok }: { a: number; b: number; c: number; ok: boolean }) {
  const u = 5.2
  const ox = 24
  const oy = VB_H - 22
  const right = { x: ox, y: oy }
  const topV = { x: ox, y: oy - a * u }
  const baseEnd = { x: ox + Math.max(b, 0.0001) * u, y: oy }
  return (
    <g opacity={0.95}>
      {b > 0 && (
        <polygon
          points={`${right.x},${right.y} ${baseEnd.x},${baseEnd.y} ${topV.x},${topV.y}`}
          fill={ok ? 'rgba(55,184,147,0.18)' : 'rgba(91,141,239,0.12)'}
          stroke="var(--fig-stroke)"
          strokeWidth={1}
        />
      )}
      {/* vertical known leg a */}
      <line x1={right.x} y1={right.y} x2={topV.x} y2={topV.y} stroke={GREEN} strokeWidth={2.5} strokeLinecap="round" />
      {/* horizontal missing leg b */}
      <line x1={right.x} y1={right.y} x2={baseEnd.x} y2={baseEnd.y} stroke={ok ? GREEN : BLUE} strokeWidth={2.5} strokeLinecap="round" />
      {/* hypotenuse c */}
      {b > 0 && <line x1={topV.x} y1={topV.y} x2={baseEnd.x} y2={baseEnd.y} stroke={RED} strokeWidth={2.5} strokeLinecap="round" />}
      <rect x={right.x} y={right.y - 8} width={8} height={8} fill="none" stroke="var(--fig-stroke)" strokeWidth={1} />
      <text x={right.x - 6} y={(right.y + topV.y) / 2} fontSize={10} textAnchor="end" fill="var(--text-h)">{a}</text>
      <text x={(right.x + baseEnd.x) / 2} y={oy + 12} fontSize={10} textAnchor="middle" fill={ok ? '#2c9c79' : '#3f6fd0'} fontWeight={700}>
        {b}
      </text>
      <text x={(topV.x + baseEnd.x) / 2 + 6} y={(topV.y + baseEnd.y) / 2 - 3} fontSize={10} fill="var(--text-h)">{c}</text>
    </g>
  )
}
