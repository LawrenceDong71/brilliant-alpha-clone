import type { CSSProperties, ReactNode } from 'react'

// Accessible DOM (HTML) status overlay rendered below the ray-aim game canvas.
// Theming comes from the app's CSS custom properties so it tracks light/dark.

type GamePhase = 'idle' | 'drifting' | 'guiding' | 'arrived'

interface GameHudProps {
  progress: number
  phase: GamePhase
  distance?: number
  won: boolean
  reduceMotion?: boolean
}

export function GameHud({ progress, phase, distance, won, reduceMotion = false }: GameHudProps) {
  const ratio = Math.min(1, Math.max(0, progress))
  const pct = Math.round(ratio * 100)
  const isHome = won || phase === 'arrived'

  // Each phase gets a distinct SHAPE (check / triangle / dashed ring / double arrow)
  // so the cue survives even when colour is imperceptible.
  let statusIcon: ReactNode
  let statusText: string
  let statusColor: string
  if (isHome) {
    statusColor = 'var(--good)'
    statusText = 'Home! The ship reached the harbor.'
    statusIcon = (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden={true} style={iconSvg}>
        <path d="M3 8.5 L6.5 12 L13 4.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  } else if (phase === 'guiding') {
    statusColor = 'var(--text-h)'
    statusText = 'Sailing home — keep the light on it.'
    statusIcon = (
      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden={true} style={iconSvg}>
        <path d="M6 4 L11.5 8 L6 12 Z" fill="currentColor" />
      </svg>
    )
  } else if (phase === 'drifting') {
    statusColor = 'var(--warn)'
    statusText = 'Adrift — shine the beam on the ship so it can see.'
    statusIcon = (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden={true} style={iconSvg}>
        <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth={1.6} strokeDasharray="2.4 2.4" />
      </svg>
    )
  } else {
    statusColor = 'var(--muted)'
    statusText = 'Drag (or use ← →) to aim the lighthouse beam onto the ship.'
    statusIcon = (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden={true} style={iconSvg}>
        <path
          d="M2.5 8 H13.5 M5 5 L2.5 8 L5 11 M11 5 L13.5 8 L11 11"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  const distanceLabel =
    typeof distance === 'number' && !isHome ? `~${Math.max(0, Math.round(distance))}m to harbor` : null

  const fill: CSSProperties = {
    width: `${pct}%`,
    height: '100%',
    background: won ? 'var(--good)' : 'var(--accent)',
    borderRadius: 999,
    transition: reduceMotion ? 'none' : 'width 200ms ease',
  }

  const statusInner: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    color: statusColor,
    fontWeight: 600,
    lineHeight: 1.35,
  }

  return (
    <div style={container}>
      <div
        role="progressbar"
        aria-label="Voyage progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${pct}% of the way home`}
        style={track}
      >
        <div style={fill} />
      </div>

      <div aria-hidden={true} style={caption}>
        {pct}% of the way home
      </div>

      <div style={statusRow}>
        <span aria-live="polite" aria-atomic={true} style={statusInner}>
          <span style={iconWrap}>{statusIcon}</span>
          <span>{statusText}</span>
        </span>
        {distanceLabel !== null && <span style={distanceStyle}>{distanceLabel}</span>}
      </div>
    </div>
  )
}

const container: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  width: '100%',
  fontFamily: 'inherit',
}

const track: CSSProperties = {
  width: '100%',
  height: 8,
  background: 'var(--border)',
  borderRadius: 999,
  overflow: 'hidden',
}

const caption: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.2,
  color: 'var(--muted)',
}

const statusRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
}

const iconWrap: CSSProperties = {
  display: 'inline-flex',
  flex: '0 0 auto',
  width: 14,
  height: 14,
}

const iconSvg: CSSProperties = { display: 'block' }

const distanceStyle: CSSProperties = {
  marginLeft: 'auto',
  flex: '0 0 auto',
  fontSize: 12,
  color: 'var(--muted)',
  fontVariantNumeric: 'tabular-nums',
}
