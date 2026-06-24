import { useEffect, useMemo, useRef, useState } from 'react'
import type { ConnectDotsStep as ConnectStep, Point } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox } from '../figures/geometry'

const VB = 264
const PAD = 26

export function ConnectDotsStep({ step, setChecker, locked }: InteractiveStepProps<ConnectStep>) {
  const { min, max } = step.grid
  const span = max - min
  const unit = (VB - 2 * PAD) / span
  const gx = (x: number) => PAD + (x - min) * unit
  const gy = (y: number) => VB - PAD - (y - min) * unit

  const svgRef = useRef<SVGSVGElement | null>(null)
  const [seq, setSeq] = useState<string[]>([])

  const expected = useMemo(
    () => (step.closed ? [...step.order, step.order[0]] : step.order),
    [step.order, step.closed],
  )

  useEffect(() => {
    setChecker(
      () => seq.length === expected.length && seq.every((id, i) => id === expected[i]),
    )
  }, [seq, expected, setChecker])

  const numberOf = (id: string) => step.order.indexOf(id) + 1
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
      <p className="sort-help">{step.instruction ?? 'Tap the stars in number order.'}</p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB} ${VB}`}
        className="interactive-svg night"
        onPointerDown={onDown}
        style={{ touchAction: 'none' }}
      >
        {segs.map(([a, b], i) => (
          <line key={i} x1={gx(a.x)} y1={gy(a.y)} x2={gx(b.x)} y2={gy(b.y)} stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" />
        ))}
        {step.dots.map((d) => {
          const used = seq.includes(d.id)
          return (
            <g key={d.id}>
              <circle cx={gx(d.at.x)} cy={gy(d.at.y)} r={used ? 9 : 7} fill={used ? 'var(--accent)' : '#ffd86b'} stroke="#ffd86b" strokeWidth={used ? 0 : 1.5} />
              <text x={gx(d.at.x) + 11} y={gy(d.at.y) - 9} fontSize={12} fill="#cdd3e0">{numberOf(d.id)}</text>
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
