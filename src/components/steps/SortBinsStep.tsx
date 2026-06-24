import { useEffect, useMemo, useState } from 'react'
import type { SortBinsStep as SortStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'

export function SortBinsStep({ step, setChecker, locked }: InteractiveStepProps<SortStep>) {
  const [assign, setAssign] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(step.items.map((i) => [i.id, null])),
  )
  const [selected, setSelected] = useState<string | null>(null)

  const allCorrect = useMemo(
    () => step.items.every((i) => assign[i.id] === i.correctBin),
    [assign, step.items],
  )

  useEffect(() => {
    setChecker(() => allCorrect)
  }, [allCorrect, setChecker])

  const placeIn = (binId: string | null) => {
    if (locked || !selected) return
    setAssign((prev) => ({ ...prev, [selected]: binId }))
    setSelected(null)
  }

  const tray = step.items.filter((i) => assign[i.id] === null)

  const chip = (id: string, label: string) => (
    <button
      key={id}
      type="button"
      disabled={locked}
      className={`sort-chip${selected === id ? ' selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        setSelected((s) => (s === id ? null : id))
      }}
    >
      {label}
    </button>
  )

  return (
    <div className="sortbins">
      <div className="sort-tray" onClick={() => placeIn(null)}>
        {tray.length > 0 ? (
          tray.map((i) => chip(i.id, i.label))
        ) : (
          <span className="sort-tray-empty">All sorted — check your answer!</span>
        )}
      </div>

      <div className="sort-bins">
        {step.bins.map((bin) => (
          <div key={bin.id} className="sort-bin" onClick={() => placeIn(bin.id)}>
            <span className="sort-bin-label">{bin.label}</span>
            <div className="sort-bin-items">
              {step.items
                .filter((i) => assign[i.id] === bin.id)
                .map((i) => chip(i.id, i.label))}
            </div>
          </div>
        ))}
      </div>
      <p className="sort-help">{selected ? 'Now tap a category to drop it in.' : 'Tap an item, then tap a category.'}</p>
    </div>
  )
}
