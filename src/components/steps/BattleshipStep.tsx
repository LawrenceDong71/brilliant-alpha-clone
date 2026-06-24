import { useEffect, useState } from 'react'
import type { BattleshipStep as BStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import type { BoardPreview, BoardShip, Coord } from './battleship/types'
import { useBattleship } from './battleship/useBattleship'
import { BattleBoard } from './battleship/BattleBoard'
import { PlacementControls } from './battleship/PlacementControls'
import { BattleHud } from './battleship/BattleHud'
import { ConceptRecap } from './battleship/ConceptRecap'
import { cellsOfSegment, isHit, isLegalPlacement, segmentLength } from './battleship/battleshipGeo'

/** Concept check, grounded in what the learner just did, gates completion alongside the win. */
const QUIZ = {
  question:
    'A ship runs in a straight line from (2, 3) to (2, 6). In geometry, what is that ship?',
  options: [
    { id: 'point', label: 'A point' },
    { id: 'ray', label: 'A ray (one endpoint, goes on forever)' },
    { id: 'segment', label: 'A segment (two endpoints, finite length)' },
    { id: 'line', label: 'A line (no endpoints)' },
  ],
  correctId: 'segment',
  explanation:
    'A segment — it has two endpoints (a start and an end) and a finite, countable length. A ray has one endpoint and runs forever; a line has none.',
}

export function BattleshipStep({ step, setChecker, locked }: InteractiveStepProps<BStep>) {
  const game = useBattleship({ size: step.size ?? 8, fleet: step.fleet ?? [2, 3, 4] })
  const size = game.size

  const [anchor, setAnchor] = useState<Coord | null>(null)
  const [hover, setHover] = useState<Coord | null>(null)
  const [quizId, setQuizId] = useState<string | null>(null)
  const quizCorrect = quizId === QUIZ.correctId

  useEffect(() => {
    setChecker(() => game.won && quizCorrect)
  }, [game.won, quizCorrect, setChecker])

  // --- placement (own board, during 'placing') ---
  const onPlaceClick = (c: Coord) => {
    if (locked || game.phase !== 'placing') return
    if (!anchor) {
      if (isHit(game.playerFleet, c)) {
        game.removeShipAt(c) // tap a placed ship to pick it back up
        return
      }
      setAnchor(c)
      return
    }
    game.placeShip(anchor, c)
    setAnchor(null)
  }

  // --- firing (enemy board, during 'battle') ---
  const onFireClick = (c: Coord) => {
    if (locked) return
    if (game.canFireAt(c)) game.fireAt(c)
  }

  let placementPreview: BoardPreview | null = null
  if (game.phase === 'placing' && anchor) {
    if (hover && (hover.x === anchor.x || hover.y === anchor.y)) {
      const cells = cellsOfSegment(anchor, hover)
      const len = segmentLength(anchor, hover)
      const slotFree = game.placement.slots.some((s) => !s.placed && s.length === len)
      const legal = slotFree && isLegalPlacement(game.playerFleet, anchor, hover, size, game.allowTouch)
      placementPreview = { kind: 'placement', cells, legal }
    } else {
      placementPreview = { kind: 'placement', cells: [anchor], legal: true }
    }
  }

  // Reveal only sunk enemy ships on the target board.
  const revealedEnemy: BoardShip[] = []
  for (const s of game.enemyFleet) {
    if (s.sunk && s.start && s.end && s.orientation) {
      revealedEnemy.push({ id: s.id, start: s.start, end: s.end, orientation: s.orientation, sunk: true })
    }
  }
  const yourFleet: BoardShip[] = game.playerFleet

  const placing = game.phase === 'placing'
  const fireable = game.phase === 'battle' && game.isPlayerTurn && !game.aiThinking && !locked

  return (
    <div className="interactive battleship">
      <BattleHud
        phase={game.phase}
        turn={game.turn}
        isPlayerTurn={game.isPlayerTurn}
        aiThinking={game.aiThinking}
        playerRemaining={game.remaining.player}
        enemyRemaining={game.remaining.enemy}
        lastShot={game.lastShot}
        lastAnnouncement={game.lastAnnouncement}
        stats={game.stats}
        onPlayAgain={game.playAgain}
      />

      <div className="battle-boards">
        <div className="battle-board-panel">
          <div className="battle-board-title">Enemy waters {placing ? '· hidden' : '· fire here'}</div>
          <BattleBoard
            mode="target"
            size={size}
            ships={revealedEnemy}
            shots={game.playerShots}
            interactive={fireable}
            onCellClick={onFireClick}
            title="Enemy waters — tap a coordinate to fire a shot (a point)."
          />
        </div>
        <div className="battle-board-panel">
          <div className="battle-board-title">Your fleet {placing ? '· place ships' : ''}</div>
          <BattleBoard
            mode="own"
            size={size}
            ships={yourFleet}
            shots={game.enemyShots}
            preview={placementPreview}
            interactive={placing && !locked}
            onCellClick={onPlaceClick}
            onCellHover={setHover}
            title="Your fleet — each ship is a segment between two endpoints."
          />
        </div>
      </div>

      {placing && (
        <PlacementControls
          slots={game.placement.slots}
          canStart={game.canStart}
          onAutoPlace={game.autoPlace}
          onClear={game.clearPlacement}
          onReady={game.ready}
          disabled={locked}
        />
      )}

      <ConceptRecap
        visible={game.gameOver}
        outcome={game.won ? 'won' : 'lost'}
        stats={game.stats}
        question={QUIZ.question}
        options={QUIZ.options}
        correctId={QUIZ.correctId}
        explanation={QUIZ.explanation}
        selectedId={quizId}
        onSelect={setQuizId}
        locked={locked}
      />
    </div>
  )
}
