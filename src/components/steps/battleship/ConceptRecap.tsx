import type { CSSProperties } from 'react'
import type { GameStats } from './types'

export interface ConceptQuestion {
  id: string
  prompt: string
  options: { id: string; label: string }[]
  correctId: string
  explanation: string
}

export interface ConceptRecapProps {
  visible: boolean
  outcome: 'won' | 'lost'
  stats: GameStats
  questions: ConceptQuestion[]
  answers: Record<string, string>
  onSelect: (questionId: string, optionId: string) => void
  locked?: boolean
}

// Plain-DOM wrap-up shown beneath the battleship game once the match resolves.
// It deliberately does NOT reveal any geometry up front: each concept check
// only surfaces its explanation after the learner answers it correctly. Reuses
// the app's existing .mc/.feedback CSS so it tracks light/dark theming.
export function ConceptRecap({
  visible,
  outcome,
  stats,
  questions,
  answers,
  onSelect,
  locked = false,
}: ConceptRecapProps) {
  if (!visible) return null

  const won = outcome === 'won'
  const allCorrect = questions.every((q) => answers[q.id] === q.correctId)

  // Spoiler-free intro — no point/segment/line answers before the questions.
  const intro = won
    ? 'Fleet sunk! Now connect what you just did to the geometry.'
    : 'Tough match — but you played the round. Connect what you just did to the geometry below (or hit Play again to chase a win first).'

  const statsLine = `Shots fired: ${stats.shotsFired} · Accuracy: ${Math.round(
    stats.accuracy * 100,
  )}% · Ships sunk: ${stats.enemyShipsSunk}`

  return (
    <>
      <div style={card}>
        <p style={eyebrow}>{won ? 'FLEET SUNK' : 'FLEET LOST'}</p>
        <p style={introText}>{intro}</p>
        <p style={statsText}>{statsLine}</p>
      </div>

      {questions.map((q, i) => {
          const selectedId = answers[q.id] ?? null
          const isCorrect = selectedId === q.correctId
          const answeredWrong = selectedId !== null && !isCorrect

          return (
            <div className="mc" key={q.id}>
              <div>
                <p style={checkEyebrow}>CONCEPT CHECK {i + 1} OF {questions.length}</p>
                <p style={questionText}>{q.prompt}</p>
              </div>

              <div
                className="mc-options"
                role="group"
                aria-label={`Concept check ${i + 1} options`}
              >
                {q.options.map((o) => {
                  const selected = selectedId === o.id
                  // Lock the options for a question once it's answered correctly.
                  const optionLocked = locked || isCorrect
                  return (
                    <button
                      key={o.id}
                      type="button"
                      className={`mc-option ${selected ? 'selected' : ''}`}
                      disabled={optionLocked}
                      aria-pressed={selected}
                      onClick={() => onSelect(q.id, o.id)}
                    >
                      {o.label}
                    </button>
                  )
                })}
              </div>

              {isCorrect ? (
                <div className="feedback correct">{q.explanation}</div>
              ) : answeredWrong ? (
                <div className="feedback hint">
                  Not quite — count the endpoints and picture how far it runs. Try again.
                </div>
              ) : (
                <p style={hintNote}>Pick an answer to continue.</p>
              )}
            </div>
          )
        })}

      {allCorrect && (
        <div style={card}>
          <p style={eyebrow}>NICELY DONE</p>
          <p style={introText}>
            Every shot you fired was a <strong>point</strong> — a single location named by an
            ordered pair (x, y). Every ship was a <strong>segment</strong> — two endpoints and a
            fixed, countable length, which is exactly why it could be sunk. A <strong>ray</strong>{' '}
            (one endpoint) or a <strong>line</strong> (no endpoints) runs on forever, so it could
            never be finished off. Points locate; segments measure.
          </p>
        </div>
      )}
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

const introText: CSSProperties = {
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

const hintNote: CSSProperties = {
  color: 'var(--muted)',
  fontSize: 13,
}
