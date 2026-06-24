interface BoatProps {
  x: number
  y: number
  heading: number // deg CCW, 0 = east (bow / travel direction)
  moving?: boolean
  illuminated?: boolean
  spotId?: number
  arrived?: boolean
  scale?: number
  reduceMotion?: boolean
}

// Art is authored in LOCAL coords with the BOW at +x (east) and the centre near
// (0,0); y is DOWN. The group rotates by -heading (heading is math CCW y-up while
// SVG y is down), so heading 0 -> bow east, heading 90 -> bow toward screen-up.
// The wake trails behind the stern toward LOCAL -x.
const HULL = 'M -8 -3 Q 0 -4.6 9 0 Q 0 4.6 -8 3 Z'
const SEAM = 'M -6 0 L 7 0'
const WAKE_FILL = 'M -8 -2.8 L -22 -8.5 L -22 8.5 L -8 2.8 Z'
const WAKE_PORT = 'M -8 -2.8 L -22 -8.5'
const WAKE_STBD = 'M -8 2.8 L -22 8.5'
const CHECK = 'M 6.3 -12.1 L 7.3 -11 L 9.6 -13.7'

export function Boat({
  x,
  y,
  heading,
  moving = false,
  illuminated = false,
  spotId = 0,
  arrived = false,
  scale = 1,
  reduceMotion = false,
}: BoatProps) {
  const fade = (visible: boolean, ms: number, extra?: number) => ({
    opacity: visible ? (extra ?? 1) : 0,
    transition: `opacity ${ms}ms ease`,
  })

  return (
    <>
      <defs>
        <filter
          id="bt-halo"
          x="-80%"
          y="-80%"
          width="260%"
          height="260%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <g transform={`translate(${x} ${y}) rotate(${-heading}) scale(${scale})`}>
        {/* WAKE: soft V fanning back from the stern (-x); brighter while moving */}
        <g style={fade(moving, 200, 0.34)}>
          <path d={WAKE_FILL} fill="#d8ecff" opacity={0.7} />
          <path d={WAKE_PORT} fill="none" stroke="#ffffff" strokeWidth={1} strokeLinecap="round" />
          <path d={WAKE_STBD} fill="none" stroke="#ffffff" strokeWidth={1} strokeLinecap="round" />
        </g>

        {/* FOUND glow / warm halo under the hull (illuminated) */}
        <ellipse
          cx={0}
          cy={0}
          rx={15}
          ry={9}
          fill="#ffd98a"
          filter="url(#bt-halo)"
          style={{ ...fade(illuminated, 220, 0.5), mixBlendMode: 'screen' }}
        />

        {/* HULL: drifting/dim base, with a warm lit version cross-fading on top */}
        <path d={HULL} fill="#51607c" stroke="#2a3247" strokeWidth={1} strokeLinejoin="round" />
        <g style={fade(illuminated, 220)}>
          <path d={HULL} fill="#e8d3a0" stroke="#fff6df" strokeWidth={1} strokeLinejoin="round" />
        </g>

        {/* DECK detail: centre seam + cockpit dot (dim base + warm cross-fade) */}
        <g fill="#6b7c9c" stroke="#6b7c9c">
          <path d={SEAM} fill="none" strokeWidth={0.8} strokeLinecap="round" />
          <circle cx={-3} cy={0} r={1.5} stroke="none" />
        </g>
        <g fill="#fff0c8" stroke="#fff0c8" style={fade(illuminated, 220)}>
          <path d={SEAM} fill="none" strokeWidth={0.8} strokeLinecap="round" />
          <circle cx={-3} cy={0} r={1.5} stroke="none" />
        </g>

        {/* STALLED cue: dashed adrift ring above the boat (shape, not colour) */}
        {!moving && !arrived && (
          <circle
            cx={0}
            cy={-12}
            r={4}
            fill="none"
            stroke="#cdddf2"
            strokeWidth={1}
            strokeDasharray="2 3"
          />
        )}

        {/* ARRIVED: docked success badge (white casing + good disc + white check) */}
        {arrived && (
          <g>
            <circle cx={8} cy={-12} r={4.5} fill="#ffffff" opacity={0.9} />
            <circle cx={8} cy={-12} r={3.6} fill="var(--good)" />
            <path
              d={CHECK}
              fill="none"
              stroke="#ffffff"
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}
      </g>

      {/* SPOTTED ripple ping: drawn UN-rotated at (x,y) so rings stay circular.
          Keyed by spotId so a new spotting remounts and replays the SMIL. */}
      {illuminated &&
        (reduceMotion ? (
          <circle cx={x} cy={y} r={12} fill="none" stroke="#ffe6b0" strokeWidth={1.2} opacity={0.3} />
        ) : (
          <g key={spotId} fill="none" stroke="#ffe6b0" strokeWidth={1.4}>
            <circle cx={x} cy={y} opacity={0}>
              <animate attributeName="r" values="5;22" dur="1.3s" begin="0s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0" dur="1.3s" begin="0s" repeatCount="indefinite" />
            </circle>
            <circle cx={x} cy={y} opacity={0}>
              <animate attributeName="r" values="5;22" dur="1.3s" begin="0.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0" dur="1.3s" begin="0.4s" repeatCount="indefinite" />
            </circle>
          </g>
        ))}
    </>
  )
}
