interface SeaTopDownProps {
  size?: number
  homeX?: number
  homeY?: number
  reduceMotion?: boolean
}

// Bird's-eye moonlit sea drawn as a background fragment inside a parent SVG
// (viewBox "0 0 264 264", y-down). Returns <defs> + elements only — no wrapping <svg>.
export function SeaTopDown({
  size = 264,
  homeX = 47.2,
  homeY = 216.8,
  reduceMotion = false,
}: SeaTopDownProps) {
  return (
    <>
      <defs>
        {/* Depth falloff: shallow turquoise hugging the island, deepening to the far corner. */}
        <radialGradient id="tds-depth" gradientUnits="userSpaceOnUse" cx={homeX} cy={homeY} r={300}>
          <stop offset="0%" stopColor="#236d86" />
          <stop offset="22%" stopColor="#143a5c" />
          <stop offset="55%" stopColor="#0b1d38" />
          <stop offset="100%" stopColor="#060e1f" />
        </radialGradient>

        {/* Moonlit glitter patch, set opposite the lighthouse and flattened into the water plane. */}
        <radialGradient
          id="tds-sheen"
          gradientUnits="userSpaceOnUse"
          cx={186}
          cy={74}
          r={150}
          gradientTransform="rotate(-28 186 74) scale(1 0.5)"
        >
          <stop offset="0%" stopColor="#cfe0ff" stopOpacity={0.4} />
          <stop offset="45%" stopColor="#9db8e8" stopOpacity={0.14} />
          <stop offset="100%" stopColor="#9db8e8" stopOpacity={0} />
        </radialGradient>

        {/* Caustics confined to a band; animate the seed (cheap) rather than baseFrequency (re-tiles every frame). */}
        <filter
          id="tds-caustics"
          filterUnits="userSpaceOnUse"
          x={0}
          y={40}
          width={size}
          height={150}
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.014 0.022"
            numOctaves="2"
            seed="7"
            result="noise"
          >
            {!reduceMotion && (
              <animate
                attributeName="seed"
                dur="16s"
                values="7;9;11;9;7"
                repeatCount="indefinite"
              />
            )}
          </feTurbulence>
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0.50  0 0 0 0 0.66  0 0 0 0 0.85  1.35 0 0 0 -0.78"
            result="veins"
          />
          <feGaussianBlur in="veins" stdDeviation="0.5" />
        </filter>
      </defs>

      {/* Base water */}
      <rect x={0} y={0} width={size} height={size} fill="url(#tds-depth)" />

      {/* Caustics — gated off under reduced motion (feTurbulence is costly in Safari). */}
      {!reduceMotion && (
        <rect
          x={0}
          y={40}
          width={size}
          height={150}
          fill="#bfe3f0"
          opacity={0.2}
          filter="url(#tds-caustics)"
          style={{ mixBlendMode: 'screen' }}
        />
      )}

      {/* Moon sheen */}
      <rect
        x={0}
        y={0}
        width={size}
        height={size}
        fill="url(#tds-sheen)"
        style={{ mixBlendMode: 'screen' }}
      />
    </>
  )
}
