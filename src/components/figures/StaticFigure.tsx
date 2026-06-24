import type { Figure, Point } from '../../content/types'

const STROKE = 'var(--fig-stroke)'
const ACCENT = 'var(--accent)'

function AngleFigure({ degrees }: { degrees: number }) {
  const v = { x: 45, y: 130 }
  const r = 110
  const rad = (degrees * Math.PI) / 180
  const end1 = { x: v.x + r, y: v.y }
  const end2 = { x: v.x + r * Math.cos(rad), y: v.y - r * Math.sin(rad) }
  const arcR = 34
  const arc1 = { x: v.x + arcR, y: v.y }
  const arc2 = { x: v.x + arcR * Math.cos(rad), y: v.y - arcR * Math.sin(rad) }
  return (
    <svg viewBox="0 0 200 160" className="figure-svg" role="img" aria-label={`Angle of ${degrees} degrees`}>
      <line x1={v.x} y1={v.y} x2={end1.x} y2={end1.y} stroke={STROKE} strokeWidth={3} strokeLinecap="round" />
      <line x1={v.x} y1={v.y} x2={end2.x} y2={end2.y} stroke={ACCENT} strokeWidth={3} strokeLinecap="round" />
      <path d={`M ${arc1.x} ${arc1.y} A ${arcR} ${arcR} 0 0 0 ${arc2.x} ${arc2.y}`} fill="none" stroke={ACCENT} strokeWidth={2} />
      <text x={v.x + 46} y={v.y - 16} fontSize={15} fill="var(--text-h)">{degrees}°</text>
      <circle cx={v.x} cy={v.y} r={4} fill={STROKE} />
    </svg>
  )
}

function PointsLinesFigure() {
  return (
    <svg viewBox="0 0 220 170" className="figure-svg" role="img" aria-label="Point, line, ray and segment">
      <text x={6} y={24} fontSize={12} fill="var(--text)">Point</text>
      <circle cx={150} cy={20} r={5} fill={ACCENT} />

      <text x={6} y={64} fontSize={12} fill="var(--text)">Line</text>
      <line x1={70} y1={60} x2={210} y2={60} stroke={STROKE} strokeWidth={3} />
      <path d="M70 60 l8 -5 v10 z M210 60 l-8 -5 v10 z" fill={STROKE} />

      <text x={6} y={104} fontSize={12} fill="var(--text)">Ray</text>
      <line x1={70} y1={100} x2={210} y2={100} stroke={ACCENT} strokeWidth={3} />
      <circle cx={70} cy={100} r={4} fill={ACCENT} />
      <path d="M210 100 l-8 -5 v10 z" fill={ACCENT} />

      <text x={6} y={144} fontSize={12} fill="var(--text)">Segment</text>
      <line x1={70} y1={140} x2={190} y2={140} stroke={STROKE} strokeWidth={3} strokeLinecap="round" />
      <circle cx={70} cy={140} r={4} fill={STROKE} />
      <circle cx={190} cy={140} r={4} fill={STROKE} />
    </svg>
  )
}

function TriangleFigure() {
  const A = { x: 30, y: 140 }
  const B = { x: 180, y: 140 }
  const C = { x: 110, y: 30 }
  return (
    <svg viewBox="0 0 210 160" className="figure-svg" role="img" aria-label="Triangle">
      <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} fill="var(--accent-bg)" stroke={ACCENT} strokeWidth={3} strokeLinejoin="round" />
      <text x={A.x - 4} y={A.y + 16} fontSize={14} fill="var(--text-h)">A</text>
      <text x={B.x + 2} y={B.y + 16} fontSize={14} fill="var(--text-h)">B</text>
      <text x={C.x - 4} y={C.y - 8} fontSize={14} fill="var(--text-h)">C</text>
    </svg>
  )
}

function RightTriangleFigure({ a, b }: { a: number; b: number }) {
  const ox = 40
  const oy = 140
  const scale = Math.min(120 / Math.max(a, b), 26)
  const right = { x: ox, y: oy }
  const bottom = { x: ox + b * scale, y: oy }
  const top = { x: ox, y: oy - a * scale }
  return (
    <svg viewBox="0 0 220 170" className="figure-svg" role="img" aria-label="Right triangle">
      <polygon points={`${right.x},${right.y} ${bottom.x},${bottom.y} ${top.x},${top.y}`} fill="var(--accent-bg)" stroke={ACCENT} strokeWidth={3} strokeLinejoin="round" />
      <rect x={right.x} y={right.y - 14} width={14} height={14} fill="none" stroke={STROKE} strokeWidth={2} />
      <text x={(right.x + bottom.x) / 2 - 4} y={oy + 18} fontSize={13} fill="var(--text-h)">b = {b}</text>
      <text x={right.x - 34} y={(right.y + top.y) / 2} fontSize={13} fill="var(--text-h)">a = {a}</text>
      <text x={(bottom.x + top.x) / 2 + 6} y={(bottom.y + top.y) / 2 - 6} fontSize={13} fill={ACCENT}>c</text>
    </svg>
  )
}

function RectangleFigure({ w, h }: { w: number; h: number }) {
  const scale = Math.min(150 / w, 90 / h, 24)
  const rw = w * scale
  const rh = h * scale
  const x = (220 - rw) / 2
  const y = (150 - rh) / 2
  return (
    <svg viewBox="0 0 220 160" className="figure-svg" role="img" aria-label="Rectangle">
      <rect x={x} y={y} width={rw} height={rh} fill="var(--accent-bg)" stroke={ACCENT} strokeWidth={3} />
      <text x={x + rw / 2 - 10} y={y + rh + 18} fontSize={13} fill="var(--text-h)">{w}</text>
      <text x={x - 22} y={y + rh / 2 + 4} fontSize={13} fill="var(--text-h)">{h}</text>
    </svg>
  )
}

function ReflectionFigure() {
  return (
    <svg viewBox="0 0 220 160" className="figure-svg" role="img" aria-label="Reflection across a line">
      <line x1={110} y1={10} x2={110} y2={150} stroke={STROKE} strokeWidth={2} strokeDasharray="6 5" />
      <polygon points="40,120 90,120 65,60" fill="var(--accent-bg)" stroke={ACCENT} strokeWidth={2.5} strokeLinejoin="round" />
      <polygon points="180,120 130,120 155,60" fill="none" stroke={STROKE} strokeWidth={2.5} strokeDasharray="4 4" strokeLinejoin="round" />
    </svg>
  )
}

function ClockFigure({ hour, minute }: { hour: number; minute: number }) {
  const c = { x: 100, y: 100 }
  const minAngle = minute * 6
  const hourAngle = (hour % 12) * 30 + minute * 0.5
  const hand = (deg: number, len: number) => {
    const r = (deg * Math.PI) / 180
    return { x: c.x + len * Math.sin(r), y: c.y - len * Math.cos(r) }
  }
  const mh = hand(minAngle, 64)
  const hh = hand(hourAngle, 44)
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const r = (i * 30 * Math.PI) / 180
    return {
      x1: c.x + 72 * Math.sin(r),
      y1: c.y - 72 * Math.cos(r),
      x2: c.x + 80 * Math.sin(r),
      y2: c.y - 80 * Math.cos(r),
    }
  })
  return (
    <svg viewBox="0 0 200 200" className="figure-svg" role="img" aria-label={`Clock at ${hour}:${String(minute).padStart(2, '0')}`}>
      <circle cx={c.x} cy={c.y} r={86} fill="var(--card)" stroke="var(--fig-stroke)" strokeWidth={3} />
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="var(--fig-stroke)" strokeWidth={2} />
      ))}
      <line x1={c.x} y1={c.y} x2={hh.x} y2={hh.y} stroke="var(--text-h)" strokeWidth={5} strokeLinecap="round" />
      <line x1={c.x} y1={c.y} x2={mh.x} y2={mh.y} stroke="var(--accent)" strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={c.x} cy={c.y} r={5} fill="var(--text-h)" />
    </svg>
  )
}

function AnglesHookFigure() {
  return (
    <svg viewBox="0 0 270 150" className="figure-svg" role="img" aria-label="Angles in pizza, clocks and ramps">
      {/* Pizza slice */}
      <g transform="translate(46, 56)">
        <path d="M 0 44 L -30 -16 A 34 34 0 0 1 30 -16 Z" fill="#f3c24a" stroke="#c9842f" strokeWidth={3} strokeLinejoin="round" />
        <path d="M -30 -16 A 34 34 0 0 1 30 -16" fill="none" stroke="#c9842f" strokeWidth={5} strokeLinecap="round" />
        <circle cx={-9} cy={2} r={4} fill="#d6503f" />
        <circle cx={10} cy={-2} r={4} fill="#d6503f" />
        <circle cx={1} cy={-14} r={3.5} fill="#d6503f" />
        <path d="M -7.6 30.3 A 16 16 0 0 0 7.6 30.3" fill="none" stroke="var(--accent)" strokeWidth={2.5} />
        <text x={0} y={62} fontSize={11} fill="var(--text)" textAnchor="middle">pizza</text>
      </g>

      {/* Clock */}
      <g transform="translate(135, 60)">
        <circle cx={0} cy={0} r={30} fill="var(--card)" stroke="var(--fig-stroke)" strokeWidth={2.5} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 * Math.PI) / 180
          return <line key={i} x1={26 * Math.sin(a)} y1={-26 * Math.cos(a)} x2={30 * Math.sin(a)} y2={-30 * Math.cos(a)} stroke="var(--fig-stroke)" strokeWidth={1.5} />
        })}
        <line x1={0} y1={0} x2={-17} y2={-10} stroke="var(--text-h)" strokeWidth={3.5} strokeLinecap="round" />
        <line x1={0} y1={0} x2={17} y2={-10} stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" />
        <path d="M -10 -6 A 12 12 0 0 1 10 -6" fill="none" stroke="var(--accent)" strokeWidth={2.5} />
        <circle cx={0} cy={0} r={3} fill="var(--text-h)" />
        <text x={0} y={52} fontSize={11} fill="var(--text)" textAnchor="middle">clock</text>
      </g>

      {/* Skateboard ramp */}
      <g transform="translate(224, 60)">
        <line x1={-38} y1={32} x2={40} y2={32} stroke="var(--fig-stroke)" strokeWidth={2.5} strokeLinecap="round" />
        <path d="M -30 32 L 34 32 L 34 -20 Z" fill="var(--accent-bg)" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" />
        {/* skateboard on the slope */}
        <g transform="translate(2, 6) rotate(-39)">
          <rect x={-15} y={-4} width={30} height={4} rx={2} fill="#7a4a23" />
          <circle cx={-9} cy={2} r={2.6} fill="var(--text-h)" />
          <circle cx={9} cy={2} r={2.6} fill="var(--text-h)" />
        </g>
        <path d="M -12 32 A 18 18 0 0 0 -5.6 17.4" fill="none" stroke="var(--accent)" strokeWidth={2.5} />
        <text x={0} y={52} fontSize={11} fill="var(--text)" textAnchor="middle">ramp</text>
      </g>
    </svg>
  )
}

function TransformTrioFigure() {
  return (
    <svg viewBox="0 0 240 120" className="figure-svg" role="img" aria-label="Slide, flip and turn">
      {/* Slide */}
      <rect x={12} y={50} width={26} height={26} fill="var(--accent-bg)" stroke={ACCENT} strokeWidth={2} />
      <rect x={44} y={38} width={26} height={26} fill="none" stroke={STROKE} strokeWidth={2} strokeDasharray="4 4" />
      <path d="M30 64 L58 50" stroke={ACCENT} strokeWidth={2} markerEnd="url(#trio-arrow)" />
      <text x={40} y={92} fontSize={12} fill="var(--text)" textAnchor="middle">Slide</text>

      {/* Flip */}
      <line x1={120} y1={36} x2={120} y2={84} stroke={STROKE} strokeWidth={2} strokeDasharray="5 4" />
      <polygon points="98,74 116,74 107,46" fill="var(--accent-bg)" stroke={ACCENT} strokeWidth={2} strokeLinejoin="round" />
      <polygon points="142,74 124,74 133,46" fill="none" stroke={STROKE} strokeWidth={2} strokeDasharray="4 4" strokeLinejoin="round" />
      <text x={120} y={92} fontSize={12} fill="var(--text)" textAnchor="middle">Flip</text>

      {/* Turn */}
      <rect x={186} y={50} width={24} height={24} fill="var(--accent-bg)" stroke={ACCENT} strokeWidth={2} />
      <path d="M210 44 A 22 22 0 1 1 184 50" fill="none" stroke={ACCENT} strokeWidth={2} markerEnd="url(#trio-arrow)" />
      <text x={200} y={92} fontSize={12} fill="var(--text)" textAnchor="middle">Turn</text>

      <defs>
        <marker id="trio-arrow" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 z" fill={ACCENT} />
        </marker>
      </defs>
    </svg>
  )
}

function TranslationFigure() {
  return (
    <svg viewBox="0 0 220 150" className="figure-svg" role="img" aria-label="Translation slide">
      <polygon points="30,110 70,110 50,74" fill="var(--accent-bg)" stroke={ACCENT} strokeWidth={2.5} strokeLinejoin="round" />
      <polygon points="130,70 170,70 150,34" fill="none" stroke={STROKE} strokeWidth={2.5} strokeDasharray="5 4" strokeLinejoin="round" />
      <path d="M50 92 L150 52" stroke={ACCENT} strokeWidth={2.5} markerEnd="url(#tr-arrow)" />
      <text x={92} y={92} fontSize={12} fill="var(--text)">slide</text>
      <defs>
        <marker id="tr-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0 0 L7 3 L0 6 z" fill={ACCENT} />
        </marker>
      </defs>
    </svg>
  )
}

function RotationFigure() {
  const c = { x: 110, y: 120 }
  return (
    <svg viewBox="0 0 220 160" className="figure-svg" role="img" aria-label="Rotation about a point">
      {/* original arm */}
      <line x1={c.x} y1={c.y} x2={c.x + 70} y2={c.y} stroke={STROKE} strokeWidth={3} strokeLinecap="round" />
      <polygon points={`${c.x + 70},${c.y - 8} ${c.x + 86},${c.y} ${c.x + 70},${c.y + 8}`} fill="var(--accent-bg)" stroke={STROKE} strokeWidth={1.5} />
      {/* rotated arm (90° ccw) */}
      <line x1={c.x} y1={c.y} x2={c.x} y2={c.y - 70} stroke={ACCENT} strokeWidth={3} strokeLinecap="round" />
      <polygon points={`${c.x - 8},${c.y - 70} ${c.x},${c.y - 86} ${c.x + 8},${c.y - 70}`} fill="var(--accent)" />
      {/* turn arc */}
      <path d={`M ${c.x + 40} ${c.y} A 40 40 0 0 0 ${c.x} ${c.y - 40}`} fill="none" stroke={ACCENT} strokeWidth={2} markerEnd="url(#rot-arrow)" />
      <circle cx={c.x} cy={c.y} r={4.5} fill="var(--text-h)" />
      <text x={c.x + 8} y={c.y - 44} fontSize={12} fill="var(--text)">90°</text>
      <defs>
        <marker id="rot-arrow" markerWidth="9" markerHeight="9" refX="5" refY="3" orient="auto">
          <path d="M0 0 L7 3 L0 6 z" fill={ACCENT} />
        </marker>
      </defs>
    </svg>
  )
}

function SymmetryLinesFigure() {
  const x = 70
  const y = 30
  const s = 100
  return (
    <svg viewBox="0 0 220 160" className="figure-svg" role="img" aria-label="Lines of symmetry of a square">
      <rect x={x} y={y} width={s} height={s} fill="var(--accent-bg)" stroke={ACCENT} strokeWidth={3} />
      <line x1={x + s / 2} y1={y - 8} x2={x + s / 2} y2={y + s + 8} stroke={STROKE} strokeWidth={1.5} strokeDasharray="5 4" />
      <line x1={x - 8} y1={y + s / 2} x2={x + s + 8} y2={y + s / 2} stroke={STROKE} strokeWidth={1.5} strokeDasharray="5 4" />
      <line x1={x - 8} y1={y - 8} x2={x + s + 8} y2={y + s + 8} stroke={STROKE} strokeWidth={1.5} strokeDasharray="5 4" />
      <line x1={x + s + 8} y1={y - 8} x2={x - 8} y2={y + s + 8} stroke={STROKE} strokeWidth={1.5} strokeDasharray="5 4" />
    </svg>
  )
}

function RotationalSymmetryFigure() {
  const c = { x: 110, y: 80 }
  const blade = (deg: number, fill: string) => {
    const r = (deg * Math.PI) / 180
    const r2 = ((deg + 90) * Math.PI) / 180
    const tip = { x: c.x + 58 * Math.cos(r), y: c.y + 58 * Math.sin(r) }
    const side = { x: c.x + 30 * Math.cos(r2), y: c.y + 30 * Math.sin(r2) }
    return <polygon key={deg} points={`${c.x},${c.y} ${tip.x},${tip.y} ${side.x},${side.y}`} fill={fill} stroke={ACCENT} strokeWidth={1.5} strokeLinejoin="round" />
  }
  return (
    <svg viewBox="0 0 220 160" className="figure-svg" role="img" aria-label="Pinwheel with rotational symmetry">
      {[0, 90, 180, 270].map((d, i) => blade(d, i % 2 === 0 ? 'var(--accent)' : 'var(--accent-bg)'))}
      <path d="M 168 36 A 70 70 0 0 1 184 80" fill="none" stroke={STROKE} strokeWidth={2} markerEnd="url(#rs-arrow)" />
      <circle cx={c.x} cy={c.y} r={5} fill="var(--text-h)" />
      <defs>
        <marker id="rs-arrow" markerWidth="9" markerHeight="9" refX="5" refY="3" orient="auto">
          <path d="M0 0 L7 3 L0 6 z" fill={STROKE} />
        </marker>
      </defs>
    </svg>
  )
}

function PointDotFigure() {
  return (
    <svg viewBox="0 0 220 140" className="figure-svg" role="img" aria-label="A point">
      <line x1={60} y1={70} x2={160} y2={70} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 5" />
      <line x1={110} y1={30} x2={110} y2={110} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 5" />
      <circle cx={110} cy={70} r={7} fill={ACCENT} />
      <text x={120} y={62} fontSize={15} fill="var(--text-h)">A</text>
      <text x={110} y={130} fontSize={12} fill="var(--text)" textAnchor="middle">one exact location — no size</text>
    </svg>
  )
}

function PointsScatterFigure() {
  const dots = [
    { x: 30, y: 40, r: 4, c: STROKE },
    { x: 80, y: 95, r: 5, c: ACCENT },
    { x: 120, y: 30, r: 3.5, c: STROKE },
    { x: 160, y: 70, r: 5, c: ACCENT },
    { x: 195, y: 38, r: 4, c: STROKE },
    { x: 55, y: 62, r: 3.5, c: STROKE },
    { x: 185, y: 100, r: 4, c: ACCENT },
  ]
  return (
    <svg viewBox="0 0 220 130" className="figure-svg" role="img" aria-label="Many points">
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.c} />
      ))}
      <text x={110} y={122} fontSize={12} fill="var(--text)" textAnchor="middle">stars, pins, pixels — all points</text>
    </svg>
  )
}

function SegmentFigure() {
  return (
    <svg viewBox="0 0 220 130" className="figure-svg" role="img" aria-label="A segment">
      <line x1={45} y1={60} x2={175} y2={60} stroke={ACCENT} strokeWidth={3} strokeLinecap="round" />
      <circle cx={45} cy={60} r={5} fill={ACCENT} />
      <circle cx={175} cy={60} r={5} fill={ACCENT} />
      <text x={38} y={48} fontSize={14} fill="var(--text-h)">A</text>
      <text x={172} y={48} fontSize={14} fill="var(--text-h)">B</text>
      <text x={110} y={92} fontSize={12} fill="var(--text)" textAnchor="middle">two endpoints · fixed length</text>
    </svg>
  )
}

function RayFigure() {
  return (
    <svg viewBox="0 0 220 130" className="figure-svg" role="img" aria-label="A ray">
      <line x1={45} y1={60} x2={195} y2={60} stroke={ACCENT} strokeWidth={3} strokeLinecap="round" />
      <circle cx={45} cy={60} r={5} fill={ACCENT} />
      <path d="M195 60 l-10 -6 v12 z" fill={ACCENT} />
      <text x={38} y={48} fontSize={14} fill="var(--text-h)">A</text>
      <text x={110} y={92} fontSize={12} fill="var(--text)" textAnchor="middle">one endpoint · goes on forever →</text>
    </svg>
  )
}

function LineFigure() {
  return (
    <svg viewBox="0 0 220 130" className="figure-svg" role="img" aria-label="A line">
      <line x1={25} y1={60} x2={195} y2={60} stroke={STROKE} strokeWidth={3} />
      <path d="M25 60 l10 -6 v12 z" fill={STROKE} />
      <path d="M195 60 l-10 -6 v12 z" fill={STROKE} />
      <text x={110} y={92} fontSize={12} fill="var(--text)" textAnchor="middle">no endpoints · forever both ways</text>
    </svg>
  )
}

function TrussFigure() {
  // A bridge truss: top & bottom chords with a triangular web.
  const yTop = 50
  const yBot = 110
  const xs = [24, 76, 128, 180, 232]
  const top = xs.slice(1, -1).map((x) => ({ x, y: yTop }))
  const bot = xs.map((x) => ({ x, y: yBot }))
  const lines: Array<[Point, Point]> = []
  // bottom chord
  for (let i = 0; i < bot.length - 1; i++) lines.push([bot[i], bot[i + 1]])
  // top chord
  for (let i = 0; i < top.length - 1; i++) lines.push([top[i], top[i + 1]])
  // diagonals + verticals forming triangles
  lines.push([bot[0], top[0]])
  lines.push([top[0], bot[1]])
  lines.push([bot[1], top[1]])
  lines.push([top[1], bot[2]])
  lines.push([bot[2], top[2]])
  lines.push([top[2], bot[3]])
  lines.push([bot[3], top[2]])
  lines.push([bot[4], top[2]])
  return (
    <svg viewBox="0 0 256 150" className="figure-svg" role="img" aria-label="A bridge truss made of triangles">
      <polygon points={`${bot[0].x},${bot[0].y} ${bot[2].x},${bot[2].y} ${top[0].x},${top[0].y}`} fill="var(--accent-bg)" />
      <polygon points={`${top[0].x},${top[0].y} ${top[2].x},${top[2].y} ${bot[2].x},${bot[2].y}`} fill="var(--accent-bg)" />
      <polygon points={`${bot[2].x},${bot[2].y} ${bot[4].x},${bot[4].y} ${top[2].x},${top[2].y}`} fill="var(--accent-bg)" />
      {lines.map(([p, q], i) => (
        <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" />
      ))}
      {[...top, ...bot].map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--text-h)" />
      ))}
      <text x={128} y={138} fontSize={12} fill="var(--text)" textAnchor="middle">triangles never wobble</text>
    </svg>
  )
}

function TriangleAnglesFigure() {
  const A = { x: 32, y: 132 }
  const B = { x: 190, y: 132 }
  const C = { x: 96, y: 34 }
  const arc = (v: Point, p: Point, q: Point, color: string) => {
    const a1 = Math.atan2(v.y - p.y, p.x - v.x)
    const a2 = Math.atan2(v.y - q.y, q.x - v.x)
    const r = 26
    const s = { x: v.x + r * Math.cos(a1), y: v.y - r * Math.sin(a1) }
    const e = { x: v.x + r * Math.cos(a2), y: v.y - r * Math.sin(a2) }
    return <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 0 0 ${e.x} ${e.y}`} fill="none" stroke={color} strokeWidth={3} />
  }
  return (
    <svg viewBox="0 0 220 160" className="figure-svg" role="img" aria-label="Triangle with its three angles marked">
      <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} fill="var(--accent-bg)" stroke={ACCENT} strokeWidth={2.5} strokeLinejoin="round" />
      {arc(A, B, C, '#e9696b')}
      {arc(B, C, A, '#5b8def')}
      {arc(C, A, B, '#37b893')}
      <text x={108} y={154} fontSize={12} fill="var(--text)" textAnchor="middle">∠A + ∠B + ∠C = 180°</text>
    </svg>
  )
}

function TriangleTypesFigure() {
  return (
    <svg viewBox="0 0 260 130" className="figure-svg" role="img" aria-label="Acute, right and obtuse triangles">
      {/* acute */}
      <polygon points="20,90 78,90 52,32" fill="var(--accent-bg)" stroke={ACCENT} strokeWidth={2.5} strokeLinejoin="round" />
      <text x={49} y={112} fontSize={12} fill="var(--text)" textAnchor="middle">acute</text>
      {/* right */}
      <polygon points="106,90 106,38 158,90" fill="var(--accent-bg)" stroke={ACCENT} strokeWidth={2.5} strokeLinejoin="round" />
      <rect x={106} y={78} width={12} height={12} fill="none" stroke={STROKE} strokeWidth={1.5} />
      <text x={132} y={112} fontSize={12} fill="var(--text)" textAnchor="middle">right</text>
      {/* obtuse */}
      <polygon points="186,90 246,90 230,58" fill="var(--accent-bg)" stroke={ACCENT} strokeWidth={2.5} strokeLinejoin="round" />
      <text x={216} y={112} fontSize={12} fill="var(--text)" textAnchor="middle">obtuse</text>
    </svg>
  )
}

function AreaVsPerimeterFigure({ w, h }: { w: number; h: number }) {
  const scale = Math.min(150 / w, 86 / h, 24)
  const rw = w * scale
  const rh = h * scale
  const x = (220 - rw) / 2
  const y = (160 - rh) / 2 - 6
  return (
    <svg viewBox="0 0 220 160" className="figure-svg" role="img" aria-label="Area is the inside, perimeter is the border">
      <rect x={x} y={y} width={rw} height={rh} fill="var(--accent-bg)" stroke="#f3963f" strokeWidth={7} strokeLinejoin="round" />
      <text x={x + rw / 2} y={y + rh / 2 + 5} fontSize={14} fill="var(--text-h)" textAnchor="middle">area</text>
      <text x={x + rw / 2} y={y + rh + 24} fontSize={13} fill="#d27c22" textAnchor="middle">perimeter (border)</text>
    </svg>
  )
}

function UnitSquaresFigure({ w, h }: { w: number; h: number }) {
  const scale = Math.min(150 / w, 90 / h, 24)
  const rw = w * scale
  const rh = h * scale
  const x = (220 - rw) / 2
  const y = (150 - rh) / 2
  const cols = Array.from({ length: w }, (_, i) => i)
  const rows = Array.from({ length: h }, (_, i) => i)
  return (
    <svg viewBox="0 0 220 160" className="figure-svg" role="img" aria-label={`Rectangle split into ${w} by ${h} unit squares`}>
      {rows.map((r) =>
        cols.map((c) => (
          <rect
            key={`${r}-${c}`}
            x={x + c * scale}
            y={y + r * scale}
            width={scale}
            height={scale}
            fill="var(--accent-bg)"
            stroke={STROKE}
            strokeWidth={1.2}
          />
        )),
      )}
      <rect x={x} y={y} width={rw} height={rh} fill="none" stroke={ACCENT} strokeWidth={3} />
      <text x={x + scale / 2} y={y + scale / 2 + 4} fontSize={11} fill="var(--text-h)" textAnchor="middle">1</text>
      <text x={x + rw / 2} y={y + rh + 20} fontSize={12} fill="var(--text)" textAnchor="middle">count the unit squares</text>
    </svg>
  )
}

function AreaProductFigure({ w, h }: { w: number; h: number }) {
  const scale = Math.min(150 / w, 80 / h, 22)
  const rw = w * scale
  const rh = h * scale
  const x = (220 - rw) / 2
  const y = 38
  const cols = Array.from({ length: w }, (_, i) => i)
  const rows = Array.from({ length: h }, (_, i) => i)
  return (
    <svg viewBox="0 0 220 160" className="figure-svg" role="img" aria-label={`Area equals ${w} times ${h}`}>
      {rows.map((r) =>
        cols.map((c) => (
          <rect
            key={`${r}-${c}`}
            x={x + c * scale}
            y={y + r * scale}
            width={scale}
            height={scale}
            fill="var(--accent-bg)"
            stroke={STROKE}
            strokeWidth={1.2}
          />
        )),
      )}
      <rect x={x} y={y} width={rw} height={rh} fill="none" stroke={ACCENT} strokeWidth={2.5} />
      {/* top brace: w columns */}
      <line x1={x} y1={y - 12} x2={x + rw} y2={y - 12} stroke={ACCENT} strokeWidth={2} />
      <line x1={x} y1={y - 16} x2={x} y2={y - 8} stroke={ACCENT} strokeWidth={2} />
      <line x1={x + rw} y1={y - 16} x2={x + rw} y2={y - 8} stroke={ACCENT} strokeWidth={2} />
      <text x={x + rw / 2} y={y - 18} fontSize={13} fill="var(--text-h)" textAnchor="middle">w = {w}</text>
      {/* side brace: h rows */}
      <line x1={x - 12} y1={y} x2={x - 12} y2={y + rh} stroke={ACCENT} strokeWidth={2} />
      <line x1={x - 16} y1={y} x2={x - 8} y2={y} stroke={ACCENT} strokeWidth={2} />
      <line x1={x - 16} y1={y + rh} x2={x - 8} y2={y + rh} stroke={ACCENT} strokeWidth={2} />
      <text x={x - 18} y={y + rh / 2 + 4} fontSize={13} fill="var(--text-h)" textAnchor="end">h = {h}</text>
      <text x={x + rw / 2} y={y + rh + 22} fontSize={13} fill={ACCENT} textAnchor="middle">w × h</text>
    </svg>
  )
}

function PerimeterWalkFigure({ w, h }: { w: number; h: number }) {
  const scale = Math.min(150 / w, 86 / h, 24)
  const rw = w * scale
  const rh = h * scale
  const x = (220 - rw) / 2
  const y = (160 - rh) / 2 - 6
  const steps = 7
  const dots: Array<{ x: number; y: number }> = []
  for (let i = 0; i < steps; i++) dots.push({ x: x + (rw * i) / steps, y })
  for (let i = 0; i < steps; i++) dots.push({ x: x + rw, y: y + (rh * i) / steps })
  for (let i = 0; i < steps; i++) dots.push({ x: x + rw - (rw * i) / steps, y: y + rh })
  for (let i = 0; i < steps; i++) dots.push({ x, y: y + rh - (rh * i) / steps })
  return (
    <svg viewBox="0 0 220 160" className="figure-svg" role="img" aria-label="Walk around the boundary of the rectangle">
      <rect x={x} y={y} width={rw} height={rh} fill="none" stroke="#37b893" strokeWidth={6} strokeLinejoin="round" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={2.6} fill="var(--text-h)" />
      ))}
      <path
        d={`M ${x + rw / 2 - 12} ${y - 12} L ${x + rw / 2 + 12} ${y - 12}`}
        stroke={ACCENT}
        strokeWidth={2.5}
        markerEnd="url(#walk-arrow)"
      />
      <text x={x + rw / 2} y={y + rh + 24} fontSize={12} fill="var(--text)" textAnchor="middle">walk the boundary</text>
      <defs>
        <marker id="walk-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0 0 L7 3 L0 6 z" fill={ACCENT} />
        </marker>
      </defs>
    </svg>
  )
}

function PerimeterSidesFigure({ w, h }: { w: number; h: number }) {
  const scale = Math.min(140 / w, 80 / h, 22)
  const rw = w * scale
  const rh = h * scale
  const x = (220 - rw) / 2
  const y = (160 - rh) / 2 - 4
  return (
    <svg viewBox="0 0 220 160" className="figure-svg" role="img" aria-label="All four sides labeled to motivate two times w plus h">
      <rect x={x} y={y} width={rw} height={rh} fill="var(--card)" stroke={STROKE} strokeWidth={1.5} />
      {/* w pair: top & bottom */}
      <line x1={x} y1={y} x2={x + rw} y2={y} stroke="#5b8def" strokeWidth={5} strokeLinecap="round" />
      <line x1={x} y1={y + rh} x2={x + rw} y2={y + rh} stroke="#5b8def" strokeWidth={5} strokeLinecap="round" />
      {/* h pair: left & right */}
      <line x1={x} y1={y} x2={x} y2={y + rh} stroke="#e9696b" strokeWidth={5} strokeLinecap="round" />
      <line x1={x + rw} y1={y} x2={x + rw} y2={y + rh} stroke="#e9696b" strokeWidth={5} strokeLinecap="round" />
      <text x={x + rw / 2} y={y - 8} fontSize={13} fill="#5b8def" textAnchor="middle">w</text>
      <text x={x + rw / 2} y={y + rh + 18} fontSize={13} fill="#5b8def" textAnchor="middle">w</text>
      <text x={x - 14} y={y + rh / 2 + 4} fontSize={13} fill="#e9696b" textAnchor="middle">h</text>
      <text x={x + rw + 14} y={y + rh / 2 + 4} fontSize={13} fill="#e9696b" textAnchor="middle">h</text>
      <text x={110} y={150} fontSize={12} fill="var(--text)" textAnchor="middle">2 × (w + h)</text>
    </svg>
  )
}

function AreaFormulasFigure() {
  return (
    <svg viewBox="0 0 240 150" className="figure-svg" role="img" aria-label="Area of a rectangle and a triangle">
      {/* rectangle */}
      <rect x={20} y={40} width={84} height={56} fill="var(--accent-bg)" stroke={ACCENT} strokeWidth={2.5} />
      <text x={62} y={72} fontSize={13} fill="var(--text-h)" textAnchor="middle">w × h</text>
      <text x={62} y={120} fontSize={12} fill="var(--text)" textAnchor="middle">rectangle</text>
      {/* right triangle */}
      <polygon points="140,96 220,96 140,40" fill="var(--accent-bg)" stroke={ACCENT} strokeWidth={2.5} strokeLinejoin="round" />
      <rect x={140} y={84} width={12} height={12} fill="none" stroke={STROKE} strokeWidth={1.5} />
      <text x={172} y={78} fontSize={13} fill="var(--text-h)" textAnchor="middle">½ b h</text>
      <text x={180} y={120} fontSize={12} fill="var(--text)" textAnchor="middle">triangle</text>
    </svg>
  )
}

export function StaticFigure({ figure }: { figure: Figure }) {
  switch (figure.kind) {
    case 'pointsLines':
      return <PointsLinesFigure />
    case 'angle':
      return <AngleFigure degrees={figure.degrees} />
    case 'triangle':
      return <TriangleFigure />
    case 'rightTriangle':
      return <RightTriangleFigure a={figure.a} b={figure.b} />
    case 'rectangle':
      return <RectangleFigure w={figure.w} h={figure.h} />
    case 'reflection':
      return <ReflectionFigure />
    case 'clock':
      return <ClockFigure hour={figure.hour} minute={figure.minute} />
    case 'anglesHook':
      return <AnglesHookFigure />
    case 'transformTrio':
      return <TransformTrioFigure />
    case 'translation':
      return <TranslationFigure />
    case 'rotation':
      return <RotationFigure />
    case 'symmetryLines':
      return <SymmetryLinesFigure />
    case 'rotationalSymmetry':
      return <RotationalSymmetryFigure />
    case 'pointDot':
      return <PointDotFigure />
    case 'pointsScatter':
      return <PointsScatterFigure />
    case 'segment':
      return <SegmentFigure />
    case 'ray':
      return <RayFigure />
    case 'line':
      return <LineFigure />
    case 'truss':
      return <TrussFigure />
    case 'triangleAngles':
      return <TriangleAnglesFigure />
    case 'triangleTypes':
      return <TriangleTypesFigure />
    case 'areaVsPerimeter':
      return <AreaVsPerimeterFigure w={figure.w} h={figure.h} />
    case 'unitSquares':
      return <UnitSquaresFigure w={figure.w} h={figure.h} />
    case 'areaProduct':
      return <AreaProductFigure w={figure.w} h={figure.h} />
    case 'perimeterWalk':
      return <PerimeterWalkFigure w={figure.w} h={figure.h} />
    case 'perimeterSides':
      return <PerimeterSidesFigure w={figure.w} h={figure.h} />
    case 'areaFormulas':
      return <AreaFormulasFigure />
  }
}
