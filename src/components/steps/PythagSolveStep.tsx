import { useEffect, useMemo, useState } from 'react'
import type { PythagSolveStep as PSStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'

interface Slot {
  id: string
  /** Left-hand side of this line, e.g. "10² =". */
  expr: string
  correct: number
  /** Trailing unit/text after the blank, e.g. " m". */
  suffix?: string
}

/** Deterministic shuffle so the tile order is stable across re-renders. */
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

export function PythagSolveStep({ step, setChecker, locked }: InteractiveStepProps<PSStep>) {
  const c = step.hypotenuse
  const a = step.knownLeg
  const b = step.targetLeg

  const slots = useMemo<Slot[]>(
    () => [
      { id: 'csq', expr: `${c}² =`, correct: c * c },
      { id: 'asq', expr: `${a}² =`, correct: a * a },
      { id: 'bsq', expr: `b² = ${c}² − ${a}² =`, correct: c * c - a * a },
      { id: 'b', expr: 'b = √b² =', correct: b, suffix: ' m' },
    ],
    [a, b, c],
  )

  // Correct answers plus misconception traps, as draggable number tiles.
  const tiles = useMemo(() => {
    const correct = [c * c, a * a, c * c - a * a, b]
    const traps = [c - a, c + a, c * c - a, a * a - (c - a) * (c - a), 2 * b, b * b - 1]
    const values = Array.from(new Set([...correct, ...traps])).filter((v) => v > 0)
    // Pad to a fuller bank if traps collided with correct values.
    for (const extra of [16, 80, 12, 48]) {
      if (values.length >= 10) break
      if (!values.includes(extra)) values.push(extra)
    }
    return shuffle(
      values.map((v) => ({ id: `t${v}`, value: v })),
      values.length * 7 + c,
    )
  }, [a, b, c])

  // slotId -> tileId
  const [placed, setPlaced] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)

  const usedTileIds = new Set(Object.values(placed))

  const ok =
    slots.every((s) => {
      const tileId = placed[s.id]
      if (!tileId) return false
      const tile = tiles.find((t) => t.id === tileId)
      return tile?.value === s.correct
    })

  useEffect(() => {
    setChecker(() => ok)
  }, [ok, setChecker])

  const onTileClick = (tileId: string) => {
    if (locked || usedTileIds.has(tileId)) return
    setSelected((prev) => (prev === tileId ? null : tileId))
  }

  const onSlotClick = (slotId: string) => {
    if (locked) return
    if (placed[slotId]) {
      // Tap a filled blank to clear it.
      setPlaced((prev) => {
        const n = { ...prev }
        delete n[slotId]
        return n
      })
      return
    }
    if (!selected) return
    setPlaced((prev) => ({ ...prev, [slotId]: selected }))
    setSelected(null)
  }

  const tileValue = (tileId?: string) => tiles.find((t) => t.id === tileId)?.value

  return (
    <div className="interactive">
      <div className="ps-figure">
        <RightTriangle c={c} a={a} />
      </div>

      <div className="ps-solution">
        {slots.map((s) => (
          <div key={s.id} className="ps-line">
            <span className="ps-expr">{s.expr}</span>
            <button
              type="button"
              className="ps-slot"
              data-filled={placed[s.id] ? 'true' : 'false'}
              onClick={() => onSlotClick(s.id)}
              disabled={locked}
            >
              {placed[s.id] ? tileValue(placed[s.id]) : ''}
            </button>
            {s.suffix && <span className="ps-expr">{s.suffix}</span>}
          </div>
        ))}
      </div>

      <div className="ps-tray">
        {tiles.map((t) => {
          const used = usedTileIds.has(t.id)
          return (
            <button
              key={t.id}
              type="button"
              className="ps-tile"
              data-selected={selected === t.id ? 'true' : 'false'}
              data-used={used ? 'true' : 'false'}
              onClick={() => onTileClick(t.id)}
              disabled={locked || used}
            >
              {t.value}
            </button>
          )
        })}
      </div>

      <p className="sort-help">
        Tap a number, then tap a blank to drop it in. Work out each step to free the missing leg b.
      </p>

      <style>{`
        .ps-figure { display: flex; justify-content: center; margin-bottom: 8px; }
        .ps-solution { display: flex; flex-direction: column; gap: 10px; margin: 4px auto 14px; width: fit-content; }
        .ps-line { display: flex; align-items: center; gap: 8px; font-size: 17px; color: var(--text-h); font-weight: 600; }
        .ps-expr { font-variant-numeric: tabular-nums; }
        .ps-slot {
          min-width: 52px; height: 40px; padding: 0 8px;
          border: 2px dashed var(--border); border-radius: 10px;
          background: var(--card); color: var(--text-h);
          font-size: 17px; font-weight: 700; font-variant-numeric: tabular-nums;
          cursor: pointer; transition: border-color 120ms ease, background 120ms ease;
        }
        .ps-slot[data-filled="true"] { border-style: solid; border-color: var(--accent); background: var(--accent-bg); }
        .ps-slot:disabled { cursor: default; }
        .ps-tray { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 6px; }
        .ps-tile {
          min-width: 46px; height: 40px; padding: 0 10px;
          border: 1.5px solid var(--border); border-radius: 10px;
          background: var(--card); color: var(--text-h);
          font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums;
          cursor: pointer; transition: transform 100ms ease, box-shadow 120ms ease, border-color 120ms ease;
        }
        .ps-tile[data-selected="true"] { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-bg); transform: translateY(-1px); }
        .ps-tile[data-used="true"] { opacity: 0.3; cursor: default; }
      `}</style>
    </div>
  )
}

/** Ladder right triangle: vertical wall a, horizontal base b (unknown), hypotenuse ladder c. */
function RightTriangle({ c, a }: { c: number; a: number }) {
  const W = 240
  const H = 150
  const ox = 56
  const oy = H - 26
  const wallH = 92
  const baseW = 132
  const corner = { x: ox, y: oy }
  const top = { x: ox, y: oy - wallH }
  const foot = { x: ox + baseW, y: oy }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="figure-svg" role="img" aria-label="Right triangle: wall, base, ladder">
      <polygon points={`${corner.x},${corner.y} ${foot.x},${foot.y} ${top.x},${top.y}`} fill="var(--accent-bg)" stroke="var(--border)" strokeWidth={1.5} />
      {/* wall (known leg a) */}
      <line x1={corner.x} y1={corner.y} x2={top.x} y2={top.y} stroke="#37b893" strokeWidth={4} strokeLinecap="round" />
      {/* base (unknown leg b) */}
      <line x1={corner.x} y1={corner.y} x2={foot.x} y2={foot.y} stroke="#5b8def" strokeWidth={4} strokeLinecap="round" />
      {/* ladder (hypotenuse c) */}
      <line x1={top.x} y1={top.y} x2={foot.x} y2={foot.y} stroke="#b8772e" strokeWidth={4} strokeLinecap="round" />
      <rect x={corner.x} y={corner.y - 12} width={12} height={12} fill="none" stroke="var(--fig-stroke)" strokeWidth={1.5} />
      <text x={corner.x - 8} y={(corner.y + top.y) / 2 + 4} fontSize={13} textAnchor="end" fill="#2c9c79" fontWeight={700}>{a} m</text>
      <text x={(corner.x + foot.x) / 2} y={oy + 18} fontSize={13} textAnchor="middle" fill="#3f6fd0" fontWeight={700}>b = ?</text>
      <text x={(top.x + foot.x) / 2 + 8} y={(top.y + foot.y) / 2 - 4} fontSize={13} fill="#9a5e1e" fontWeight={700}>{c} m</text>
    </svg>
  )
}
