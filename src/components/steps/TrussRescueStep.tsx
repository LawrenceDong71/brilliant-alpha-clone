import { useEffect, useMemo, useState } from 'react'
import type { TrussRescueStep as TRStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'

type TriType = 'acute' | 'right' | 'obtuse'

function classify(angles: number[]): TriType {
  const max = Math.max(...angles)
  if (max > 90) return 'obtuse'
  if (max === 90) return 'right'
  return 'acute'
}

const TYPE_LABEL: Record<TriType, string> = { acute: 'Acute', right: 'Right', obtuse: 'Obtuse' }

function shuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr]
  let s = seed
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const j = s % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function angleChoices(a: number, b: number): number[] {
  const correct = 180 - a - b
  const set = new Set<number>([correct])
  for (const cand of [a + b, 180 - a, 180 - b, correct + 15, correct - 10, 90, 60]) {
    if (set.size >= 4) break
    if (cand > 0 && cand < 180) set.add(cand)
  }
  return shuffle([...set], a * 13 + b * 7 + 1)
}

/** Triangle vertices fitted into a box, given two base angles (third = 180−a−b). */
function trianglePoints(a: number, b: number, boxW: number, boxH: number, padX: number, padTop: number) {
  const ar = (a * Math.PI) / 180
  const br = (b * Math.PI) / 180
  const t = Math.sin(br) / Math.sin(ar + br)
  // math coords, y up: A at origin, B at (1,0), C above the base
  const pts = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: t * Math.cos(ar), y: t * Math.sin(ar) },
  ]
  const minX = Math.min(...pts.map((p) => p.x))
  const maxX = Math.max(...pts.map((p) => p.x))
  const minY = Math.min(...pts.map((p) => p.y))
  const maxY = Math.max(...pts.map((p) => p.y))
  const scale = Math.min((boxW - 2 * padX) / (maxX - minX), (boxH - 2 * padTop) / (maxY - minY))
  const w = (maxX - minX) * scale
  const h = (maxY - minY) * scale
  const ox = padX + (boxW - 2 * padX - w) / 2
  const oy = padTop + (boxH - 2 * padTop - h) / 2
  // screen: flip y
  return pts.map((p) => ({ x: ox + (p.x - minX) * scale, y: oy + (maxY - p.y) * scale }))
}

export function TrussRescueStep({ step, setChecker, locked }: InteractiveStepProps<TRStep>) {
  const panels = step.panels
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'angle' | 'type'>('angle')
  const [finished, setFinished] = useState(false)
  const [wrong, setWrong] = useState<string | null>(null)

  useEffect(() => {
    setChecker(() => finished)
  }, [finished, setChecker])

  const showDone = finished || locked
  const panel = panels[Math.min(idx, panels.length - 1)]
  const missing = 180 - panel.a - panel.b
  const trueType = classify([panel.a, panel.b, missing])
  const choices = useMemo(() => angleChoices(panel.a, panel.b), [panel.a, panel.b])

  const VB_W = 300
  const VB_H = 190
  const [A, B, C] = trianglePoints(panel.a, panel.b, VB_W, VB_H, 46, 30)
  const centroid = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 }
  const labelPos = (p: { x: number; y: number }, gap = 18) => {
    const dx = p.x - centroid.x
    const dy = p.y - centroid.y
    const m = Math.hypot(dx, dy) || 1
    return { x: p.x + (dx / m) * gap, y: p.y + (dy / m) * gap + 4 }
  }
  const la = labelPos(A)
  const lb = labelPos(B)
  const lc = labelPos(C)

  const flash = (id: string) => {
    setWrong(id)
    window.setTimeout(() => setWrong((w) => (w === id ? null : w)), 380)
  }

  const onAngle = (v: number) => {
    if (locked || showDone) return
    if (v === missing) setPhase('type')
    else flash(`a${v}`)
  }
  const onType = (t: TriType) => {
    if (locked || showDone) return
    if (t === trueType) {
      if (idx + 1 >= panels.length) setFinished(true)
      else {
        setIdx(idx + 1)
        setPhase('angle')
      }
    } else {
      flash(`t${t}`)
    }
  }

  const repaired = showDone ? panels.length : idx

  return (
    <div className="interactive">
      {/* Bridge progress */}
      <div className="tr-bridge">
        {panels.map((_, i) => (
          <span
            key={i}
            className="tr-seg"
            data-state={showDone || i < repaired ? 'fixed' : i === idx ? 'active' : 'broken'}
          />
        ))}
      </div>

      <div className="tr-scene">
        <div className="tr-panel-tag">
          {showDone ? 'Bridge secured' : `Panel ${idx + 1} of ${panels.length}${panel.context ? ` · ${panel.context}` : ''}`}
        </div>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="interactive-svg" style={{ maxHeight: 220 }}>
          <defs>
            <linearGradient id="tr-steel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--accent-bg)" />
              <stop offset="1" stopColor="var(--accent-bg)" />
            </linearGradient>
          </defs>
          {/* triangle */}
          <polygon
            points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
            fill="url(#tr-steel)"
            stroke="var(--accent)"
            strokeWidth={3.5}
            strokeLinejoin="round"
          />
          {/* rivets */}
          {[A, B, C].map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--accent)" />
          ))}
          {/* corner labels: known angles + the unknown / solved corner */}
          <text x={la.x} y={la.y} fontSize={14} fontWeight={700} textAnchor="middle" fill="var(--text-h)">{panel.a}°</text>
          <text x={lb.x} y={lb.y} fontSize={14} fontWeight={700} textAnchor="middle" fill="var(--text-h)">{panel.b}°</text>
          <text
            x={lc.x}
            y={lc.y}
            fontSize={15}
            fontWeight={800}
            textAnchor="middle"
            fill={phase === 'type' || showDone ? '#2c9c79' : 'var(--accent)'}
          >
            {phase === 'type' || showDone ? `${missing}°` : '?'}
          </text>
        </svg>
        {panel.spec && !showDone && <p className="tr-spec">📋 {panel.spec}</p>}
      </div>

      {/* Controls */}
      {showDone ? (
        <p className="tr-win">🌉 All panels repaired — the bridge holds. Press Continue.</p>
      ) : phase === 'angle' ? (
        <>
          <p className="sort-help">Fit the missing corner: what is the third angle?</p>
          <div className="tr-row">
            {choices.map((v) => (
              <button
                key={v}
                type="button"
                className="tr-chip"
                data-wrong={wrong === `a${v}` ? 'true' : 'false'}
                onClick={() => onAngle(v)}
                disabled={locked}
              >
                {v}°
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="sort-help">Now certify it: what type of triangle is this panel?</p>
          <div className="tr-row">
            {(['acute', 'right', 'obtuse'] as TriType[]).map((t) => (
              <button
                key={t}
                type="button"
                className="tr-stamp"
                data-wrong={wrong === `t${t}` ? 'true' : 'false'}
                onClick={() => onType(t)}
                disabled={locked}
              >
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </>
      )}

      <style>{`
        .tr-bridge { display: flex; gap: 6px; justify-content: center; margin-bottom: 10px; }
        .tr-seg { width: 46px; height: 7px; border-radius: 4px; background: var(--border); transition: background 200ms ease; }
        .tr-seg[data-state="active"] { background: var(--accent); }
        .tr-seg[data-state="fixed"] { background: #37b893; }
        .tr-scene { display: flex; flex-direction: column; align-items: center; }
        .tr-panel-tag { font-size: 13px; font-weight: 700; color: var(--muted); margin-bottom: 2px; }
        .tr-spec { font-size: 13px; color: var(--text); margin: 4px 0 0; text-align: center; }
        .tr-win { text-align: center; font-weight: 700; color: #2c9c79; margin: 10px 0 0; }
        .tr-row { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 4px; }
        .tr-chip, .tr-stamp {
          min-width: 64px; height: 46px; padding: 0 16px;
          border: 2px solid var(--border); border-radius: 12px;
          background: var(--card); color: var(--text-h);
          font-size: 17px; font-weight: 700; cursor: pointer;
          transition: border-color 120ms ease, transform 80ms ease, background 120ms ease;
        }
        .tr-chip:hover:not(:disabled), .tr-stamp:hover:not(:disabled) { border-color: var(--accent); }
        .tr-chip:disabled, .tr-stamp:disabled { cursor: default; opacity: 0.6; }
        .tr-chip[data-wrong="true"], .tr-stamp[data-wrong="true"] {
          border-color: #e9696b; background: rgba(233,105,107,0.12); animation: tr-shake 0.38s;
        }
        @keyframes tr-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
      `}</style>
    </div>
  )
}
