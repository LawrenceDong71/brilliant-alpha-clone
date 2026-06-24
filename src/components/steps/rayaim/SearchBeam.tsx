interface SearchBeamProps {
  originX: number
  originY: number
  angleDeg: number
  halfAngleDeg?: number
  length?: number
  lit?: boolean
  reduceMotion?: boolean
}

/**
 * Top-down rotating lighthouse search cone (warm light over dark water).
 *
 * The cone is authored pointing along the local +x axis from the source and is
 * aimed by rotating its group. The `sbm-fall` falloff gradient is userSpaceOnUse
 * and anchored at the apex, so rotating about that same point leaves it aligned
 * with the cone. When `lit`, a narrower inner wedge and a center axis ray fade in
 * (inside the same rotate group) to read as a lock-on brightening.
 */
export function SearchBeam({
  originX,
  originY,
  angleDeg,
  halfAngleDeg = 11,
  length = 270,
  lit = false,
  reduceMotion = false,
}: SearchBeamProps) {
  const th = (halfAngleDeg * Math.PI) / 180
  const tx = originX + length * Math.cos(th)
  const topY = originY - length * Math.sin(th)
  const botY = originY + length * Math.sin(th)
  const coneD = `M${originX} ${originY} L${tx} ${topY} A${length} ${length} 0 0 1 ${tx} ${botY} Z`

  // "Found" wedge: a few degrees narrower than the main cone.
  const thIn = ((halfAngleDeg - 3) * Math.PI) / 180
  const txIn = originX + length * Math.cos(thIn)
  const topYIn = originY - length * Math.sin(thIn)
  const botYIn = originY + length * Math.sin(thIn)
  const wedgeD = `M${originX} ${originY} L${txIn} ${topYIn} A${length} ${length} 0 0 1 ${txIn} ${botYIn} Z`

  const axisX2 = originX + length

  // Negative: angleDeg is math CCW (y-up), SVG y is down.
  const rot = `rotate(${-angleDeg} ${originX} ${originY})`

  return (
    <>
      <defs>
        <radialGradient
          id="sbm-fall"
          gradientUnits="userSpaceOnUse"
          cx={originX}
          cy={originY}
          r={length}
        >
          <stop offset="0%" stopColor="#fff3cf" stopOpacity={0.6} />
          <stop offset="32%" stopColor="#ffe39a" stopOpacity={0.3} />
          <stop offset="66%" stopColor="#ffd27a" stopOpacity={0.09} />
          <stop offset="100%" stopColor="#ffd27a" stopOpacity={0} />
        </radialGradient>

        <filter
          id="sbm-soft"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
      </defs>

      {/* screen blend is a progressive enhancement; opacities are tuned to read
          as light under normal compositing on dark water too. */}
      <g style={{ mixBlendMode: 'screen' }}>
        <g transform={rot} filter="url(#sbm-soft)" opacity={reduceMotion ? 0.96 : 0.92}>
          {!reduceMotion && (
            <animate
              attributeName="opacity"
              values="0.92;1;0.88;0.97;0.92"
              keyTimes="0;0.2;0.45;0.7;1"
              dur="4.6s"
              repeatCount="indefinite"
            />
          )}

          {/* soft top-down light cone with apex-anchored distance falloff */}
          <path d={coneD} fill="url(#sbm-fall)" />

          {/* brighter inner wedge when locked onto the ship */}
          <path
            d={wedgeD}
            fill="#fff6df"
            opacity={lit ? 0.5 : 0}
            style={{ transition: 'opacity 220ms ease' }}
          />

          {/* bright center axis ray, fades in with lit */}
          <line
            x1={originX}
            y1={originY}
            x2={axisX2}
            y2={originY}
            stroke="#fff6df"
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={lit ? 0.7 : 0}
            style={{ transition: 'opacity 220ms ease' }}
          />
        </g>
      </g>
    </>
  )
}
