import { useEffect, useState } from 'react'
import type { SliderStep as SliderStepType } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'

function compute(kind: SliderStepType['compute'], v: Record<string, number>): number {
  switch (kind) {
    case 'hypotenuse':
      return Math.sqrt((v.a ?? 0) ** 2 + (v.b ?? 0) ** 2)
    case 'area':
      return (v.w ?? 0) * (v.h ?? 0)
    case 'perimeter':
      return 2 * ((v.w ?? 0) + (v.h ?? 0))
  }
}

function LiveFigure({ kind, v }: { kind: SliderStepType['figure']; v: Record<string, number> }) {
  if (kind === 'rightTriangle') {
    const a = v.a ?? 1
    const b = v.b ?? 1
    const scale = Math.min(150 / Math.max(a, b, 1), 22)
    const ox = 50
    const oy = 150
    return (
      <svg viewBox="0 0 240 175" className="interactive-svg static">
        <polygon
          points={`${ox},${oy} ${ox + b * scale},${oy} ${ox},${oy - a * scale}`}
          fill="var(--accent-bg)"
          stroke="var(--accent)"
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <rect x={ox} y={oy - 14} width={14} height={14} fill="none" stroke="var(--fig-stroke)" strokeWidth={2} />
        <text x={ox + (b * scale) / 2 - 10} y={oy + 18} fontSize={13} fill="var(--text-h)">b = {b}</text>
        <text x={ox - 42} y={oy - (a * scale) / 2} fontSize={13} fill="var(--text-h)">a = {a}</text>
      </svg>
    )
  }
  const w = v.w ?? 1
  const h = v.h ?? 1
  const scale = Math.min(150 / Math.max(w, 1), 95 / Math.max(h, 1), 22)
  const rw = w * scale
  const rh = h * scale
  const x = (240 - rw) / 2
  const y = (165 - rh) / 2
  return (
    <svg viewBox="0 0 240 175" className="interactive-svg static">
      <rect x={x} y={y} width={rw} height={rh} fill="var(--accent-bg)" stroke="var(--accent)" strokeWidth={3} />
      <text x={x + rw / 2 - 8} y={y + rh + 18} fontSize={13} fill="var(--text-h)">{w}</text>
      <text x={x - 22} y={y + rh / 2 + 4} fontSize={13} fill="var(--text-h)">{h}</text>
    </svg>
  )
}

export function SliderStep({ step, setChecker, locked }: InteractiveStepProps<SliderStepType>) {
  const [vals, setVals] = useState<Record<string, number>>(() =>
    Object.fromEntries(step.sliders.map((s) => [s.key, s.initial])),
  )

  const derived = compute(step.compute, vals)

  useEffect(() => {
    setChecker(() => Math.abs(derived - step.target) <= step.tolerance)
  }, [derived, step.target, step.tolerance, setChecker])

  return (
    <div className="interactive">
      <div className="readout">
        <span className="readout-value">{Number.isInteger(derived) ? derived : derived.toFixed(2)}{step.unit ?? ''}</span>
        <span className="readout-label">{step.compute} · target {step.target}{step.unit ?? ''}</span>
      </div>
      <div className="figure-wrap">
        <LiveFigure kind={step.figure} v={vals} />
      </div>
      <div className="sliders">
        {step.sliders.map((s) => (
          <label key={s.key} className="slider-row">
            <span className="slider-label">{s.label}: <strong>{vals[s.key]}</strong></span>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={vals[s.key]}
              disabled={locked}
              onChange={(e) => setVals((prev) => ({ ...prev, [s.key]: Number(e.target.value) }))}
            />
          </label>
        ))}
      </div>
    </div>
  )
}
