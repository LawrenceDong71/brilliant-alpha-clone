import type { SVGProps } from 'react'

interface RayGeometryProps {
  originX: number
  originY: number
  angleDeg: number
  length?: number
  lit?: boolean
  endpointLabel?: string
  endpointCoord: { x: number; y: number }
  shipX: number
  shipY: number
  shipCoord: { x: number; y: number }
}

// Shared "chart ink" label style. The dark halo is painted UNDER the glyphs
// (paint-order: stroke), so captions stay legible over the warm beam or the dark
// water without needing a blur filter.
const LABEL: SVGProps<SVGTextElement> = {
  fontSize: 7.5,
  fill: '#eaf3ff',
  fontFamily: 'inherit',
  paintOrder: 'stroke',
  stroke: '#0a1326',
  strokeWidth: 1.8,
  strokeLinejoin: 'round',
}

const VIEW = 264
// Trim trig output to 2dp so the emitted SVG path/coords stay tidy.
const r2 = (n: number) => Math.round(n * 100) / 100

/**
 * Non-interactive overlay that makes the MATH of a ray explicit on top of the
 * lighthouse scene: a fixed endpoint, a direction angle measured CCW from +x,
 * and a dashed infinite continuation past the drawn length.
 *
 * Drawn inside the parent SVG (viewBox "0 0 264 264", y-down). Angles are math
 * CCW (y-up), so every direction's y component is negated for the y-down canvas.
 * Returns a fragment of SVG elements — no wrapping <svg>.
 */
export function RayGeometry({
  originX,
  originY,
  angleDeg,
  length = 250,
  lit = false,
  endpointLabel = 'L',
  endpointCoord,
  shipX,
  shipY,
  shipCoord,
}: RayGeometryProps) {
  const rad = (angleDeg * Math.PI) / 180
  const dirX = Math.cos(rad)
  const dirY = -Math.sin(rad)

  // Drawn ray: solid for the first 45%, dashed continuation out to the tip.
  const endX = r2(originX + length * dirX)
  const endY = r2(originY + length * dirY)
  const solidEndX = r2(originX + length * 0.45 * dirX)
  const solidEndY = r2(originY + length * 0.45 * dirY)

  // Angle arc swept from the +x axis (0°) to the beam, radius R about the origin.
  const R = 20
  const arcEndX = r2(originX + R * Math.cos(rad))
  const arcEndY = r2(originY - R * Math.sin(rad))
  const disp = ((Math.round(angleDeg) % 360) + 360) % 360
  const largeArc = disp > 180 ? 1 : 0
  // y-down canvas but the angle grows CCW (math positive) -> sweep-flag 0.
  const arcD = `M ${r2(originX + R)} ${r2(originY)} A ${R} ${R} 0 ${largeArc} 0 ${arcEndX} ${arcEndY}`

  // θ caption rides the arc bisector, just outside the arc radius.
  const bisRad = (disp / 2) * (Math.PI / 180)
  const thetaX = r2(originX + 34 * Math.cos(bisRad))
  const thetaY = r2(originY - 34 * Math.sin(bisRad))

  // Tip arrowhead as an explicit triangle built from dir + its perpendicular
  // (instead of a marker, so its orientation is always correct).
  const aLen = 6.5
  const aHalf = 3.4
  const perpX = -dirY
  const perpY = dirX
  const baseX = endX - aLen * dirX
  const baseY = endY - aLen * dirY
  const arrowD =
    `M ${endX} ${endY}` +
    ` L ${r2(baseX + aHalf * perpX)} ${r2(baseY + aHalf * perpY)}` +
    ` L ${r2(baseX - aHalf * perpX)} ${r2(baseY - aHalf * perpY)} Z`

  // "continues forever" sits just inside the tip, lifted off the dashed line.
  const foreverX = r2(endX - 12 * dirX)
  const foreverY = r2(endY - 12 * dirY - 6)
  // Anchor each caption toward the canvas interior so none spill off an edge.
  const foreverAnchor = dirX > 0.25 ? 'end' : dirX < -0.25 ? 'start' : 'middle'
  const epLeft = originX < VIEW / 2
  const shipRight = shipX > VIEW / 2
  const checkX = shipRight ? shipX + 5 : shipX - 9

  return (
    <>
      <g pointerEvents="none">
        {/* 1 · faint +x reference baseline: shows where 0° points */}
        <line
          x1={originX}
          y1={originY}
          x2={originX + 26}
          y2={originY}
          stroke="#cfe0ff"
          strokeWidth={1}
          opacity={0.35}
          strokeDasharray="2 3"
        />

        {/* 2 · angle arc + θ readout */}
        <path d={arcD} stroke="#ffe39a" strokeWidth={1.4} fill="none" opacity={0.95} />
        <text {...LABEL} x={thetaX} y={thetaY} textAnchor="middle">
          θ = {disp}°
        </text>

        {/* 3 · the ray: solid near the source, dashed to the tip, arrowhead + caption */}
        <line
          x1={originX}
          y1={originY}
          x2={solidEndX}
          y2={solidEndY}
          stroke="#f2f8ff"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <line
          x1={solidEndX}
          y1={solidEndY}
          x2={endX}
          y2={endY}
          stroke="#f2f8ff"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          opacity={0.9}
        />
        <path d={arrowD} fill="#f2f8ff" />
        <text {...LABEL} fontSize={7} x={foreverX} y={foreverY} textAnchor={foreverAnchor}>
          continues forever
        </text>

        {/* 4 · fixed endpoint of the ray */}
        <circle cx={originX} cy={originY} r={2.6} fill="#fff7e0" />
        <circle cx={originX} cy={originY} r={4} fill="none" stroke="#fff7e0" strokeWidth={1} />
        <text
          {...LABEL}
          x={originX + (epLeft ? 7 : -7)}
          y={originY - 8}
          textAnchor={epLeft ? 'start' : 'end'}
        >
          {endpointLabel} ({endpointCoord.x}, {endpointCoord.y}) · endpoint
        </text>

        {/* 5 · ship point; turns green + checks when it lies ON the ray */}
        <circle cx={shipX} cy={shipY} r={3} fill="none" stroke="#cfe7ff" strokeWidth={1.2} />
        {lit && (
          <path
            d={`M ${checkX} ${shipY} l 1.6 1.8 l 3.4 -4`}
            fill="none"
            stroke="#9ff0c8"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        <text
          {...LABEL}
          fill={lit ? '#9ff0c8' : LABEL.fill}
          x={shipX + (shipRight ? -7 : 7)}
          y={shipY - 8}
          textAnchor={shipRight ? 'end' : 'start'}
        >
          S ({shipCoord.x.toFixed(1)}, {shipCoord.y.toFixed(1)})
        </text>
      </g>
    </>
  )
}
