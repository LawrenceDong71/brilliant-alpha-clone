import { useEffect, useRef, useState } from 'react'
import type { Point, SpinShapeStep as Step } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox } from '../figures/geometry'

const VB = 264
const PAD = 26

const centroid = (pts: Point[]): Point => ({
  x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
  y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
})

const norm360 = (a: number) => ((a % 360) + 360) % 360
const angDiff = (a: number, b: number) => {
  const d = ((a - b + 180) % 360 + 360) % 360 - 180
  return Math.abs(d)
}

const turnName = (deg: number) => {
  const d = norm360(deg)
  if (d === 90) return 'a quarter-turn (90°)'
  if (d === 180) return 'a half-turn (180°)'
  if (d === 270) return 'a three-quarter-turn (270°)'
  return `a ${d}° turn`
}

export function SpinShapeStep({ step, setChecker, locked }: InteractiveStepProps<Step>) {
  const { min, max } = step.grid
  const span = max - min
  const unit = (VB - 2 * PAD) / span
  const gx = (x: number) => PAD + (x - min) * unit
  const gy = (y: number) => VB - PAD - (y - min) * unit
  const snap = step.snapDegrees ?? 5
  const C = step.center
  const targets = step.targets

  const svgRef = useRef<SVGSVGElement | null>(null)
  const [angle, setAngle] = useState(0)
  const [roundIndex, setRoundIndex] = useState(0)
  const [result, setResult] = useState<null | { ok: boolean; angle: number }>(null)
  const [done, setDone] = useState(false)
  const dragging = useRef(false)

  const target = targets[roundIndex]
  const guided = roundIndex === 0
  const awaitingNext = result?.ok === true && !done
  const frozen = locked || done || awaitingNext

  useEffect(() => {
    setChecker(() => done)
  }, [done, setChecker])

  const rot = (p: Point, deg: number): Point => {
    const r = (deg * Math.PI) / 180
    const dx = p.x - C.x
    const dy = p.y - C.y
    return {
      x: C.x + dx * Math.cos(r) - dy * Math.sin(r),
      y: C.y + dx * Math.sin(r) + dy * Math.cos(r),
    }
  }

  const baseCen = centroid(step.shape)
  const r0 = Math.hypot(baseCen.x - C.x, baseCen.y - C.y)
  const theta0 = Math.atan2(baseCen.y - C.y, baseCen.x - C.x)

  const toContent = (cx: number, cy: number): Point => {
    const p = clientToViewBox(svgRef.current!, cx, cy, VB, VB)
    return { x: (p.x - PAD) / unit + min, y: (VB - PAD - p.y) / unit + min }
  }

  const setFromPointer = (cx: number, cy: number) => {
    const c = toContent(cx, cy)
    const phi = Math.atan2(c.y - C.y, c.x - C.x)
    const deg = norm360(((phi - theta0) * 180) / Math.PI)
    setAngle(Math.round(deg / snap) * snap)
  }

  const handlePos = rot(baseCen, angle)

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (frozen) return
    const c = toContent(e.clientX, e.clientY)
    if (Math.hypot(c.x - handlePos.x, c.y - handlePos.y) <= 1.6) {
      dragging.current = true
      if (result) setResult(null)
      e.currentTarget.setPointerCapture(e.pointerId)
      setFromPointer(e.clientX, e.clientY)
    }
  }
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return
    setFromPointer(e.clientX, e.clientY)
  }
  const onUp = () => {
    dragging.current = false
  }

  const submit = () => {
    if (frozen) return
    const ok = angDiff(angle, target) <= step.toleranceDegrees
    setResult({ ok, angle })
    if (ok && roundIndex >= targets.length - 1) setDone(true)
  }
  const nextRound = () => {
    setRoundIndex((i) => i + 1)
    setAngle(0)
    setResult(null)
  }
  const resetAngle = () => {
    setAngle(0)
    setResult(null)
  }

  const poly = (pts: Point[]) => pts.map((p) => `${gx(p.x)},${gy(p.y)}`).join(' ')
  const cur = step.shape.map((p) => rot(p, angle))
  const targetShape = step.shape.map((p) => rot(p, target))
  const showTarget = guided && !done
  const showAngle = guided && !done

  const lines = []
  for (let i = min; i <= max; i++) {
    lines.push(
      <line key={`v${i}`} x1={gx(i)} y1={gy(min)} x2={gx(i)} y2={gy(max)} stroke="var(--grid)" strokeWidth={1} />,
      <line key={`h${i}`} x1={gx(min)} y1={gy(i)} x2={gx(max)} y2={gy(i)} stroke="var(--grid)" strokeWidth={1} />,
    )
  }
  const axes = min <= 0 && max >= 0

  const arcR = r0 * 0.55
  const arcPts: string[] = []
  const steps = Math.max(2, Math.round(Math.abs(angle) / 4))
  for (let i = 0; i <= steps; i++) {
    const a = theta0 + ((angle / steps) * i * Math.PI) / 180
    arcPts.push(`${gx(C.x + arcR * Math.cos(a))},${gy(C.y + arcR * Math.sin(a))}`)
  }

  const cxp = gx(C.x)
  const cyp = gy(C.y)
  const hxp = gx(handlePos.x)
  const hyp = gy(handlePos.y)

  const instruction = done
    ? 'All turns complete — press Check to finish.'
    : guided
      ? `Turn ${turnName(target)} counterclockwise onto the dashed outline.`
      : `Turn ${turnName(target)} counterclockwise — no outline, judge it yourself.`

  return (
    <div className="interactive">
      <div className="readout small">
        <span>{showAngle ? `rotation = ${Math.round(angle)}°` : `Turn ${roundIndex + 1} of ${targets.length}`}</span>
        <span className="readout-label">{instruction}</span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB} ${VB}`}
        className="interactive-svg"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        style={{ touchAction: 'none' }}
      >
        {lines}
        {axes && (
          <>
            <line x1={gx(0)} y1={gy(min)} x2={gx(0)} y2={gy(max)} stroke="var(--fig-stroke)" strokeWidth={1.5} />
            <line x1={gx(min)} y1={gy(0)} x2={gx(max)} y2={gy(0)} stroke="var(--fig-stroke)" strokeWidth={1.5} />
          </>
        )}

        {/* rim circle through the shape's reference point */}
        <circle cx={cxp} cy={cyp} r={r0 * unit} fill="none" stroke="var(--fig-stroke)" strokeOpacity={0.25} strokeWidth={1.5} strokeDasharray="3 5" />

        {/* start ghost (original position, the reference for each turn) */}
        <polygon points={poly(step.shape)} fill="var(--fig-stroke)" opacity={0.1} stroke="var(--fig-stroke)" strokeOpacity={0.3} strokeWidth={1.5} strokeDasharray="2 4" />

        {/* dashed target orientation — only as a guide on the first round */}
        {showTarget && (
          <polygon points={poly(targetShape)} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="7 5" strokeLinejoin="round" />
        )}

        {/* live sweep arc */}
        {Math.abs(angle) > 0.5 && (
          <polyline points={arcPts.join(' ')} fill="none" stroke="#7c5cff" strokeWidth={2.5} strokeLinecap="round" />
        )}

        {/* spoke from hub to handle */}
        <line x1={cxp} y1={cyp} x2={hxp} y2={hyp} stroke="#7c5cff" strokeWidth={2} strokeLinecap="round" strokeOpacity={0.7} />

        {/* live rotating shape */}
        <polygon
          points={poly(cur)}
          fill="#b49cff"
          fillOpacity={0.6}
          stroke="#7c5cff"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />

        {/* hub */}
        <circle cx={cxp} cy={cyp} r={5} fill="var(--fig-stroke)" />
        {/* drag handle */}
        <circle cx={hxp} cy={hyp} r={9} fill="#7c5cff" style={{ cursor: frozen ? 'default' : 'grab' }} />
      </svg>

      {result && !result.ok && (
        <div className="feedback incorrect">
          Not quite — that was a {Math.round(result.angle)}° turn. Aim for {turnName(target)} and submit again.
        </div>
      )}
      {result?.ok && !done && (
        <div className="feedback correct">Nice — {turnName(target)}! Ready for the next one.</div>
      )}
      {done && (
        <div className="feedback correct">
          All {targets.length} turns nailed — {targets.map((t) => `${norm360(t)}°`).join(', ')}. Press Check below to finish.
        </div>
      )}

      {!done &&
        (awaitingNext ? (
          <button type="button" className="btn primary full" onClick={nextRound}>
            Next turn →
          </button>
        ) : (
          <button type="button" className="btn primary full" disabled={frozen || angle === 0} onClick={submit}>
            Submit rotation
          </button>
        ))}
      {!done && !awaitingNext && (
        <button type="button" className="btn ghost full" disabled={frozen || angle === 0} onClick={resetAngle}>
          Start over
        </button>
      )}
    </div>
  )
}
