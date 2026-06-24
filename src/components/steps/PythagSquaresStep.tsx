import { useEffect, useRef, useState } from 'react'
import type { PythagSquaresStep as PSStep, Point } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox } from '../figures/geometry'

const VB = 320
const PAD = 12
// world spans x:[-maxLeg, 2*maxLeg], y:[-maxLeg, 2*maxLeg] to fit all three squares
export function PythagSquaresStep({ step, setChecker, locked }: InteractiveStepProps<PSStep>) {
  const { minLeg, maxLeg } = step
  const lo = -maxLeg
  const span = 3 * maxLeg
  const scale = (VB - 2 * PAD) / span
  const sx = (wx: number) => PAD + (wx - lo) * scale
  const sy = (wy: number) => PAD + (2 * maxLeg - wy) * scale

  const svgRef = useRef<SVGSVGElement | null>(null)
  const [a, setA] = useState(step.initialA)
  const [b, setB] = useState(step.initialB)
  const drag = useRef<'a' | 'b' | null>(null)

  const c = Math.sqrt(a * a + b * b)

  useEffect(() => {
    setChecker(() => Math.abs(c - step.targetC) <= step.tolerance)
  }, [c, step.targetC, step.tolerance, setChecker])

  const pick = (e: React.PointerEvent<SVGSVGElement>) => {
    if (locked) return
    const p = clientToViewBox(svgRef.current!, e.clientX, e.clientY, VB, VB)
    const dA = Math.hypot(sx(a) - p.x, sy(0) - p.y)
    const dB = Math.hypot(sx(0) - p.x, sy(b) - p.y)
    if (Math.min(dA, dB) > 34) return
    drag.current = dA <= dB ? 'a' : 'b'
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return
    const p = clientToViewBox(svgRef.current!, e.clientX, e.clientY, VB, VB)
    const world = (p.x - PAD) / scale + lo
    const worldY = 2 * maxLeg - (p.y - PAD) / scale
    const clamp = (v: number) => Math.max(minLeg, Math.min(maxLeg, Math.round(v)))
    if (drag.current === 'a') setA(clamp(world))
    else setB(clamp(worldY))
  }
  const up = () => {
    drag.current = null
  }

  // vertices: right angle at O=(0,0), A=(a,0), B=(0,b)
  const poly = (pts: Point[]) => pts.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')
  // square on leg a (below x-axis)
  const sqA = poly([{ x: 0, y: 0 }, { x: a, y: 0 }, { x: a, y: -a }, { x: 0, y: -a }])
  // square on leg b (left of y-axis)
  const sqB = poly([{ x: 0, y: 0 }, { x: 0, y: b }, { x: -b, y: b }, { x: -b, y: 0 }])
  // square on hypotenuse (outward, away from origin); n = (b, a)
  const sqC = poly([{ x: a, y: 0 }, { x: 0, y: b }, { x: b, y: b + a }, { x: a + b, y: a }])

  const mid = (p: Point[]): Point => ({
    x: p.reduce((s, q) => s + q.x, 0) / p.length,
    y: p.reduce((s, q) => s + q.y, 0) / p.length,
  })
  const mA = mid([{ x: 0, y: 0 }, { x: a, y: 0 }, { x: a, y: -a }, { x: 0, y: -a }])
  const mB = mid([{ x: 0, y: 0 }, { x: 0, y: b }, { x: -b, y: b }, { x: -b, y: 0 }])
  const mC = mid([{ x: a, y: 0 }, { x: 0, y: b }, { x: b, y: b + a }, { x: a + b, y: a }])

  const cWhole = Math.abs(c - Math.round(c)) < 1e-9

  return (
    <div className="interactive">
      <div className="readout small">
        <span>{a}² + {b}² = {a * a + b * b}</span>
        <span className="readout-label">c = √{a * a + b * b} = {cWhole ? c.toFixed(0) : c.toFixed(2)}</span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB} ${VB}`}
        className="interactive-svg"
        onPointerDown={pick}
        onPointerMove={move}
        onPointerUp={up}
        style={{ touchAction: 'none' }}
      >
        <polygon points={sqA} fill="rgba(91,141,239,0.22)" stroke="#5b8def" strokeWidth={2} />
        <polygon points={sqB} fill="rgba(55,184,147,0.22)" stroke="#37b893" strokeWidth={2} />
        <polygon points={sqC} fill="rgba(233,105,107,0.22)" stroke="#e9696b" strokeWidth={2} />
        {/* triangle */}
        <polygon
          points={poly([{ x: 0, y: 0 }, { x: a, y: 0 }, { x: 0, y: b }])}
          fill="var(--accent-bg)"
          stroke="var(--accent)"
          strokeWidth={2.5}
        />
        <text x={sx(mA.x)} y={sy(mA.y)} fontSize={13} fill="#3b62b8" textAnchor="middle" dominantBaseline="middle">{a * a}</text>
        <text x={sx(mB.x)} y={sy(mB.y)} fontSize={13} fill="#1f7d62" textAnchor="middle" dominantBaseline="middle">{b * b}</text>
        <text x={sx(mC.x)} y={sy(mC.y)} fontSize={13} fill="#b83b3d" textAnchor="middle" dominantBaseline="middle">{a * a + b * b}</text>
        {/* drag handles */}
        <circle cx={sx(a)} cy={sy(0)} r={9} fill="#5b8def" style={{ cursor: locked ? 'default' : 'grab' }} />
        <circle cx={sx(0)} cy={sy(b)} r={9} fill="#37b893" style={{ cursor: locked ? 'default' : 'grab' }} />
      </svg>
      <p className="sort-help">Drag the blue and green handles to resize the legs.</p>
    </div>
  )
}
