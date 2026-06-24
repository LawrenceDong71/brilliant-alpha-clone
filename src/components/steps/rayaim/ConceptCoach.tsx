import type { CSSProperties } from 'react'
import type { GamePhase } from './useLighthouseGame'

// HTML (DOM) teaching panel rendered ABOVE the ray-aim game canvas. All theming
// comes from the app's CSS custom properties so the card reads well in light and
// dark themes without any external CSS classes.

interface ConceptCoachProps {
  phase: GamePhase
  directionDeg: number
  endpointCoord: { x: number; y: number }
  shipCoord: { x: number; y: number }
  distanceUnits: number
  illuminated: boolean
  won: boolean
}

export function ConceptCoach({
  phase,
  directionDeg,
  endpointCoord,
  shipCoord,
  distanceUnits,
  illuminated,
  won,
}: ConceptCoachProps) {
  // Normalise the beam heading into a friendly 0..360 reading.
  const directionNorm = Math.round(((directionDeg % 360) + 360) % 360)

  const facts = [
    { value: `${directionNorm}°`, label: 'Direction (θ from east)' },
    { value: `(${endpointCoord.x}, ${endpointCoord.y})`, label: 'Endpoint · fixed' },
    { value: `(${shipCoord.x.toFixed(1)}, ${shipCoord.y.toFixed(1)})`, label: 'Ship' },
    { value: distanceUnits.toFixed(1), label: 'Units to harbor' },
  ]

  // A leading status dot carries the state colour so the teaching copy itself can
  // stay high-contrast (var(--text-h)) in every theme.
  let toneColor: string
  let message: string
  if (won || phase === 'arrived') {
    toneColor = 'var(--good)'
    message =
      "Home! Notice the endpoint never moved — you only changed the ray's direction, and the ray still ran past the ship forever."
  } else if (illuminated || phase === 'guiding') {
    toneColor = 'var(--accent)'
    message = 'The ray now passes through the ship — direction θ. A ray keeps going past the ship, never stopping.'
  } else if (phase === 'drifting') {
    toneColor = 'var(--warn)'
    message = "The ship is off the ray, in the dark. Rotate the ray's direction so it covers the ship."
  } else {
    toneColor = 'var(--muted)'
    message = "Drag to set the ray's direction. It always begins at the lighthouse endpoint and extends forever."
  }

  return (
    <section style={card}>
      <header style={headerRow}>
        <span style={eyebrow}>RAY</span>
        <span style={definition}>
          Starts at one fixed endpoint (the lighthouse) and shoots out forever in a single direction.
        </span>
      </header>

      <div style={factsRow}>
        {facts.map((fact) => (
          <div key={fact.label} style={factCell}>
            <span style={factValue}>{fact.value}</span>
            <span style={factLabel}>{fact.label}</span>
          </div>
        ))}
      </div>

      <p aria-live="polite" style={teachingLine}>
        <span aria-hidden={true} style={{ ...toneDot, background: toneColor }} />
        <span>{message}</span>
      </p>
    </section>
  )
}

const card: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 12,
  border: '1px solid var(--border)',
  borderRadius: 12,
  background: 'var(--card)',
  fontFamily: 'inherit',
}

const headerRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  gap: 8,
}

const eyebrow: CSSProperties = {
  flex: '0 0 auto',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--accent)',
}

const definition: CSSProperties = {
  flex: '1 1 220px',
  fontSize: 13,
  lineHeight: 1.4,
  color: 'var(--text)',
}

const factsRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 14,
  rowGap: 10,
}

const factCell: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}

const factValue: CSSProperties = {
  fontSize: 17,
  fontWeight: 800,
  lineHeight: 1.1,
  color: 'var(--accent)',
  fontVariantNumeric: 'tabular-nums',
}

const factLabel: CSSProperties = {
  fontSize: 10,
  lineHeight: 1.2,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

const teachingLine: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  margin: 0,
  fontSize: 13,
  lineHeight: 1.45,
  color: 'var(--text-h)',
}

const toneDot: CSSProperties = {
  flex: '0 0 auto',
  width: 8,
  height: 8,
  marginTop: 5,
  borderRadius: 999,
}
