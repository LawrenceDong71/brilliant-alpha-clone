import type { CSSProperties } from 'react'
import type { GameStats } from './types'

interface ConceptQuizOption {
  id: string
  label: string
}

export interface ConceptRecapProps {
  visible: boolean
  outcome: 'won' | 'lost'
  stats: GameStats
  question: string
  options: ConceptQuizOption[]
  correctId: string
  explanation: string
  selectedId: string | null
  onSelect: (id: string) => void
  locked?: boolean
}

// Plain-DOM wrap-up shown beneath the battleship game once the match resolves.
// It restates the core geometry (shot = POINT, ship = SEGMENT) and reuses the
// app's existing .mc/.feedback CSS so it tracks light/dark theming automatically.
export function ConceptRecap({
  visible,
  outcome,
  stats,
  question,
  options,
  correctId,
  explanation,
  selectedId,
  onSelect,
  locked = false,
}: ConceptRecapProps) {
  if (!visible) return null

  const won = outcome === 'won'
  const isCorrect = selectedId === correctId

  const recap = won
    ? 'Every shot you fired was a POINT — one cell named by an ordered pair (x, y). Every ship was a SEGMENT — two endpoints and a length you could count (cells = |difference| + 1). That finite length is exactly why a ship can be sunk: a ray (one endpoint) or a line (no endpoints) never ends. Points locate; segments measure.'
    : 'Fleet lost — but the geometry still holds. Every shot is a POINT (x, y), and every ship is a SEGMENT with two endpoints and a countable length. Reset, take aim, and try again.'

  const statsLine = `Shots fired: ${stats.shotsFired} · Accuracy: ${Math.round(
    stats.accuracy * 100,
  )}% · Segments sunk: ${stats.enemyShipsSunk}`

  return (
    <>
      <div style={card}>
        <p style={eyebrow}>{won ? 'MISSION COMPLETE' : 'FLEET LOST'}</p>
        <p style={recapText}>{recap}</p>
        <p style={statsText}>{statsLine}</p>
      </div>

      <div className="mc">
        <div>
          <p style={checkEyebrow}>CONCEPT CHECK</p>
          <p style={questionText}>{question}</p>
        </div>

        <div className="mc-options" role="group" aria-label="Concept check options">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`mc-option ${selectedId === o.id ? 'selected' : ''}`}
              disabled={locked}
              aria-pressed={selectedId === o.id}
              onClick={() => onSelect(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>

        {isCorrect ? (
          <div className="feedback correct">{explanation}</div>
        ) : selectedId !== null ? (
          <div className="feedback hint">
            Not quite — count the endpoints, and remember a shot is a single point. Try again.
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Answer to complete the lesson.</p>
        )}
      </div>
    </>
  )
}

const card: CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const eyebrow: CSSProperties = {
  color: 'var(--accent)',
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: '0.04em',
}

const recapText: CSSProperties = {
  color: 'var(--text)',
  fontSize: 14,
  lineHeight: 1.5,
}

const statsText: CSSProperties = {
  color: 'var(--muted)',
  fontSize: 12,
  fontVariantNumeric: 'tabular-nums',
}

const checkEyebrow: CSSProperties = {
  color: 'var(--accent)',
  fontWeight: 700,
  fontSize: 13,
}

const questionText: CSSProperties = {
  color: 'var(--text-h)',
  fontWeight: 600,
  fontSize: 16,
}
