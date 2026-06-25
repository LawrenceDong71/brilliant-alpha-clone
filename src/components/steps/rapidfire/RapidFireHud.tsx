import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { RapidFireHudProps } from './types'

/**
 * Accessible, theme-aware DOM control panel rendered below the rapid-fire court.
 * Colour comes from the app's CSS custom properties (tracks light/dark), and
 * every colour cue is paired with a redundant shape/glyph cue for accessibility.
 */
export function RapidFireHud(props: RapidFireHudProps) {
  const {
    phase,
    roundIndex,
    totalRounds,
    timeFraction,
    choices,
    selectedIndex,
    correctIndex,
    reveal,
    result,
    score,
    streak,
    bestStreak,
    finished,
    passed,
    passThreshold,
    onAnswer,
    onPlayAgain,
    reduceMotion = false,
  } = props

  const btnRefs = useRef<Array<HTMLButtonElement | null>>([])

  // Number keys 1..N answer the live round; arrows roam focus across choices.
  useEffect(() => {
    if (phase !== 'playing') return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1
        if (idx < choices.length) {
          e.preventDefault()
          onAnswer(idx)
        }
        return
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const buttons = btnRefs.current.filter((b): b is HTMLButtonElement => b !== null)
        if (buttons.length === 0) return
        e.preventDefault()
        const dir = e.key === 'ArrowRight' ? 1 : -1
        const current = buttons.findIndex((b) => b === document.activeElement)
        const from = current === -1 ? (dir === 1 ? -1 : 0) : current
        const next = (from + dir + buttons.length) % buttons.length
        buttons[next]?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [phase, choices, onAnswer])

  const frac = Math.max(0, Math.min(1, timeFraction))
  const accuracy = totalRounds > 0 ? Math.round((score / totalRounds) * 100) : 0

  const timerFill: CSSProperties = {
    width: `${Math.round(frac * 100)}%`,
    height: '100%',
    background: frac < 0.34 ? 'var(--warn)' : 'var(--accent)',
    borderRadius: 999,
    transition: reduceMotion ? 'none' : 'width 80ms linear',
  }

  return (
    <div style={panel}>
      {!finished && (
        <div style={topRow}>
          <span style={roundLabel}>{`Round ${roundIndex + 1} / ${totalRounds}`}</span>
          <span style={rightCluster}>
            <span style={scoreText}>
              <span aria-hidden={true} style={starStyle}>
                ★
              </span>{' '}
              {score}
            </span>
            {streak >= 2 && (
              <span style={streakPill} aria-label={`Streak ${streak}`}>
                <span aria-hidden={true}>🔥</span>
                {streak}
              </span>
            )}
          </span>
        </div>
      )}

      {phase === 'playing' && (
        <div
          style={timerTrack}
          role="progressbar"
          aria-label="Time remaining"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(frac * 100)}
        >
          <div style={timerFill} />
        </div>
      )}

      {!finished && (
        <div style={choicesRow} role="group" aria-label="Pick the launch angle">
          {choices.map((deg, i) => {
            const isSelected = selectedIndex === i
            const isCorrect = i === correctIndex
            const showCorrect = reveal && isCorrect
            const showWrong = reveal && isSelected && !isCorrect
            let style = choiceBase
            if (showCorrect) style = { ...choiceBase, ...correctChoice }
            else if (showWrong) style = { ...choiceBase, ...wrongChoice }
            const ariaLabel = showCorrect
              ? `${deg} degrees, correct answer`
              : showWrong
                ? `${deg} degrees, your pick, incorrect`
                : `${deg} degrees`
            return (
              <button
                key={deg}
                type="button"
                ref={(el) => {
                  btnRefs.current[i] = el
                }}
                className={`mc-option${isSelected && !reveal ? ' selected' : ''}`}
                style={style}
                disabled={phase !== 'playing'}
                aria-pressed={isSelected}
                aria-label={ariaLabel}
                onClick={() => onAnswer(i)}
              >
                <span>{`${deg}°`}</span>
                {showCorrect && (
                  <span aria-hidden={true} style={glyph}>
                    ✓
                  </span>
                )}
                {showWrong && (
                  <span aria-hidden={true} style={glyph}>
                    ✗
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {phase === 'playing' && <p className="sort-help">Tap a launch angle — or press 1–{choices.length}.</p>}

      <div aria-live="polite" aria-atomic={true} style={liveRegion}>
        {phase === 'reveal' && result === 'correct' && (
          <div className="feedback correct">{`Swish! ${choices[correctIndex]}°.`}</div>
        )}
        {phase === 'reveal' && result === 'wrong' && (
          <div className="feedback hint">
            {`Off — it was ${choices[correctIndex]}°, you picked ${
              selectedIndex != null ? choices[selectedIndex] : '—'
            }°.`}
          </div>
        )}
        {phase === 'reveal' && result === 'timeout' && (
          <div className="feedback hint">{`Time! It was ${choices[correctIndex]}°.`}</div>
        )}

        {finished && (
          <div style={resultsCard}>
            <div className="readout">
              <span className="readout-value">{`${score} / ${totalRounds}`}</span>
              <span className="readout-label">correct</span>
            </div>
            <div style={statsLine}>{`Accuracy ${accuracy}% · Best streak ${bestStreak}`}</div>
            {passed ? (
              <div className="feedback correct">Capstone cleared! Press Check below to finish.</div>
            ) : (
              <div className="feedback hint">{`You need ${passThreshold} to pass — give it another run.`}</div>
            )}
            <button type="button" className={passed ? 'btn full' : 'btn primary full'} onClick={onPlayAgain}>
              Play again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const panel: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  width: '100%',
  fontFamily: 'inherit',
}

const topRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  fontSize: 14,
}

const roundLabel: CSSProperties = {
  fontWeight: 700,
  color: 'var(--text-h)',
  fontVariantNumeric: 'tabular-nums',
}

const rightCluster: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
}

const scoreText: CSSProperties = {
  fontWeight: 700,
  color: 'var(--text-h)',
  fontVariantNumeric: 'tabular-nums',
}

const starStyle: CSSProperties = { color: 'var(--accent)' }

const streakPill: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 9px',
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--warn)',
  background: 'color-mix(in srgb, var(--warn) 14%, transparent)',
  border: '1px solid color-mix(in srgb, var(--warn) 40%, transparent)',
  fontVariantNumeric: 'tabular-nums',
}

const timerTrack: CSSProperties = {
  width: '100%',
  height: 8,
  background: 'var(--border)',
  borderRadius: 999,
  overflow: 'hidden',
}

const choicesRow: CSSProperties = {
  display: 'flex',
  gap: 10,
}

const choiceBase: CSSProperties = {
  flex: '1 1 0',
  minWidth: 0,
  textAlign: 'center',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  fontSize: 18,
  padding: '15px 10px',
  fontVariantNumeric: 'tabular-nums',
}

const correctChoice: CSSProperties = {
  borderColor: 'var(--good)',
  background: 'color-mix(in srgb, var(--good) 16%, var(--card))',
  color: 'var(--good)',
  fontWeight: 800,
  opacity: 1,
}

const wrongChoice: CSSProperties = {
  borderColor: 'var(--bad)',
  background: 'color-mix(in srgb, var(--bad) 16%, var(--card))',
  color: 'var(--bad)',
  fontWeight: 800,
  opacity: 1,
}

const glyph: CSSProperties = { fontWeight: 800, fontSize: 18, lineHeight: 1 }

const liveRegion: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const resultsCard: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  width: '100%',
}

const statsLine: CSSProperties = {
  textAlign: 'center',
  color: 'var(--muted)',
  fontSize: 13,
  fontVariantNumeric: 'tabular-nums',
}
