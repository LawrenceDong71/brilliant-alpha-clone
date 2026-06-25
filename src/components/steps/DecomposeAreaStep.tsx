import { useEffect, useMemo, useRef, useState } from 'react'
import type { DecomposeAreaStep as DecompStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox } from '../figures/geometry'

// Same viewBox + padding + cabinet headroom as KitchenFloorGrid so a shape
// rendered here lines up pixel-for-pixel with the tap-to-tile version.
const VB = 300
const PAD = 18
const CABINET = 30

type Orientation = 'v' | 'h'

interface RectInfo {
  minC: number
  minR: number
  w: number
  h: number
  /** True when the region's cells exactly fill its bounding box (solid rectangle, no holes). */
  ok: boolean
}

/**
 * Inspect a set of cells: find its bounding box and decide whether the cells
 * fill that box completely. A region passes only if every box cell is present,
 * i.e. it is one solid rectangle.
 */
function rectInfo(region: Array<[number, number]>): RectInfo | null {
  if (region.length === 0) return null
  let minC = Infinity
  let maxC = -Infinity
  let minR = Infinity
  let maxR = -Infinity
  const keys = new Set<string>()
  for (const [c, r] of region) {
    keys.add(`${c},${r}`)
    if (c < minC) minC = c
    if (c > maxC) maxC = c
    if (r < minR) minR = r
    if (r > maxR) maxR = r
  }
  const w = maxC - minC + 1
  const h = maxR - minR + 1
  let ok = keys.size === w * h
  for (let c = minC; ok && c <= maxC; c++) {
    for (let r = minR; ok && r <= maxR; r++) {
      if (!keys.has(`${c},${r}`)) ok = false
    }
  }
  return { minC, minR, w, h, ok }
}

/**
 * "Area by decomposition" — the learner drags a divider to slice an L-shaped
 * room into TWO rectangles and watches their areas add up to the whole. This is
 * deliberately distinct from the tap-to-tile step: the floor is one solid piece,
 * and the manipulation is a single draggable cut line rather than per-cell taps.
 */
export function DecomposeAreaStep({ step, setChecker, locked }: InteractiveStepProps<DecompStep>) {
  const { cols, rows, cells } = step

  // Cell size + centering, mirroring KitchenFloorGrid exactly (row 0 at bottom).
  const availW = VB - 2 * PAD
  const availH = VB - 2 * PAD - CABINET
  const S = Math.min(availW / cols, availH / rows)
  const offX = (VB - cols * S) / 2
  const offY = PAD + CABINET + (availH - rows * S) / 2
  const gx = (c: number) => offX + c * S
  const gy = (r: number) => offY + (rows - 1 - r) * S

  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragging = useRef(false)

  // The grid line a cut sits on: for 'v' a line between columns (1..cols-1),
  // for 'h' a line between rows (1..rows-1). Start on the FIRST interior line (an
  // edge cut) so the room does NOT begin already split into two rectangles — the
  // learner must drag to discover the decomposition.
  const startFor = (o: Orientation) => {
    const n = o === 'v' ? cols : rows
    return Math.min(1, n - 1)
  }
  const [orientation, setOrientation] = useState<Orientation>('v')
  const [split, setSplit] = useState<number>(() => startFor('v'))

  // Partition the filled cells by which side of the cut they fall on.
  const { regionA, regionB } = useMemo(() => {
    const a: Array<[number, number]> = []
    const b: Array<[number, number]> = []
    for (const [c, r] of cells) {
      const onA = orientation === 'v' ? c < split : r < split
      if (onA) a.push([c, r])
      else b.push([c, r])
    }
    return { regionA: a, regionB: b }
  }, [cells, orientation, split])

  const ra = rectInfo(regionA)
  const rb = rectInfo(regionB)
  const validSplit = ra !== null && rb !== null && ra.ok && rb.ok

  // The learner must compute and enter the total area themselves — the cut only
  // helps them decompose; it never reveals the answer.
  const maxArea = cols * rows
  const [answer, setAnswer] = useState(0)
  const bump = (d: number) => {
    if (locked) return
    setAnswer((a) => Math.max(0, Math.min(maxArea, a + d)))
  }

  useEffect(() => {
    setChecker(() => validSplit && answer === step.total)
  }, [validSplit, answer, step.total, setChecker])

  // Snap the divider to the nearest integer grid line on the active axis.
  const update = (clientX: number, clientY: number) => {
    if (!svgRef.current) return
    const p = clientToViewBox(svgRef.current, clientX, clientY, VB, VB)
    if (orientation === 'v') {
      const line = Math.round((p.x - offX) / S)
      setSplit(Math.max(1, Math.min(cols - 1, line)))
    } else {
      const line = rows - Math.round((p.y - offY) / S)
      setSplit(Math.max(1, Math.min(rows - 1, line)))
    }
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

  const toggle = (o: Orientation) => {
    if (locked) return
    setOrientation(o)
    setSplit(startFor(o))
  }

  // Pixel geometry for the highlighted region rectangles (only meaningful when valid).
  const regionRect = (info: RectInfo) => {
    const x = offX + info.minC * S
    const y = offY + (rows - info.minR - info.h) * S
    const wPx = info.w * S
    const hPx = info.h * S
    return { x, y, wPx, hPx, cx: x + wPx / 2, cy: y + hPx / 2 }
  }
  const gA = validSplit && ra ? regionRect(ra) : null
  const gB = validSplit && rb ? regionRect(rb) : null

  // Divider line + handle geometry on the active axis.
  const isV = orientation === 'v'
  const floorW = cols * S
  const floorH = rows * S
  const cutX = offX + split * S
  const cutY = offY + (rows - split) * S
  const lineX1 = isV ? cutX : offX
  const lineY1 = isV ? offY : cutY
  const lineX2 = isV ? cutX : offX + floorW
  const lineY2 = isV ? offY + floorH : cutY
  const handleX = isV ? cutX : offX + floorW / 2
  const handleY = isV ? offY + floorH / 2 : cutY

  return (
    <div className="interactive">
      <div className="readout">
        <span className="readout-value">{answer}</span>
        <span className="readout-label">your total area (square units)</span>
      </div>

      <p className="sort-help">
        {validSplit
          ? 'Two clean rectangles. Count each one’s area, add them, and enter the total below.'
          : 'Drag the divider so the room splits into two full rectangles.'}
      </p>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          type="button"
          className={isV ? 'btn primary' : 'btn'}
          style={{ padding: '8px 16px', fontSize: 14 }}
          disabled={locked}
          onClick={() => toggle('v')}
        >
          Cut ⟷
        </button>
        <button
          type="button"
          className={!isV ? 'btn primary' : 'btn'}
          style={{ padding: '8px 16px', fontSize: 14 }}
          disabled={locked}
          onClick={() => toggle('h')}
        >
          Cut ↕
        </button>
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
        {/* Faint reference grid across the whole working area. */}
        {Array.from({ length: cols + 1 }, (_, i) => (
          <line key={`gv${i}`} x1={offX + i * S} y1={offY} x2={offX + i * S} y2={offY + floorH} stroke="var(--grid)" strokeWidth={1} />
        ))}
        {Array.from({ length: rows + 1 }, (_, i) => (
          <line key={`gh${i}`} x1={offX} y1={offY + i * S} x2={offX + floorW} y2={offY + i * S} stroke="var(--grid)" strokeWidth={1} />
        ))}

        {/* The filled room as one solid floor (no individually tappable tiles). */}
        {cells.map(([c, r]) => (
          <rect
            key={`f${c},${r}`}
            x={gx(c)}
            y={gy(r)}
            width={S}
            height={S}
            fill="var(--fig-stroke)"
            fillOpacity={0.16}
            stroke="var(--fig-stroke)"
            strokeOpacity={0.32}
            strokeWidth={0.6}
          />
        ))}

        {/* When the cut yields two solid rectangles, tint + label each one. */}
        {gA && ra && (
          <g>
            <rect x={gA.x} y={gA.y} width={gA.wPx} height={gA.hPx} fill="var(--accent-bg)" stroke="var(--accent)" strokeWidth={2} rx={2} />
            <text x={gA.cx} y={gA.cy} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={800} fill="var(--accent)">
              A
            </text>
          </g>
        )}
        {gB && rb && (
          <g>
            <rect x={gB.x} y={gB.y} width={gB.wPx} height={gB.hPx} fill="var(--good-bg)" stroke="var(--good)" strokeWidth={2} rx={2} />
            <text x={gB.cx} y={gB.cy} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={800} fill="var(--good)">
              B
            </text>
          </g>
        )}

        {/* The draggable divider: a light casing under an accent dashed cut line. */}
        <line x1={lineX1} y1={lineY1} x2={lineX2} y2={lineY2} stroke="#fff" strokeOpacity={0.7} strokeWidth={5} strokeLinecap="round" />
        <line
          x1={lineX1}
          y1={lineY1}
          x2={lineX2}
          y2={lineY2}
          stroke="var(--accent)"
          strokeWidth={3}
          strokeDasharray="7 4"
          strokeLinecap="round"
        />

        {/* Big drag handle centred on the divider. */}
        <g style={{ cursor: locked ? 'default' : isV ? 'ew-resize' : 'ns-resize' }}>
          <circle cx={handleX} cy={handleY} r={12} fill="var(--accent)" stroke="#fff" strokeWidth={2.5} />
          {isV ? (
            <path
              d={`M${handleX - 6} ${handleY} h12 M${handleX - 6} ${handleY} l3 -3 M${handleX - 6} ${handleY} l3 3 M${handleX + 6} ${handleY} l-3 -3 M${handleX + 6} ${handleY} l-3 3`}
              stroke="#fff"
              strokeWidth={1.4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d={`M${handleX} ${handleY - 6} v12 M${handleX} ${handleY - 6} l-3 3 M${handleX} ${handleY - 6} l3 3 M${handleX} ${handleY + 6} l-3 -3 M${handleX} ${handleY + 6} l3 -3`}
              stroke="#fff"
              strokeWidth={1.4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </g>
      </svg>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
        <button
          type="button"
          className="btn"
          style={{ padding: '6px 18px', fontSize: 20, lineHeight: 1 }}
          disabled={locked || answer <= 0}
          onClick={() => bump(-1)}
          aria-label="Decrease total"
        >
          −
        </button>
        <span style={{ minWidth: 130, textAlign: 'center', fontSize: 16, fontWeight: 700 }}>
          Total area = {answer}
        </span>
        <button
          type="button"
          className="btn"
          style={{ padding: '6px 18px', fontSize: 20, lineHeight: 1 }}
          disabled={locked || answer >= maxArea}
          onClick={() => bump(1)}
          aria-label="Increase total"
        >
          +
        </button>
      </div>
    </div>
  )
}
