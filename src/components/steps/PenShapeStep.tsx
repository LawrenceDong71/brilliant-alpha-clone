import { useEffect, useRef, useState } from 'react'
import type { PenShapeStep as PSStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox } from '../figures/geometry'

const VB_W = 300
const VB_H = 240

// Pen drawing area (anchored at its bottom-left corner) and the area meter column.
const ORIGIN_X = 34
const BOTTOM_Y = 202
const GRID_AVAIL_W = 206
const GRID_AVAIL_H = 168

const METER_X = 270
const METER_W = 16
const METER_TOP = BOTTOM_Y - GRID_AVAIL_H
const METER_H = GRID_AVAIL_H

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export function PenShapeStep({ step, setChecker, locked }: InteractiveStepProps<PSStep>) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragging = useRef(false)

  // Fixed fence: width + height stays equal to S (= perimeter / 2).
  const S = step.perimeter / 2
  const [w, setW] = useState(step.startWidth)
  const h = S - w
  const area = w * h
  const maxArea = (S / 2) * (S / 2)

  useEffect(() => setChecker(() => w === S / 2), [w, S, setChecker])

  // One world unit in viewBox pixels; keeps the full S×S ground square on screen.
  const UNIT = Math.min(GRID_AVAIL_W / S, GRID_AVAIL_H / S)
  const gridSize = S * UNIT

  const update = (clientX: number, clientY: number) => {
    if (!svgRef.current) return
    const p = clientToViewBox(svgRef.current, clientX, clientY, VB_W, VB_H)
    const worldWidth = (p.x - ORIGIN_X) / UNIT
    setW(clamp(Math.round(worldWidth), 1, S - 1))
  }
  const onDown = (e: React.PointerEvent<SVGCircleElement>) => {
    if (locked) return
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    update(e.clientX, e.clientY)
  }
  const onMove = (e: React.PointerEvent<SVGCircleElement>) => {
    if (dragging.current) update(e.clientX, e.clientY)
  }
  const onUp = () => {
    dragging.current = false
  }

  const unit = step.unit ?? ''

  // Pen geometry (grows up + right from the fixed bottom-left anchor corner).
  const penW = w * UNIT
  const penH = h * UNIT
  const penTop = BOTTOM_Y - penH
  const handleX = ORIGIN_X + penW
  const handleY = penTop

  // Faint rival pen, anchored at the same corner.
  const rival = step.rival
  const rivalArea = rival ? rival.width * rival.height : 0
  const rivalW = rival ? rival.width * UNIT : 0
  const rivalH = rival ? rival.height * UNIT : 0
  const rivalTop = BOTTOM_Y - rivalH

  // Area meter fill (0..maxArea bottom-to-top).
  const meterFillH = (area / maxArea) * METER_H
  const meterFillY = BOTTOM_Y - meterFillH

  // Dog grows from cramped to comfortable as area approaches the maximum.
  const dogSize = 14 + (area / maxArea) * 18

  const solved = area === maxArea
  const badgeText = area < rivalArea ? 'Cramped' : area < maxArea ? 'Roomier than the neighbor!' : 'Most room! 🎉'

  // Faint ground grid lines.
  const lines: number[] = []
  for (let i = 0; i <= S; i++) lines.push(i)

  return (
    <div className="interactive">
      <div className="readout">
        <span className="readout-value">
          {area} {unit}²
        </span>
        <span className="readout-label">
          area · fence locked at {step.perimeter} {unit}
        </span>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${VB_W} ${VB_H}`} className="interactive-svg" style={{ touchAction: 'none' }}>
        {/* Ground plot the pen sits on. */}
        <rect
          x={ORIGIN_X}
          y={BOTTOM_Y - gridSize}
          width={gridSize}
          height={gridSize}
          fill="var(--card)"
          stroke="var(--border)"
          strokeWidth={1}
          rx={4}
        />
        {lines.map((i) => (
          <line
            key={`v${i}`}
            x1={ORIGIN_X + i * UNIT}
            y1={BOTTOM_Y - gridSize}
            x2={ORIGIN_X + i * UNIT}
            y2={BOTTOM_Y}
            stroke="var(--border)"
            strokeWidth={1}
            opacity={0.5}
          />
        ))}
        {lines.map((i) => (
          <line
            key={`h${i}`}
            x1={ORIGIN_X}
            y1={BOTTOM_Y - i * UNIT}
            x2={ORIGIN_X + gridSize}
            y2={BOTTOM_Y - i * UNIT}
            stroke="var(--border)"
            strokeWidth={1}
            opacity={0.5}
          />
        ))}

        {/* Rival (neighbor's) pen — faint and dashed for comparison. */}
        {rival && (
          <g opacity={0.6}>
            <rect
              x={ORIGIN_X}
              y={rivalTop}
              width={rivalW}
              height={rivalH}
              fill="none"
              stroke="var(--fig-stroke)"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              rx={2}
            />
            <text x={ORIGIN_X + rivalW + 4} y={rivalTop + 11} fontSize={9} fill="var(--fig-stroke)">
              {rival.label ?? 'neighbor'}
            </text>
            <text x={ORIGIN_X + rivalW + 4} y={rivalTop + 22} fontSize={9} fill="var(--fig-stroke)">
              {rivalArea} {unit}²
            </text>
          </g>
        )}

        {/* The dog's pen — grass fill, brighter outline when at max area. */}
        <rect x={ORIGIN_X} y={penTop} width={penW} height={penH} fill="var(--good)" opacity={0.18} rx={3} />
        <rect
          x={ORIGIN_X}
          y={penTop}
          width={penW}
          height={penH}
          fill="none"
          stroke={solved ? 'var(--good)' : 'var(--accent)'}
          strokeWidth={solved ? 3 : 2}
          rx={3}
        />

        {/* Width / height labels. */}
        <text x={ORIGIN_X + penW / 2} y={BOTTOM_Y + 15} fontSize={11} fontWeight={700} textAnchor="middle" fill="var(--text-h)">
          {w} {unit}
        </text>
        <text
          x={ORIGIN_X - 8}
          y={penTop + penH / 2}
          fontSize={11}
          fontWeight={700}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--text-h)"
        >
          {h} {unit}
        </text>

        {/* The dog — gets bigger (less cramped) as the pen gains room. */}
        <text
          x={ORIGIN_X + penW / 2}
          y={penTop + penH / 2}
          fontSize={dogSize}
          textAnchor="middle"
          dominantBaseline="central"
        >
          🐕
        </text>

        {/* Draggable far corner handle. */}
        <circle
          cx={handleX}
          cy={handleY}
          r={9}
          fill="var(--accent)"
          stroke="#fff"
          strokeWidth={2}
          style={{ cursor: locked ? 'default' : 'grab' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
        />
        <path
          d={`M${handleX - 3} ${handleY} H${handleX + 3} M${handleX} ${handleY - 3} V${handleY + 3}`}
          stroke="#fff"
          strokeWidth={1.5}
          strokeLinecap="round"
          pointerEvents="none"
        />

        {/* Area meter: track 0..maxArea with a live fill and a tick at the maximum. */}
        <rect x={METER_X} y={METER_TOP} width={METER_W} height={METER_H} fill="var(--card)" stroke="var(--border)" strokeWidth={1} rx={3} />
        <rect x={METER_X} y={meterFillY} width={METER_W} height={meterFillH} fill={solved ? 'var(--good)' : 'var(--accent)'} rx={3} />
        <line x1={METER_X - 3} y1={METER_TOP} x2={METER_X + METER_W + 3} y2={METER_TOP} stroke="var(--good)" strokeWidth={2} />
        <text x={METER_X + METER_W / 2} y={METER_TOP - 5} fontSize={9} textAnchor="middle" fill="var(--good)">
          max
        </text>
      </svg>

      <div style={{ textAlign: 'center' }}>
        <span className={solved ? 'pen-badge win pen-pop' : 'pen-badge'}>{badgeText}</span>
      </div>

      <p className="sort-help">
        Drag the corner to reshape the pen. The fence stays {step.perimeter} {unit} — but the room inside changes.
      </p>
    </div>
  )
}
