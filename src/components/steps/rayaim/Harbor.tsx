interface HarborProps {
  /** Lighthouse centre = beam pivot = harbor centre, in parent viewBox coords (y down). */
  x: number
  y: number
  /** Win radius — the ship is "home" once it reaches this distance of (x, y). */
  goalRadius: number
  arrived?: boolean
  scale?: number
  reduceMotion?: boolean
}

const r2 = (n: number): number => Math.round(n * 100) / 100

// Irregular coastline sampled as [angleDeg, radius] pairs; rendered as a smooth
// closed blob so the island never reads as a perfect disc.
const ISLAND: ReadonlyArray<readonly [number, number]> = [
  [0, 21],
  [33, 17.4],
  [62, 20.6],
  [96, 16.8],
  [126, 19.6],
  [160, 17.1],
  [193, 20.9],
  [226, 16.4],
  [262, 20.2],
  [298, 17.3],
  [332, 20.4],
]

// Smooth the samples by threading a quadratic through each edge midpoint, using
// the raw samples as control points -> an organic, C1-continuous shoreline.
function islandPath(cx: number, cy: number, scale: number): string {
  const pts = ISLAND.map(([deg, rad]): [number, number] => {
    const a = (deg * Math.PI) / 180
    return [cx + Math.cos(a) * rad * scale, cy + Math.sin(a) * rad * scale]
  })
  const mid = (a: [number, number], b: [number, number]): [number, number] => [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
  ]
  const n = pts.length
  const start = mid(pts[n - 1], pts[0])
  let d = `M ${r2(start[0])} ${r2(start[1])}`
  for (let i = 0; i < n; i++) {
    const cp = pts[i]
    const end = mid(pts[i], pts[(i + 1) % n])
    d += ` Q ${r2(cp[0])} ${r2(cp[1])} ${r2(end[0])} ${r2(end[1])}`
  }
  return `${d} Z`
}

/**
 * Top-down lighthouse island + safe-harbor goal, drawn as a fragment inside a
 * parent SVG (viewBox 264, y down). Everything is centred on (x, y) using
 * absolute coords so the userSpaceOnUse `hbr-lamp` / `hbr-rock` gradients stay
 * pinned to the island regardless of `scale`. Ids are namespaced `hbr-`.
 *
 * Cue language: the WARM glow marks the light source; the calm green-cyan DASHED
 * ring is the deliberately-cool destination signal, with the dash pattern (not
 * just the colour) carrying the meaning so it survives colour-blind viewing.
 */
export function Harbor({
  x,
  y,
  goalRadius,
  arrived = false,
  scale = 1,
  reduceMotion = false,
}: HarborProps) {
  const ringMin = r2(goalRadius + 4)
  const ringMax = r2(goalRadius + 12)
  const ringMid = r2(goalRadius + 8)
  const arrivedRing = r2(goalRadius + 13)

  const island = islandPath(x, y, scale)
  const coreR = r2((arrived ? 3.4 : 3) * scale)
  const corePulse = `${r2(2.6 * scale)};${r2(3.4 * scale)};${r2(2.6 * scale)}`

  return (
    <>
      <defs>
        <radialGradient id="hbr-lamp" gradientUnits="userSpaceOnUse" cx={x} cy={y} r={30}>
          <stop offset="0%" stopColor="#fff3cf" stopOpacity={0.95} />
          <stop offset="40%" stopColor="#ffe39a" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#ffe39a" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="hbr-rock" gradientUnits="userSpaceOnUse" cx={x} cy={y} r={24}>
          <stop offset="0%" stopColor="#565d6e" />
          <stop offset="60%" stopColor="#363c49" />
          <stop offset="100%" stopColor="#23262f" />
        </radialGradient>
        <filter
          id="hbr-soft"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation={1.1} />
        </filter>
        <clipPath id="hbr-island">
          <path d={island} />
        </clipPath>
      </defs>

      {/* 2. Safe-harbor destination cue: calm green-cyan DASHED ring. The dash +
          breathing pulse is the non-colour signal; reduced motion holds it mid. */}
      <circle
        cx={x}
        cy={y}
        r={ringMid}
        fill="none"
        stroke="#7cf0c8"
        strokeWidth={2}
        strokeDasharray="4 5"
        strokeLinecap="round"
        opacity={0.45}
        style={{ mixBlendMode: 'screen' }}
      >
        {!reduceMotion && (
          <>
            <animate
              attributeName="r"
              values={`${ringMin};${ringMax};${ringMin}`}
              dur="3s"
              calcMode="spline"
              keyTimes="0;0.5;1"
              keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.7;0.15;0.7"
              dur="3s"
              calcMode="spline"
              keyTimes="0;0.5;1"
              keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
              repeatCount="indefinite"
            />
          </>
        )}
      </circle>

      {/* 3. Foam ring lapping the shoreline (softened) */}
      <circle
        cx={x}
        cy={y}
        r={r2(22 * scale)}
        fill="none"
        stroke="#eaf6ff"
        strokeOpacity={0.55}
        strokeWidth={2.4}
        strokeDasharray="3 4"
        strokeLinecap="round"
        filter="url(#hbr-soft)"
      />

      {/* 4. Rocky island body (irregular blob) + clipped top-down shading */}
      <path
        d={island}
        fill="url(#hbr-rock)"
        stroke="#1b1e26"
        strokeWidth={r2(1 * scale)}
        strokeLinejoin="round"
      />
      <g clipPath="url(#hbr-island)">
        {/* lit upper-left shoulder + shadowed lower-right flank for relief */}
        <ellipse
          cx={r2(x - 5.5 * scale)}
          cy={r2(y - 6.5 * scale)}
          rx={r2(15 * scale)}
          ry={r2(12 * scale)}
          fill="#727b8d"
          opacity={0.32}
        />
        <ellipse
          cx={r2(x + 7 * scale)}
          cy={r2(y + 8 * scale)}
          rx={r2(14 * scale)}
          ry={r2(12 * scale)}
          fill="#15171d"
          opacity={0.42}
        />
        {/* a few craggy rock fractures for top-down texture */}
        <g stroke="#1b1e26" strokeOpacity={0.55} strokeWidth={r2(0.6 * scale)} strokeLinecap="round" fill="none">
          <path d={`M ${r2(x - 10.5 * scale)} ${r2(y - 5 * scale)} L ${r2(x - 3.5 * scale)} ${r2(y - 8.5 * scale)}`} />
          <path d={`M ${r2(x + 5 * scale)} ${r2(y + 7.5 * scale)} L ${r2(x + 11 * scale)} ${r2(y + 2.5 * scale)}`} />
          <path d={`M ${r2(x - 7.5 * scale)} ${r2(y + 8.5 * scale)} L ${r2(x - 2.5 * scale)} ${r2(y + 4 * scale)}`} />
        </g>
      </g>

      {/* 5. Lighthouse (top-down): warm radial glow over concentric gallery /
          tower wall / pulsing lamp core. The glow is the warm "source" cue. */}
      <circle
        cx={x}
        cy={y}
        r={r2(26 * scale)}
        fill="url(#hbr-lamp)"
        opacity={arrived ? 1 : 0.85}
        style={{ mixBlendMode: 'screen' }}
      />
      {arrived && (
        <circle
          cx={x}
          cy={y}
          r={r2(13 * scale)}
          fill="url(#hbr-lamp)"
          opacity={0.9}
          style={{ mixBlendMode: 'screen' }}
        />
      )}
      <circle cx={x} cy={y} r={r2(9 * scale)} fill="#e7e9ef" stroke="#aeb6c4" strokeWidth={r2(1 * scale)} />
      <circle cx={x} cy={y} r={r2(6 * scale)} fill="#cfd5e0" />
      <circle cx={x} cy={y} r={coreR} fill={arrived ? '#fffdf3' : '#fff6da'}>
        {!reduceMotion && (
          <animate
            attributeName="r"
            values={corePulse}
            dur="2.2s"
            calcMode="spline"
            keyTimes="0;0.5;1"
            keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
            repeatCount="indefinite"
          />
        )}
      </circle>

      {/* 6. Arrived: steady, slightly larger bright ring confirming the harbor is
          reached. Static by design, so it reads identically under reduced motion. */}
      {arrived && (
        <circle
          cx={x}
          cy={y}
          r={arrivedRing}
          fill="none"
          stroke="#aef7df"
          strokeWidth={r2(2.5 * scale)}
          opacity={0.9}
          style={{ mixBlendMode: 'screen' }}
        />
      )}
    </>
  )
}
