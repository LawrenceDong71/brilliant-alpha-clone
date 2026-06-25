import type { PlacementSlot } from './types'

interface PlacementControlsProps {
  slots: PlacementSlot[]
  canStart: boolean
  onAutoPlace: () => void
  onClear: () => void
  onReady: () => void
  disabled?: boolean
}

export function PlacementControls(props: PlacementControlsProps) {
  const { slots, canStart, onAutoPlace, onClear, onReady, disabled = false } = props

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p className="sort-help">
        Place your fleet: tap a start cell, then an end cell to lay each ship. Match the ship
        lengths listed below.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {slots.map((slot) => (
          <span
            key={slot.id}
            aria-label={`Ship length ${slot.length} ${slot.placed ? 'placed' : 'not placed'}`}
            style={{
              border: '1.5px solid',
              borderColor: slot.placed ? 'var(--good)' : 'var(--border)',
              color: slot.placed ? 'var(--good)' : 'var(--text-h)',
              padding: '4px 10px',
              borderRadius: 999,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {slot.placed ? '✓ ' : ''}length {slot.length}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="btn" onClick={onAutoPlace} disabled={disabled}>
          Auto-place
        </button>
        <button type="button" className="btn ghost" onClick={onClear} disabled={disabled}>
          Clear
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={onReady}
          disabled={!canStart || disabled}
        >
          Start battle
        </button>
      </div>
    </div>
  )
}
