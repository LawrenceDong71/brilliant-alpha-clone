import { useEffect, useMemo, useRef, useState } from 'react'
import type { ConnectDotsStep as ConnectStep, Point } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox } from '../figures/geometry'

const VB = 264
const PAD = 26

/** Points of a five-pointed star centered at (cx, cy). */
function starPath(cx: number, cy: number, outer: number, inner: number, spikes = 5): string {
  const stepAng = Math.PI / spikes
  let a = -Math.PI / 2
  const pts: string[] = []
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`)
    a += stepAng
  }
  return pts.join(' ')
}

export function ConnectDotsStep({ step, setChecker, locked }: InteractiveStepProps<ConnectStep>) {
  const { min, max } = step.grid
  const span = max - min
  const unit = (VB - 2 * PAD) / span
  const gx = (x: number) => PAD + (x - min) * unit
  const gy = (y: number) => VB - PAD - (y - min) * unit

  const svgRef = useRef<SVGSVGElement | null>(null)
  const [seq, setSeq] = useState<string[]>([])

  // Any order is fine — the constellation is "drawn" once every star has been
  // connected into the path at least once.
  const requiredIds = useMemo(() => step.order, [step.order])

  useEffect(() => {
    setChecker(
      () => requiredIds.length > 0 && requiredIds.every((id) => seq.includes(id)),
    )
  }, [seq, requiredIds, setChecker])

  const dotById = (id: string) => step.dots.find((d) => d.id === id)!.at

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (locked) return
    const p = clientToViewBox(svgRef.current!, e.clientX, e.clientY, VB, VB)
    let best: string | null = null
    let bestD = 26
    for (const d of step.dots) {
      const dist = Math.hypot(gx(d.at.x) - p.x, gy(d.at.y) - p.y)
      if (dist < bestD) {
        bestD = dist
        best = d.id
      }
    }
    if (best && seq[seq.length - 1] !== best) setSeq((s) => [...s, best])
  }

  const segs: Array<[Point, Point]> = []
  for (let i = 1; i < seq.length; i++) segs.push([dotById(seq[i - 1]), dotById(seq[i])])

  return (
    <div className="interactive">
      <p className="sort-help">
        {step.instruction ?? 'Tap the stars one by one to connect them — in any order you like.'}
      </p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB} ${VB}`}
        className="interactive-svg night"
        onPointerDown={onDown}
        style={{ touchAction: 'none' }}
      >
        {/* faint background star dust */}
        {step.dots.map((d, i) => (
          <circle
            key={`dust-${d.id}`}
            cx={gx(d.at.x) + (i % 2 === 0 ? -18 : 16)}
            cy={gy(d.at.y) + (i % 3 === 0 ? 20 : -16)}
            r={0.8}
            fill="#cdd6f5"
            opacity={0.5}
          />
        ))}

        {/* constellation lines (soft glow + bright core) */}
        {segs.map(([a, b], i) => (
          <g key={i}>
            <line x1={gx(a.x)} y1={gy(a.y)} x2={gx(b.x)} y2={gy(b.y)} stroke="#ffe9a8" strokeWidth={5} opacity={0.16} strokeLinecap="round" />
            <line x1={gx(a.x)} y1={gy(a.y)} x2={gx(b.x)} y2={gy(b.y)} stroke="#ffe9a8" strokeWidth={1.8} opacity={0.95} strokeLinecap="round" />
          </g>
        ))}

        {step.dots.map((d, i) => {
          const used = seq.includes(d.id)
          const cx = gx(d.at.x)
          const cy = gy(d.at.y)
          const R = used ? 11 : 8.5
          const twinkleDur = 2.2 + (i % 4) * 0.6
          return (
            <g key={d.id} style={{ cursor: locked ? 'default' : 'pointer' }}>
              {/* glow halo — gently twinkles */}
              <circle cx={cx} cy={cy} r={R * 2} fill="#ffd86b" opacity={used ? 0.32 : 0.16}>
                {!used && (
                  <animate
                    attributeName="opacity"
                    values="0.10;0.22;0.10"
                    dur={`${twinkleDur}s`}
                    repeatCount="indefinite"
                  />
                )}
              </circle>
              {/* the star */}
              <polygon
                points={starPath(cx, cy, R, R * 0.42)}
                fill={used ? '#fff6d6' : '#ffd86b'}
                stroke="#ffe9a8"
                strokeWidth={used ? 1.2 : 0.8}
                strokeLinejoin="round"
              />
              {/* bright core sparkle */}
              <circle cx={cx} cy={cy} r={used ? 2 : 1.4} fill="#fffdf5" />
            </g>
          )
        })}
      </svg>
      <button type="button" className="btn ghost full" disabled={locked || seq.length === 0} onClick={() => setSeq([])}>
        Start over
      </button>
    </div>
  )
}
