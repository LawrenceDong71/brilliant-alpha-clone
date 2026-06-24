import { useEffect, useMemo, useState } from 'react'
import type { GridShapeStep as GStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'

const VB = 300
const PAD = 22

interface Edge {
  key: string
  x1: number
  y1: number
  x2: number
  y2: number
}

/**
 * Perimeter activity themed as fencing a real garden. The learner taps each
 * boundary edge of the plot to raise a wooden fence panel; the step is solved
 * only when every boundary edge has been fenced.
 */
export function GardenFenceGrid({ step, setChecker, locked }: InteractiveStepProps<GStep>) {
  const { cols, rows, cells } = step

  const S = (VB - 2 * PAD) / Math.max(cols, rows)
  const offX = PAD + (VB - 2 * PAD - cols * S) / 2
  const offY = PAD + (VB - 2 * PAD - rows * S) / 2

  // Cell top-left in SVG space (row 0 sits at the bottom).
  const gx = (c: number) => offX + c * S
  const gy = (r: number) => offY + (rows - 1 - r) * S
  // Grid-corner coordinate -> SVG pixel (corner y measured from the bottom).
  const px = (x: number) => offX + x * S
  const py = (y: number) => offY + (rows - y) * S

  const cellSet = useMemo(() => new Set(cells.map(([c, r]) => `${c},${r}`)), [cells])

  // Boundary edges: an edge whose neighbour across it is outside the region.
  const edges = useMemo<Edge[]>(() => {
    const out: Edge[] = []
    for (const [c, r] of cells) {
      if (!cellSet.has(`${c},${r - 1}`)) out.push({ key: `b${c},${r}`, x1: c, y1: r, x2: c + 1, y2: r })
      if (!cellSet.has(`${c},${r + 1}`)) out.push({ key: `t${c},${r}`, x1: c, y1: r + 1, x2: c + 1, y2: r + 1 })
      if (!cellSet.has(`${c - 1},${r}`)) out.push({ key: `l${c},${r}`, x1: c, y1: r, x2: c, y2: r + 1 })
      if (!cellSet.has(`${c + 1},${r}`)) out.push({ key: `r${c},${r}`, x1: c + 1, y1: r, x2: c + 1, y2: r + 1 })
    }
    return out
  }, [cells, cellSet])

  const [fenced, setFenced] = useState<Set<string>>(new Set())

  useEffect(() => {
    setChecker(() => fenced.size === edges.length)
  }, [fenced, edges, setChecker])

  const toggle = (key: string) => {
    if (locked) return
    setFenced((prev) => {
      const n = new Set(prev)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })
  }

  // A single shared post sits at every lattice corner touched by a fenced edge,
  // so runs join cleanly instead of stacking a post at each segment end.
  const posts = useMemo(() => {
    const seen = new Map<string, { x: number; y: number }>()
    for (const e of edges) {
      if (!fenced.has(e.key)) continue
      seen.set(`${e.x1},${e.y1}`, { x: e.x1, y: e.y1 })
      seen.set(`${e.x2},${e.y2}`, { x: e.x2, y: e.y2 })
    }
    return [...seen.values()]
  }, [edges, fenced])

  return (
    <div className="interactive">
      <p className="sort-help">
        {step.instruction ?? 'Tap every edge around the garden to put up the fence.'}
      </p>

      <svg viewBox={`0 0 ${VB} ${VB}`} className="interactive-svg" style={{ touchAction: 'none' }}>
        <defs>
          {/* Lush lawn */}
          <linearGradient id="gf-grass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7cc05a" />
            <stop offset="0.55" stopColor="#5fae45" />
            <stop offset="1" stopColor="#4c9a39" />
          </linearGradient>
          <radialGradient id="gf-grass-glow" cx="0.5" cy="0.35" r="0.85">
            <stop offset="0" stopColor="#9fd97c" stopOpacity="0.85" />
            <stop offset="1" stopColor="#9fd97c" stopOpacity="0" />
          </radialGradient>
          {/* Tilled soil for garden beds */}
          <linearGradient id="gf-soil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7a5230" />
            <stop offset="1" stopColor="#5b3a1f" />
          </linearGradient>
          {/* Rounded wooden picket */}
          <linearGradient id="gf-wood" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#74471f" />
            <stop offset="0.45" stopColor="#c1873f" />
            <stop offset="0.6" stopColor="#b27a36" />
            <stop offset="1" stopColor="#6d3f1b" />
          </linearGradient>
          {/* Darker corner posts */}
          <linearGradient id="gf-post" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#5d3717" />
            <stop offset="0.5" stopColor="#9a6730" />
            <stop offset="1" stopColor="#4f2e12" />
          </linearGradient>
          {/* Horizontal rails tying pickets together */}
          <linearGradient id="gf-rail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a06c34" />
            <stop offset="1" stopColor="#6f451f" />
          </linearGradient>
          <filter id="gf-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.1" floodColor="#000" floodOpacity="0.28" />
          </filter>
        </defs>

        {/* Lawn + garden plantings inside the plot */}
        {cells.map(([c, r]) => (
          <Cell key={`cell-${c},${r}`} c={c} r={r} x={gx(c)} y={gy(r)} s={S} />
        ))}

        {/* Faint cell guides so "1 square = 1 unit" reads clearly */}
        {cells.map(([c, r]) => (
          <rect
            key={`grid-${c},${r}`}
            x={gx(c)}
            y={gy(r)}
            width={S}
            height={S}
            fill="none"
            stroke="#3f7e2e"
            strokeOpacity={0.28}
            strokeWidth={1}
            pointerEvents="none"
          />
        ))}

        {/* Fence visuals: ghost guides for open edges, panels for fenced edges */}
        {edges.map((e) => {
          const isFenced = fenced.has(e.key)
          const horiz = e.y1 === e.y2
          const ox = px(e.x1)
          const oy = py(Math.min(e.y1, e.y2))
          const angle = horiz ? 0 : -90
          if (!isFenced) {
            return (
              <g key={`ghost-${e.key}`} transform={`translate(${ox} ${oy}) rotate(${angle})`} pointerEvents="none">
                <line x1={3} y1={0} x2={S - 3} y2={0} stroke="#3a2a17" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="5 5" strokeLinecap="round" />
                <circle cx={2} cy={0} r={2.4} fill="#6d4a26" opacity={0.55} />
                <circle cx={S - 2} cy={0} r={2.4} fill="#6d4a26" opacity={0.55} />
              </g>
            )
          }
          return (
            <g
              key={`panel-${e.key}`}
              transform={`translate(${ox} ${oy}) rotate(${angle})`}
              pointerEvents="none"
            >
              <FencePanel len={S} />
            </g>
          )
        })}

        {/* Shared corner posts drawn once on top of the picket runs */}
        {posts.map((p) => (
          <FencePost key={`post-${p.x},${p.y}`} cx={px(p.x)} cy={py(p.y)} s={S} />
        ))}

        {/* Generous transparent hit targets on top so edges are easy to tap */}
        {edges.map((e) => (
          <line
            key={`hit-${e.key}`}
            x1={px(e.x1)}
            y1={py(e.y1)}
            x2={px(e.x2)}
            y2={py(e.y2)}
            stroke="transparent"
            strokeWidth={16}
            strokeLinecap="round"
            style={{ cursor: locked ? 'default' : 'pointer' }}
            onClick={() => toggle(e.key)}
          />
        ))}
      </svg>

      <div className="readout small">
        <span>Fence panels: {fenced.size} / {edges.length}</span>
        <span style={{ color: 'var(--muted)', fontWeight: 500 }}>1 square = 1 unit</span>
      </div>

      <button
        type="button"
        className="btn ghost full"
        disabled={locked || fenced.size === 0}
        onClick={() => setFenced(new Set())}
      >
        Start over
      </button>
    </div>
  )
}

/** Lawn tile plus a small, deterministic planting (flowers / veggies / shrub). */
function Cell({ c, r, x, y, s }: { c: number; r: number; x: number; y: number; s: number }) {
  const cx = x + s / 2
  const cy = y + s / 2
  const motif = (c * 3 + r * 5) % 3
  return (
    <g>
      <rect x={x} y={y} width={s} height={s} fill="url(#gf-grass)" />
      <rect x={x} y={y} width={s} height={s} fill="url(#gf-grass-glow)" />
      <GrassBlades cx={cx} cy={cy} s={s} seed={c * 7 + r * 13} />
      {motif === 0 && <FlowerBed cx={cx} cy={cy} s={s} />}
      {motif === 1 && <VeggieRows cx={cx} cy={cy} s={s} />}
      {motif === 2 && <Shrub cx={cx} cy={cy} s={s} />}
    </g>
  )
}

/** A handful of small grass tufts scattered to add lawn texture. */
function GrassBlades({ cx, cy, s, seed }: { cx: number; cy: number; s: number; seed: number }) {
  const rnd = (n: number) => {
    const v = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453
    return v - Math.floor(v)
  }
  const tufts = [0, 1, 2, 3].map((i) => {
    const tx = cx + (rnd(i) - 0.5) * s * 0.8
    const ty = cy + (rnd(i + 10) - 0.5) * s * 0.8
    const h = s * (0.1 + rnd(i + 20) * 0.06)
    return (
      <g key={i} stroke="#3f8a2c" strokeWidth={1.1} strokeLinecap="round" opacity={0.55}>
        <line x1={tx} y1={ty} x2={tx - h * 0.4} y2={ty - h} />
        <line x1={tx} y1={ty} x2={tx} y2={ty - h * 1.15} />
        <line x1={tx} y1={ty} x2={tx + h * 0.4} y2={ty - h} />
      </g>
    )
  })
  return <>{tufts}</>
}

const FLOWER_COLORS = ['#ff5d8f', '#ffd23f', '#ff8c42']

/** Soil patch with a few simple petalled flowers. */
function FlowerBed({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const flowers = [-1, 0, 1]
  return (
    <g>
      <ellipse cx={cx} cy={cy + s * 0.22} rx={s * 0.38} ry={s * 0.16} fill="url(#gf-soil)" />
      {flowers.map((d, i) => {
        const fx = cx + d * s * 0.24
        const baseY = cy + s * 0.2
        const topY = cy - s * 0.16 + Math.abs(d) * s * 0.05
        const color = FLOWER_COLORS[i % FLOWER_COLORS.length]
        const pr = s * 0.07
        return (
          <g key={i}>
            <line x1={fx} y1={baseY} x2={fx} y2={topY} stroke="#2f7a23" strokeWidth={1.6} strokeLinecap="round" />
            {[0, 72, 144, 216, 288].map((a) => {
              const rad = (a * Math.PI) / 180
              return (
                <circle key={a} cx={fx + Math.cos(rad) * pr} cy={topY + Math.sin(rad) * pr} r={pr * 0.85} fill={color} />
              )
            })}
            <circle cx={fx} cy={topY} r={pr * 0.7} fill="#ffe9a8" />
          </g>
        )
      })}
    </g>
  )
}

/** Rows of leafy vegetables planted in tilled soil. */
function VeggieRows({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const rows = [-0.22, 0.02, 0.26]
  return (
    <g>
      <rect x={cx - s * 0.4} y={cy - s * 0.34} width={s * 0.8} height={s * 0.68} rx={s * 0.06} fill="url(#gf-soil)" />
      {rows.map((ry, ri) => (
        <g key={ri}>
          {[-0.26, 0, 0.26].map((dx, ci) => {
            const vx = cx + dx * s
            const vy = cy + ry * s
            const lr = s * 0.075
            return (
              <g key={ci}>
                <circle cx={vx - lr * 0.7} cy={vy} r={lr} fill="#3f9a36" />
                <circle cx={vx + lr * 0.7} cy={vy} r={lr} fill="#4fb045" />
                <circle cx={vx} cy={vy - lr * 0.6} r={lr} fill="#62c356" />
              </g>
            )
          })}
        </g>
      ))}
    </g>
  )
}

/** A rounded leafy shrub dotted with berries. */
function Shrub({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const lobes = [
    [-0.2, 0.05, 0.24],
    [0.2, 0.05, 0.24],
    [0, -0.12, 0.28],
    [0, 0.16, 0.22],
  ]
  const greens = ['#2e8b3a', '#3aa047', '#46b554']
  return (
    <g filter="url(#gf-soft)">
      {lobes.map(([dx, dy, rr], i) => (
        <circle key={i} cx={cx + dx * s} cy={cy + dy * s} r={rr * s} fill={greens[i % greens.length]} />
      ))}
      {[-0.12, 0.1, -0.02, 0.16].map((dx, i) => (
        <circle key={`berry-${i}`} cx={cx + dx * s} cy={cy + (i % 2 === 0 ? -0.05 : 0.1) * s} r={s * 0.045} fill="#e23b4e" />
      ))}
    </g>
  )
}

/**
 * A wooden picket-fence run drawn in local coordinates: the run goes along +x
 * from 0 to `len`, centred on the boundary line, with evenly spaced pointed
 * pickets tied by two thin rails. Posts are drawn separately at shared corners.
 */
function FencePanel({ len }: { len: number }) {
  const ph = len * 0.4 // picket height
  const pw = len * 0.1 // picket width
  const tip = pw * 0.85
  const half = ph / 2
  const count = 4
  // Inset the run slightly so pickets never collide with the corner posts.
  const inset = len * 0.1
  const span = len - inset * 2
  const pickets: number[] = []
  for (let i = 0; i < count; i++) pickets.push(inset + ((i + 0.5) / count) * span)

  const picketPath = (xi: number) =>
    `M ${xi - pw / 2} ${half} ` +
    `L ${xi - pw / 2} ${-half + tip} ` +
    `L ${xi} ${-half} ` +
    `L ${xi + pw / 2} ${-half + tip} ` +
    `L ${xi + pw / 2} ${half} Z`

  return (
    <g filter="url(#gf-soft)">
      {/* Two rails spanning the run behind the pickets */}
      <rect x={inset * 0.4} y={-half * 0.5 - 1} width={len - inset * 0.8} height={2.2} rx={1.1} fill="url(#gf-rail)" />
      <rect x={inset * 0.4} y={half * 0.55 - 1} width={len - inset * 0.8} height={2.2} rx={1.1} fill="url(#gf-rail)" />
      {/* Pickets */}
      {pickets.map((xi, i) => (
        <path key={i} d={picketPath(xi)} fill="url(#gf-wood)" stroke="#4f2e12" strokeWidth={0.4} />
      ))}
    </g>
  )
}

/** A single rounded wooden post that joins fence runs at a shared corner. */
function FencePost({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const r = s * 0.085
  return (
    <g filter="url(#gf-soft)">
      <circle cx={cx} cy={cy} r={r} fill="url(#gf-post)" stroke="#3a2410" strokeWidth={0.6} />
      <circle cx={cx - r * 0.25} cy={cy - r * 0.3} r={r * 0.45} fill="#c08a4a" opacity={0.55} />
    </g>
  )
}
