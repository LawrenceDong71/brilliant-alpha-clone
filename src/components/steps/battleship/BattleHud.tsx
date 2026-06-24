import type { CSSProperties } from 'react'
import type {
  Announcement,
  FleetRemaining,
  GamePhase,
  GameStats,
  ShipPip,
  Shot,
  Turn,
} from './types'

interface BattleHudProps {
  phase: GamePhase
  turn: Turn
  isPlayerTurn: boolean
  aiThinking?: boolean
  playerRemaining: FleetRemaining
  enemyRemaining: FleetRemaining
  lastShot: Shot | null
  lastAnnouncement: Announcement | null
  stats?: GameStats
  onPlayAgain: () => void
}

/**
 * Accessible, theme-aware status column for the battleship step.
 * All colour comes from CSS custom properties, and every colour cue is paired
 * with a redundant non-colour cue (text, shape, or strike) for accessibility.
 */
export function BattleHud(props: BattleHudProps) {
  const {
    phase,
    isPlayerTurn,
    aiThinking = false,
    playerRemaining,
    enemyRemaining,
    lastShot,
    lastAnnouncement,
    stats,
    onPlayAgain,
  } = props

  let dotColor: string
  let statusMessage: string
  if (phase === 'won') {
    dotColor = 'var(--good)'
    statusMessage = 'Victory — you sank the enemy fleet!'
  } else if (phase === 'lost') {
    dotColor = 'var(--bad)'
    statusMessage = 'Your fleet was sunk. Play again?'
  } else if (phase === 'battle' && aiThinking) {
    dotColor = 'var(--warn)'
    statusMessage = 'Enemy is taking aim…'
  } else if (phase === 'battle' && isPlayerTurn) {
    dotColor = 'var(--accent)'
    statusMessage = 'Your turn — fire a shot (a point).'
  } else {
    dotColor = 'var(--muted)'
    statusMessage = 'Place your fleet to begin.'
  }

  const gameOver = phase === 'won' || phase === 'lost'

  return (
    <div style={card}>
      <div style={statusRow} aria-live="polite" aria-atomic={true}>
        <span aria-hidden={true} style={{ ...dotBase, background: dotColor }} />
        <span>{statusMessage}</span>
      </div>

      {lastShot !== null && (
        <div style={lastShotRow}>
          {`Last shot (${lastShot.coord.x}, ${lastShot.coord.y}): `}
          <span style={{ color: lastShot.result === 'hit' ? 'var(--good)' : 'var(--warn)', fontWeight: 700 }}>
            {lastShot.result === 'hit' ? 'HIT' : 'MISS'}
          </span>
        </div>
      )}

      {lastAnnouncement?.kind === 'sink' && (
        <div
          style={{
            ...sinkLine,
            color: lastAnnouncement.by === 'player' ? 'var(--good)' : 'var(--warn)',
          }}
        >
          {lastAnnouncement.message}
        </div>
      )}

      <FleetRow label="Enemy fleet" fleet={enemyRemaining} afloatColor="var(--accent)" />
      <FleetRow label="Your fleet" fleet={playerRemaining} afloatColor="var(--good)" />

      {gameOver && (
        <div style={endBlock}>
          {stats !== undefined && (
            <div style={statsLine}>
              {`Shots fired: ${stats.shotsFired} · Accuracy: ${Math.round(stats.accuracy * 100)}%`}
            </div>
          )}
          <button
            type="button"
            className={phase === 'lost' ? 'btn primary full' : 'btn full'}
            onClick={onPlayAgain}
          >
            Play again
          </button>
        </div>
      )}
    </div>
  )
}

interface FleetRowProps {
  label: string
  fleet: FleetRemaining
  afloatColor: string
}

function FleetRow({ label, fleet, afloatColor }: FleetRowProps) {
  return (
    <div
      role="img"
      aria-label={`${label}: ${fleet.afloat} of ${fleet.total} afloat`}
      style={fleetRow}
    >
      <span style={fleetLabel}>{label}</span>
      <span style={pipWrap}>
        {fleet.pips.map((pip) => (
          <Pip key={pip.shipId} pip={pip} afloatColor={afloatColor} />
        ))}
      </span>
    </div>
  )
}

interface PipProps {
  pip: ShipPip
  afloatColor: string
}

function Pip({ pip, afloatColor }: PipProps) {
  const style: CSSProperties = {
    position: 'relative',
    flex: '0 0 auto',
    width: 8 + pip.length * 3,
    height: 8,
    borderRadius: 3,
    boxSizing: 'border-box',
    background: pip.sunk ? 'transparent' : afloatColor,
    border: pip.sunk ? '1.5px solid var(--bad)' : 'none',
  }
  return <span style={style}>{pip.sunk && <span aria-hidden={true} style={strike} />}</span>
}

const card: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  width: '100%',
  fontFamily: 'inherit',
  fontSize: 13,
  lineHeight: 1.4,
  color: 'var(--text-h)',
}

const statusRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontWeight: 600,
}

const dotBase: CSSProperties = {
  flex: '0 0 auto',
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
}

const lastShotRow: CSSProperties = {
  color: 'var(--muted)',
  fontVariantNumeric: 'tabular-nums',
}

const sinkLine: CSSProperties = {
  fontWeight: 600,
}

const fleetRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const fleetLabel: CSSProperties = {
  flex: '0 0 auto',
  width: 76,
  color: 'var(--muted)',
  fontSize: 12,
}

const pipWrap: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 4,
}

const strike: CSSProperties = {
  position: 'absolute',
  left: 1,
  right: 1,
  top: '50%',
  height: 1.5,
  transform: 'translateY(-50%)',
  background: 'var(--bad)',
  borderRadius: 1,
}

const endBlock: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginTop: 2,
}

const statsLine: CSSProperties = {
  color: 'var(--muted)',
  fontVariantNumeric: 'tabular-nums',
}
