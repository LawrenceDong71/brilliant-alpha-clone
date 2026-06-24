import { useEffect, useMemo, useState } from 'react'
import type { GridShapeStep as GStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'

const VB = 300
const PAD = 18
/** Vertical space reserved at the top for the hint of cabinetry / toe-kick. */
const CABINET = 30

/** Warm ceramic/travertine tone variants — chosen deterministically per tile. */
const TILE_VARIANTS = ['kf-tile-a', 'kf-tile-b', 'kf-tile-c'] as const

/**
 * "Tile the kitchen floor" — the learner taps each bare patch of subfloor to
 * lay a 1×1 ceramic tile. The step is solved once every cell in `step.cells`
 * is tiled. Renders an arbitrary set of cells (full rectangle for the kitchen,
 * or an L-shaped room elsewhere in the lesson), so only the cells in `cells`
 * are ever drawn or made tappable.
 */
export function KitchenFloorGrid({ step, setChecker, locked }: InteractiveStepProps<GStep>) {
  const { cols, rows, cells } = step

  // Cell size + centering, leaving room up top for the cabinet band.
  const availW = VB - 2 * PAD
  const availH = VB - 2 * PAD - CABINET
  const S = Math.min(availW / cols, availH / rows)
  const offX = (VB - cols * S) / 2
  const offY = PAD + CABINET + (availH - rows * S) / 2

  const gx = (c: number) => offX + c * S
  // Row 0 is at the BOTTOM of the room.
  const gy = (r: number) => offY + (rows - 1 - r) * S

  const region = useMemo(() => new Set(cells.map(([c, r]) => `${c},${r}`)), [cells])

  const [filled, setFilled] = useState<Set<string>>(new Set())

  // Solved only when every cell of the region has been tiled.
  useEffect(() => {
    setChecker(() => filled.size === region.size && [...region].every((k) => filled.has(k)))
  }, [filled, region, setChecker])

  const toggle = (c: number, r: number) => {
    if (locked) return
    const k = `${c},${r}`
    if (!region.has(k)) return
    setFilled((prev) => {
      const n = new Set(prev)
      if (n.has(k)) n.delete(k)
      else n.add(k)
      return n
    })
  }

  // Floor bounding box (for ambient shadow / vignette overlays).
  const fx = offX
  const fy = offY
  const fw = cols * S
  const fh = rows * S

  const gap = Math.max(1.4, S * 0.05)

  return (
    <div className="interactive">
      <div className="readout small">
        Tiles placed: {filled.size} / {region.size}
        <span style={{ color: 'var(--muted)', marginLeft: 8 }}>· 1 square = 1 unit</span>
      </div>
      <p className="sort-help">
        {step.instruction ?? 'Tap each bare square to lay a tile until the whole floor is covered.'}
      </p>

      <svg viewBox={`0 0 ${VB} ${VB}`} className="interactive-svg" style={{ touchAction: 'none' }}>
        <defs>
          {/* Warm ambient room lighting. */}
          <radialGradient id="kf-room" cx="50%" cy="34%" r="78%">
            <stop offset="0%" stopColor="#fbf6ec" />
            <stop offset="60%" stopColor="#f0e6d6" />
            <stop offset="100%" stopColor="#e3d4bd" />
          </radialGradient>

          {/* Cool grey screed for untiled subfloor. */}
          <linearGradient id="kf-screed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c2bfb6" />
            <stop offset="100%" stopColor="#a8a59c" />
          </linearGradient>

          {/* Ceramic / travertine tile tone variants. */}
          <linearGradient id="kf-tile-a" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f4ecdb" />
            <stop offset="100%" stopColor="#ddd0b6" />
          </linearGradient>
          <linearGradient id="kf-tile-b" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#efe6d2" />
            <stop offset="100%" stopColor="#d4c6a8" />
          </linearGradient>
          <linearGradient id="kf-tile-c" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f7f1e3" />
            <stop offset="100%" stopColor="#e3d7bf" />
          </linearGradient>

          {/* Glossy top-left sheen laid over each finished tile. */}
          <linearGradient id="kf-sheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="38%" stopColor="#ffffff" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Wood cabinetry along the top wall. */}
          <linearGradient id="kf-cabinet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a9794f" />
            <stop offset="55%" stopColor="#946a45" />
            <stop offset="100%" stopColor="#6f4e31" />
          </linearGradient>

          {/* Soft contact shadow the cabinets cast onto the floor. */}
          <linearGradient id="kf-cabshadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>

          {/* Vignette to ground the room and add depth at the edges. */}
          <radialGradient id="kf-vignette" cx="50%" cy="46%" r="72%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="78%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#3a2a18" stopOpacity="0.26" />
          </radialGradient>

          <filter id="kf-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.1" />
          </filter>
        </defs>

        {/* Room backdrop */}
        <rect x="0" y="0" width={VB} height={VB} fill="url(#kf-room)" />

        {/* A hint of cabinetry / counter along the top, spanning the floor. */}
        <g>
          <rect
            x={fx - gap}
            y={PAD - 2}
            width={fw + gap * 2}
            height={CABINET}
            rx={3}
            fill="url(#kf-cabinet)"
          />
          {/* counter lip highlight */}
          <rect x={fx - gap} y={PAD - 2} width={fw + gap * 2} height={3} rx={2} fill="#c79a6c" opacity={0.8} />
          {/* toe-kick recess at the cabinet base */}
          <rect x={fx - gap + 4} y={PAD - 2 + CABINET - 6} width={fw + gap * 2 - 8} height={6} fill="#3c2a1a" opacity={0.85} />
        </g>

        {/* Floor cells */}
        {cells.map(([c, r]) => {
          const k = `${c},${r}`
          const isFilled = filled.has(k)
          const x = gx(c)
          const y = gy(r)
          const ix = x + gap / 2
          const iy = y + gap / 2
          const iw = S - gap
          const ih = S - gap
          const variant = TILE_VARIANTS[(Math.abs(c * 31 + r * 17)) % TILE_VARIANTS.length]
          return (
            <g key={k}>
              {/* Grout bed shows through the gaps between tiles. */}
              <rect x={x} y={y} width={S} height={S} fill="#8b8474" />

              {isFilled ? (
                <>
                  <rect
                    x={ix}
                    y={iy}
                    width={iw}
                    height={ih}
                    rx={2}
                    fill={`url(#${variant})`}
                    style={{ transition: 'fill 160ms ease' }}
                  />
                  {/* bevel: lighter top/left edge */}
                  <rect x={ix} y={iy} width={iw} height={ih} rx={2} fill="none" stroke="#fffaf0" strokeOpacity={0.55} strokeWidth={0.8} />
                  {/* glossy sheen */}
                  <rect x={ix} y={iy} width={iw} height={ih} rx={2} fill="url(#kf-sheen)" pointerEvents="none" />
                </>
              ) : (
                <>
                  <rect x={ix} y={iy} width={iw} height={ih} rx={1.5} fill="url(#kf-screed)" />
                  {/* dashed "drop a tile here" invitation */}
                  <rect
                    x={ix + 2}
                    y={iy + 2}
                    width={iw - 4}
                    height={ih - 4}
                    rx={1.5}
                    fill="none"
                    stroke="var(--accent)"
                    strokeOpacity={0.5}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    pointerEvents="none"
                  />
                </>
              )}

              {/* Transparent hit target on top so taps always register. */}
              <rect
                x={x}
                y={y}
                width={S}
                height={S}
                fill="transparent"
                style={{ cursor: locked ? 'default' : 'pointer' }}
                onClick={() => toggle(c, r)}
              />
            </g>
          )
        })}

        {/* Cabinet contact shadow dropped onto the floor. */}
        <rect
          x={fx}
          y={fy}
          width={fw}
          height={Math.min(fh, S * 0.6)}
          fill="url(#kf-cabshadow)"
          filter="url(#kf-soft)"
          pointerEvents="none"
        />

        {/* Whole-room vignette for depth. */}
        <rect x="0" y="0" width={VB} height={VB} fill="url(#kf-vignette)" pointerEvents="none" />
      </svg>

      <button
        type="button"
        className="btn ghost full"
        disabled={locked || filled.size === 0}
        onClick={() => setFilled(new Set())}
      >
        Start over
      </button>
    </div>
  )
}
