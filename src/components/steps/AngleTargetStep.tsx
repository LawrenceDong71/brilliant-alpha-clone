import { useEffect, useRef, useState } from 'react'
import type { AngleTargetStep as TargetStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox } from '../figures/geometry'

const VB_W = 340
const VB_H = 220
const PAD = 24
const GROUND = VB_H - 28
const WORLD_X = 110
const SCALE = (VB_W - 2 * PAD) / WORLD_X

const sx = (wx: number) => PAD + wx * SCALE
const sy = (wy: number) => GROUND - wy * SCALE

// Projectile launched with v^2 = 100g at `deg`. y(x) in world units.
const yAt = (x: number, deg: number) => {
  const r = (deg * Math.PI) / 180
  return x * Math.tan(r) - (x * x) / (200 * Math.cos(r) * Math.cos(r))
}
const rangeOf = (deg: number) => 100 * Math.sin((2 * deg * Math.PI) / 180)

export function AngleTargetStep({ step, setChecker, locked }: InteractiveStepProps<TargetStep>) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [deg, setDeg] = useState(step.startAngle)
  const dragging = useRef(false)

  const targetH = step.targetHeight ?? 0
  const tol = step.targetWidth / 2
  const yTarget = yAt(step.targetCenter, deg)
  const scored = rangeOf(deg) >= step.targetCenter && Math.abs(yTarget - targetH) <= tol

  useEffect(() => {
    setChecker(() => scored)
  }, [scored, setChecker])

  const update = (clientX: number, clientY: number) => {
    const p = clientToViewBox(svgRef.current!, clientX, clientY, VB_W, VB_H)
    let a = (Math.atan2(GROUND - p.y, p.x - sx(0)) * 180) / Math.PI
    a = Math.max(8, Math.min(82, a))
    setDeg(Math.round(a))
  }
  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (locked) return
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    update(e.clientX, e.clientY)
  }
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragging.current) update(e.clientX, e.clientY)
  }
  const onUp = () => {
    dragging.current = false
  }

  const rad = (deg * Math.PI) / 180
  const range = rangeOf(deg)

  // trajectory until it returns to the ground
  const pts: string[] = []
  for (let x = 0; x <= range + 0.001; x += range / 40 || 1) {
    const y = yAt(x, deg)
    if (y < 0) break
    pts.push(`${sx(x)},${sy(y)}`)
  }

  // angle wedge at the launch point (origin)
  const ox = sx(0)
  const oy = GROUND
  const R = 40
  const base = { x: ox + R, y: oy }
  const tip = { x: ox + R * Math.cos(rad), y: oy - R * Math.sin(rad) }
  const wedge = `M ${ox} ${oy} L ${base.x} ${base.y} A ${R} ${R} 0 0 0 ${tip.x} ${tip.y} Z`
  const labelA = (deg / 2) * (Math.PI / 180)
  const labelPos = { x: ox + (R + 16) * Math.cos(labelA), y: oy - (R + 16) * Math.sin(labelA) }

  // aim ray (the shot direction)
  const aimLen = 56
  const aim = { x: ox + aimLen * Math.cos(rad), y: oy - aimLen * Math.sin(rad) }

  // hoop
  const rx = sx(step.targetCenter)
  const ry = sy(targetH)
  const rimRx = 13
  const rimColor = scored ? 'var(--good)' : '#e8743b'

  return (
    <div className="interactive">
      <div className="readout">
        <span className="readout-value">{deg}°</span>
        <span className="readout-label">launch angle · drag the ball to aim</span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="interactive-svg court"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        style={{ touchAction: 'none' }}
      >
        {/* ground / court */}
        <line x1={PAD - 6} y1={GROUND} x2={VB_W - 6} y2={GROUND} stroke="var(--fig-stroke)" strokeWidth={3} strokeLinecap="round" />

        {/* hoop: pole, backboard, rim, net */}
        <line x1={rx + 26} y1={GROUND} x2={rx + 26} y2={ry - 26} stroke="var(--fig-stroke)" strokeWidth={3} />
        <rect x={rx + 12} y={ry - 30} width={16} height={34} rx={2} fill="var(--card)" stroke="var(--fig-stroke)" strokeWidth={2} />
        <rect x={rx + 15} y={ry - 22} width={9} height={11} fill="none" stroke="var(--fig-stroke)" strokeWidth={1.5} />
        {/* net */}
        <path
          d={`M ${rx - rimRx} ${ry} L ${rx - rimRx * 0.5} ${ry + 16} L ${rx + rimRx * 0.5} ${ry + 16} L ${rx + rimRx} ${ry} Z`}
          fill="rgba(255,255,255,0.5)"
          stroke="var(--fig-stroke)"
          strokeWidth={1}
          opacity={0.7}
        />
        <line x1={rx} y1={ry} x2={rx} y2={ry + 16} stroke="var(--fig-stroke)" strokeWidth={1} opacity={0.5} />
        {/* rim */}
        <ellipse cx={rx} cy={ry} rx={rimRx} ry={4} fill="none" stroke={rimColor} strokeWidth={3.5} />
        <text x={rx} y={ry - 36} fontSize={11} textAnchor="middle" fill="var(--text)">{step.targetLabel ?? 'hoop'}</text>

        {/* trajectory */}
        <polyline points={pts.join(' ')} fill="none" stroke="var(--accent)" strokeWidth={2} strokeDasharray="4 5" />

        {/* angle wedge at the feet */}
        <line x1={ox} y1={oy} x2={base.x} y2={base.y} stroke="var(--muted)" strokeWidth={2} />
        <path d={wedge} fill="var(--accent-bg)" stroke="var(--accent)" strokeWidth={1.5} />
        <line x1={ox} y1={oy} x2={aim.x} y2={aim.y} stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" />
        <text x={labelPos.x} y={labelPos.y} fontSize={13} fontWeight={600} textAnchor="middle" fill="var(--accent)">{deg}°</text>

        {/* basketball */}
        <g transform={`translate(${ox}, ${oy - 9})`}>
          <circle r={9} fill="#e8743b" stroke="#b85a26" strokeWidth={1} />
          <line x1={-9} y1={0} x2={9} y2={0} stroke="#7a3c18" strokeWidth={1} />
          <line x1={0} y1={-9} x2={0} y2={9} stroke="#7a3c18" strokeWidth={1} />
          <path d="M -9 0 A 12 12 0 0 1 -2 -8.7" fill="none" stroke="#7a3c18" strokeWidth={1} />
          <path d="M 9 0 A 12 12 0 0 0 2 -8.7" fill="none" stroke="#7a3c18" strokeWidth={1} />
        </g>
      </svg>
      <p className="sort-help">The shaded corner at your feet is the launch angle — even a jump shot is just an angle.</p>
    </div>
  )
}
