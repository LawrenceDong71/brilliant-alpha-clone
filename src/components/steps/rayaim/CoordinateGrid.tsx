interface CoordinateGridProps {
  size?: number
  pad?: number
  min: number
  max: number
}

/**
 * Faint nautical-chart coordinate grid, drawn as a decorative OVERLAY fragment
 * inside the parent sea SVG (viewBox "0 0 264 264", y-down). No wrapping <svg>.
 *
 * It sits over the dark moonlit water, so everything is kept low-contrast and
 * non-interactive: hairline integer rules in three opacity tiers (axes > every
 * fifth "major" > minor) plus sparse edge numerals with a dark legibility halo.
 * Mapping mirrors the rest of the app so the chart lines up with the gameplay.
 * Any svg ids would be `cg-`-prefixed; none are needed here.
 */
export function CoordinateGrid({ size = 264, pad = 26, min, max }: CoordinateGridProps) {
  const span = max - min
  const unit = (size - 2 * pad) / span
  const gx = (x: number) => pad + (x - min) * unit
  const gy = (y: number) => size - pad - (y - min) * unit // y-up grid -> y-down SVG

  const ints: number[] = []
  for (let i = min; i <= max; i++) ints.push(i)

  // Sparse labels keep the chart legible: every other tick, plus both ends.
  const labels = ints.filter((i) => (i - min) % 2 === 0 || i === min || i === max)

  // Tier by integer index: left/bottom edges are the axes, every fifth is major.
  const lineOpacity = (i: number): number => {
    if (i === min) return 0.5
    if ((i - min) % 5 === 0) return 0.22
    return 0.13
  }

  const left = gx(min)
  const right = gx(max)
  const bottom = gy(min)
  const top = gy(max)

  return (
    <>
      <g pointerEvents="none">
        {/* Vertical rules at every integer x. */}
        {ints.map((i) => (
          <line
            key={`cg-v-${i}`}
            x1={gx(i)}
            y1={bottom}
            x2={gx(i)}
            y2={top}
            stroke="#aacbe6"
            strokeWidth={1}
            opacity={lineOpacity(i)}
            vectorEffect="non-scaling-stroke"
            shapeRendering="crispEdges"
          />
        ))}

        {/* Horizontal rules at every integer y. */}
        {ints.map((i) => (
          <line
            key={`cg-h-${i}`}
            x1={left}
            y1={gy(i)}
            x2={right}
            y2={gy(i)}
            stroke="#aacbe6"
            strokeWidth={1}
            opacity={lineOpacity(i)}
            vectorEffect="non-scaling-stroke"
            shapeRendering="crispEdges"
          />
        ))}

        {/* X-axis numerals, centred just below the bottom edge. */}
        {labels.map((i) => (
          <text
            key={`cg-xn-${i}`}
            x={gx(i)}
            y={bottom + 9}
            textAnchor="middle"
            fontSize={7}
            fontFamily="inherit"
            fill="#d4e4fb"
            opacity={0.75}
            paintOrder="stroke"
            stroke="#0a1326"
            strokeWidth={1.6}
            strokeLinejoin="round"
          >
            {i}
          </text>
        ))}

        {/* Y-axis numerals, right-aligned just left of the left edge. */}
        {labels.map((i) => (
          <text
            key={`cg-yn-${i}`}
            x={left - 8}
            y={gy(i) + 2.5}
            textAnchor="end"
            fontSize={7}
            fontFamily="inherit"
            fill="#d4e4fb"
            opacity={0.75}
            paintOrder="stroke"
            stroke="#0a1326"
            strokeWidth={1.6}
            strokeLinejoin="round"
          >
            {i}
          </text>
        ))}
      </g>
    </>
  )
}
