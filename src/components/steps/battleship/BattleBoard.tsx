import { useState } from 'react'
import type { BoardMode, BoardPreview, BoardShip, Coord, Shot } from './types'
import { buildBoardCells, cellsOfSegment } from './battleshipGeo'
import { clientToViewBox } from '../../figures/geometry'

export interface BattleBoardProps {
  mode: BoardMode // 'own' = your waters; 'target' = enemy waters
  size: number // grid 1..size
  ships: BoardShip[] // own: your full fleet; target: ONLY sunk (revealed) enemy ships
  shots: Shot[] // own: enemy shots on you; target: your shots on enemy
  preview?: BoardPreview | null // hover overlay (placement segment or fire crosshair)
  interactive?: boolean // enable pointer handlers (default true)
  onCellClick?: (coord: Coord) => void
  onCellHover?: (coord: Coord | null) => void
  title?: string // accessible <title>
}

const VB = 264
const PAD = 24

const keyOf = (c: Coord): string => `${c.x},${c.y}`

/**
 * Self-contained chart-style battleship board. Renders ONE <svg> (unlike the
 * rayaim overlays, which draw into a parent canvas). Geometry teaches the core
 * idea: every ship is an axis-aligned SEGMENT between two endpoints, and every
 * shot is a POINT. Colour cues are always paired with a non-colour shape cue.
 */
export function BattleBoard({
  mode,
  size,
  ships,
  shots,
  preview = null,
  interactive = true,
  onCellClick,
  onCellHover,
  title,
}: BattleBoardProps) {
  const [hover, setHover] = useState<Coord | null>(null)

  const N = size
  const S = (VB - 2 * PAD) / N
  const cx = (x: number) => PAD + (x - 0.5) * S
  const cy = (y: number) => VB - PAD - (y - 0.5) * S
  const rectX = (x: number) => PAD + (x - 1) * S
  const rectY = (y: number) => VB - PAD - y * S
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
  const toCell = (px: number, py: number): Coord => ({
    x: clamp(Math.floor((px - PAD) / S) + 1, 1, N),
    y: clamp(Math.floor((VB - PAD - py) / S) + 1, 1, N),
  })

  // Resolve the cell under a pointer through the shared viewBox mapping.
  const coordFromPointer = (e: {
    currentTarget: SVGElement
    clientX: number
    clientY: number
  }): Coord | null => {
    const svg = e.currentTarget.ownerSVGElement
    if (!svg) return null
    const p = clientToViewBox(svg, e.clientX, e.clientY, VB, VB)
    return toCell(p.x, p.y)
  }

  // Cell count of a ship's segment — teaches "length = cells between two endpoints".
  const segmentLengthOf = (ship: BoardShip): number => cellsOfSegment(ship.start, ship.end).length

  const cells = buildBoardCells({ size, mode, ships, shots })
  const shotKeys = new Set(shots.map((s) => keyOf(s.coord)))
  const isShot = (c: Coord) => shotKeys.has(keyOf(c))

  const water = mode === 'target' ? '#0c2440' : '#0b1d38'
  const edges = Array.from({ length: N + 1 }, (_, i) => i)
  const ticks = Array.from({ length: N }, (_, i) => i + 1)

  const clearHover = () => {
    setHover(null)
    onCellHover?.(null)
  }

  const crosshair = (px: number, py: number, color: string, ring = false) => (
    <>
      {ring ? <circle cx={px} cy={py} r={8} fill="none" stroke={color} strokeWidth={1.4} /> : null}
      <line x1={px - 5} y1={py} x2={px + 5} y2={py} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <line x1={px} y1={py - 5} x2={px} y2={py + 5} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </>
  )

  const placementPreview = (segCells: Coord[], legal: boolean) => {
    if (segCells.length === 0) return null
    const a = segCells[0]
    const b = segCells[segCells.length - 1]
    const color = legal ? 'var(--good)' : 'var(--bad)'
    return (
      <>
        <line
          x1={cx(a.x)}
          y1={cy(a.y)}
          x2={cx(b.x)}
          y2={cy(b.y)}
          stroke={color}
          strokeWidth={S * 0.5}
          strokeLinecap="round"
          opacity={0.55}
          strokeDasharray={legal ? undefined : '4 3'}
        />
        <circle cx={cx(a.x)} cy={cy(a.y)} r={3.4} fill={color} />
        <circle cx={cx(b.x)} cy={cy(b.y)} r={3.4} fill={color} />
      </>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      className="interactive-svg"
      style={{ touchAction: 'none' }}
      onPointerLeave={interactive ? clearHover : undefined}
    >
      {title ? <title>{title}</title> : null}
      <clipPath id="bb-clip">
        <rect x={0} y={0} width={VB} height={VB} rx={16} />
      </clipPath>

      <g clipPath="url(#bb-clip)">
        {/* 1 · deep-water background */}
        <rect x={0} y={0} width={VB} height={VB} rx={16} fill={water} />

        {/* 2 · faint chart grid on cell edges + axis numerals */}
        <g pointerEvents="none">
          <g shapeRendering="crispEdges">
            {edges.map((i) => {
              const frame = i === 0 || i === N
              const x = PAD + i * S
              const y = PAD + i * S
              return (
                <g key={`bb-edge-${i}`}>
                  <line
                    x1={x}
                    y1={PAD}
                    x2={x}
                    y2={VB - PAD}
                    stroke="#aacbe6"
                    strokeWidth={1}
                    opacity={frame ? 0.4 : 0.14}
                    vectorEffect="non-scaling-stroke"
                  />
                  <line
                    x1={PAD}
                    y1={y}
                    x2={VB - PAD}
                    y2={y}
                    stroke="#aacbe6"
                    strokeWidth={1}
                    opacity={frame ? 0.4 : 0.14}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              )
            })}
          </g>
          {ticks.map((n) => (
            <text
              key={`bb-col-${n}`}
              x={cx(n)}
              y={VB - PAD + 9}
              fontSize={7}
              fill="#d4e4fb"
              opacity={0.7}
              textAnchor="middle"
              paintOrder="stroke"
              stroke="#0a1326"
              strokeWidth={1.6}
            >
              {n}
            </text>
          ))}
          {ticks.map((n) => (
            <text
              key={`bb-row-${n}`}
              x={PAD - 7}
              y={cy(n)}
              fontSize={7}
              fill="#d4e4fb"
              opacity={0.7}
              textAnchor="end"
              dominantBaseline="central"
              paintOrder="stroke"
              stroke="#0a1326"
              strokeWidth={1.6}
            >
              {n}
            </text>
          ))}
        </g>

        {/* 3 · ships drawn as endpoint-to-endpoint segments */}
        <g pointerEvents="none">
          {ships.map((ship) => {
            const x1 = cx(ship.start.x)
            const y1 = cy(ship.start.y)
            const x2 = cx(ship.end.x)
            const y2 = cy(ship.end.y)
            return (
              <g key={`bb-ship-${ship.id}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={ship.sunk ? '#7a1f12' : '#27435f'}
                  strokeWidth={S * 0.72}
                  strokeLinecap="round"
                />
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={ship.sunk ? '#d4452a' : '#9fb2c9'}
                  strokeWidth={S * 0.5}
                  strokeLinecap="round"
                />
                <circle cx={x1} cy={y1} r={3.6} fill="#eaf3ff" stroke="#0a1326" strokeWidth={0.6} />
                <circle cx={x2} cy={y2} r={3.6} fill="#eaf3ff" stroke="#0a1326" strokeWidth={0.6} />
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2}
                  fontSize={8}
                  fill="#eaf3ff"
                  textAnchor="middle"
                  dominantBaseline="central"
                  paintOrder="stroke"
                  stroke="#0a1326"
                  strokeWidth={1.8}
                >
                  {segmentLengthOf(ship)}
                </text>
              </g>
            )
          })}
        </g>

        {/* 4 · shot markers (each cue has a non-colour shape too) */}
        <g pointerEvents="none">
          {cells.map((cell) => {
            const { coord, mark } = cell
            if (mark !== 'miss' && mark !== 'hit' && mark !== 'sunk') return null
            const px = cx(coord.x)
            const py = cy(coord.y)
            if (mark === 'miss') {
              return (
                <g key={`bb-mark-${keyOf(coord)}`}>
                  <circle
                    cx={px}
                    cy={py}
                    r={7}
                    fill="none"
                    stroke="#9db8e8"
                    strokeWidth={1}
                    strokeDasharray="2 3"
                    opacity={0.5}
                  />
                  <circle cx={px} cy={py} r={3.6} fill="none" stroke="#cfe0ff" strokeWidth={1.2} />
                </g>
              )
            }
            if (mark === 'hit') {
              return (
                <g key={`bb-mark-${keyOf(coord)}`}>
                  {Array.from({ length: 8 }, (_, i) => {
                    const a = (i * Math.PI) / 4
                    return (
                      <line
                        key={i}
                        x1={px + Math.cos(a) * 6.8}
                        y1={py + Math.sin(a) * 6.8}
                        x2={px + Math.cos(a) * 9.6}
                        y2={py + Math.sin(a) * 9.6}
                        stroke="#ff9a5c"
                        strokeWidth={1.4}
                        strokeLinecap="round"
                      />
                    )
                  })}
                  <circle cx={px} cy={py} r={6} fill="#ff7a3c" />
                </g>
              )
            }
            const d = Math.min(S * 0.3, 7)
            return (
              <g key={`bb-mark-${keyOf(coord)}`}>
                <line x1={px - d} y1={py - d} x2={px + d} y2={py + d} stroke="#ffd9c2" strokeWidth={2} strokeLinecap="round" />
                <line x1={px - d} y1={py + d} x2={px + d} y2={py - d} stroke="#ffd9c2" strokeWidth={2} strokeLinecap="round" />
              </g>
            )
          })}
        </g>

        {/* 5 · interactive hit-cells + hover highlight */}
        {interactive ? (
          <g>
            {cells.map((cell) => {
              const shot = isShot(cell.coord)
              return (
                <rect
                  key={`bb-hit-${keyOf(cell.coord)}`}
                  x={rectX(cell.coord.x)}
                  y={rectY(cell.coord.y)}
                  width={S}
                  height={S}
                  fill="transparent"
                  pointerEvents={shot ? 'none' : 'all'}
                  onPointerEnter={(e) => {
                    const c = coordFromPointer(e)
                    if (!c) return
                    setHover(c)
                    onCellHover?.(c)
                  }}
                  onClick={(e) => {
                    const c = coordFromPointer(e)
                    if (c) onCellClick?.(c)
                  }}
                />
              )
            })}
            {hover && !isShot(hover) ? (
              <g pointerEvents="none">
                <rect
                  x={rectX(hover.x)}
                  y={rectY(hover.y)}
                  width={S}
                  height={S}
                  fill="rgba(139,123,255,0.18)"
                  stroke="var(--accent)"
                  strokeWidth={1}
                />
                {crosshair(cx(hover.x), cy(hover.y), '#ffb454')}
              </g>
            ) : null}
          </g>
        ) : null}

        {/* 6 · placement / fire preview overlay */}
        {preview ? (
          <g pointerEvents="none">
            {preview.kind === 'placement'
              ? placementPreview(preview.cells, preview.legal)
              : crosshair(cx(preview.coord.x), cy(preview.coord.y), '#ffb454', true)}
          </g>
        ) : null}
      </g>
    </svg>
  )
}
