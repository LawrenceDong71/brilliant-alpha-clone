import { useEffect, useMemo, useState } from 'react'
import type { MirrorGridStep as MStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'

const VB = 300
const PAD = 22

export function MirrorGridStep({ step, setChecker, locked }: InteractiveStepProps<MStep>) {
  const { cols, rows, given, axis } = step
  const S = (VB - 2 * PAD) / Math.max(cols, rows)
  const offX = PAD + (VB - 2 * PAD - cols * S) / 2
  const offY = PAD + (VB - 2 * PAD - rows * S) / 2
  const gx = (c: number) => offX + c * S
  const gy = (r: number) => offY + (rows - 1 - r) * S

  const mirror = (c: number, r: number): [number, number] =>
    axis === 'vertical' ? [cols - 1 - c, r] : [c, rows - 1 - r]

  const givenSet = useMemo(() => new Set(given.map(([c, r]) => `${c},${r}`)), [given])
  const expected = useMemo(
    () => new Set(given.map(([c, r]) => mirror(c, r).join(','))),
    [given], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const [painted, setPainted] = useState<Set<string>>(new Set())

  useEffect(() => {
    setChecker(
      () => painted.size === expected.size && [...expected].every((k) => painted.has(k)),
    )
  }, [painted, expected, setChecker])

  const toggle = (c: number, r: number) => {
    if (locked) return
    const k = `${c},${r}`
    if (givenSet.has(k)) return
    setPainted((prev) => {
      const n = new Set(prev)
      if (n.has(k)) n.delete(k)
      else n.add(k)
      return n
    })
  }

  const cellsAll: Array<[number, number]> = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cellsAll.push([c, r])

  const mLineX = axis === 'vertical' ? gx(cols / 2) : null
  const mLineY = axis === 'horizontal' ? gy(rows / 2 - 1) + S : null

  return (
    <div className="interactive">
      <p className="sort-help">
        {step.instruction ?? 'Tap cells to paint the mirror image across the dashed line.'}
      </p>
      <svg viewBox={`0 0 ${VB} ${VB}`} className="interactive-svg" style={{ touchAction: 'none' }}>
        {cellsAll.map(([c, r]) => {
          const k = `${c},${r}`
          const isGiven = givenSet.has(k)
          const isPaint = painted.has(k)
          return (
            <rect
              key={k}
              x={gx(c)}
              y={gy(r)}
              width={S}
              height={S}
              rx={2}
              fill={isGiven ? '#7c5cff' : isPaint ? '#b49cff' : 'var(--card)'}
              stroke="var(--border)"
              strokeWidth={1}
              style={{ cursor: !isGiven && !locked ? 'pointer' : 'default' }}
              onClick={() => toggle(c, r)}
            />
          )
        })}
        {mLineX !== null && (
          <line x1={mLineX} y1={offY} x2={mLineX} y2={offY + rows * S} stroke="var(--accent)" strokeWidth={2} strokeDasharray="6 5" />
        )}
        {mLineY !== null && (
          <line x1={offX} y1={mLineY} x2={offX + cols * S} y2={mLineY} stroke="var(--accent)" strokeWidth={2} strokeDasharray="6 5" />
        )}
      </svg>
      <button type="button" className="btn ghost full" disabled={locked || painted.size === 0} onClick={() => setPainted(new Set())}>
        Start over
      </button>
    </div>
  )
}
