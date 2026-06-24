interface RayQuizOption {
  id: string
  label: string
}

interface RayQuizProps {
  question: string
  options: RayQuizOption[]
  correctId: string
  explanation: string
  selectedId: string | null
  onSelect: (id: string) => void
  locked?: boolean
}

// Plain-DOM "concept check" shown beneath the ray-aim game once the ship is home.
// It reuses the app's existing .mc/.feedback CSS so it tracks light/dark theming.
export function RayQuiz({
  question,
  options,
  correctId,
  explanation,
  selectedId,
  onSelect,
  locked = false,
}: RayQuizProps) {
  const isCorrect = selectedId === correctId

  return (
    <div className="mc">
      <div>
        <p style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 13, letterSpacing: '0.04em' }}>
          CONCEPT CHECK
        </p>
        <p style={{ color: 'var(--text-h)', fontWeight: 600, fontSize: 16 }}>{question}</p>
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
          Not quite — think about which thing never moved while you played. Tap another answer.
        </div>
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          Pick the answer that matches what you just did, then press Check.
        </p>
      )}
    </div>
  )
}
