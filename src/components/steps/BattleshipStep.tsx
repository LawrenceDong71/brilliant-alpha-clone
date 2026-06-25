import { useEffect, useState } from 'react'
import type { BattleshipStep as BStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import type { BoardPreview, BoardShip, Coord } from './battleship/types'
import { useBattleship } from './battleship/useBattleship'
import { BattleBoard } from './battleship/BattleBoard'
import { PlacementControls } from './battleship/PlacementControls'
import { BattleHud } from './battleship/BattleHud'
import { ConceptRecap } from './battleship/ConceptRecap'
import type { ConceptQuestion } from './battleship/ConceptRecap'
import { cellsOfSegment, isHit, isLegalPlacement, segmentLength } from './battleship/battleshipGeo'

/**
 * Concept checks grounded in what the learner just did. Each one connects a game
 * action to its geometry name; answering all of them correctly completes the step.
 * The learner only needs to play one full match (win OR lose) to unlock them —
 * winning is not required. Answers are revealed only after each question is solved.
 */
const CONCEPT_CHECKS: ConceptQuestion[] = [
  {
    id: 'shot-is-point',
    prompt: 'In this game, what was each shot you fired?',
    options: [
      { id: 'point', label: 'A point — a single location named by an ordered pair (x, y)' },
      { id: 'segment', label: 'A segment — two endpoints and a length' },
      { id: 'ray', label: 'A ray — one endpoint, running on forever' },
      { id: 'line', label: 'A line — no endpoints at all' },
    ],
    correctId: 'point',
    explanation:
      'Right — each shot was a point. You named one exact cell with an ordered pair (x, y); it has a location but no length. Points locate.',
  },
  {
    id: 'ship-is-segment',
    prompt: 'What was each ship sitting on the grid?',
    options: [
      { id: 'segment', label: 'A segment — two endpoints and a fixed, countable length' },
      { id: 'point', label: 'A point — a single location with no length' },
      { id: 'ray', label: 'A ray — one endpoint, running on forever' },
      { id: 'line', label: 'A line — no endpoints, running on forever both ways' },
    ],
    correctId: 'segment',
    explanation:
      'Exactly — each ship was a segment: two endpoints with a length you could count (cells = |difference| + 1). Segments measure.',
  },
  {
    id: 'never-sink',
    prompt:
      'You could sink each ship because it had a definite length you could count. Which of these could you NEVER fully sink?',
    options: [
      { id: 'line', label: 'A line — no endpoints, runs forever both ways' },
      { id: 'segment', label: 'A 4-cell segment from (2, 3) to (2, 6)' },
      { id: 'point', label: 'A point at (5, 5)' },
      { id: 'ray', label: 'A ray — one endpoint, runs forever one way' },
    ],
    correctId: 'line',
    explanation:
      'A line — with no endpoints it runs forever in both directions, so it has no length to finish off. (A ray would also never end, but it still has one endpoint; a line has none.)',
  },
]

export function BattleshipStep({ step, setChecker, locked }: InteractiveStepProps<BStep>) {
  const game = useBattleship({ size: step.size ?? 8, fleet: step.fleet ?? [2, 3, 4] })
  const size = game.size

  const [anchor, setAnchor] = useState<Coord | null>(null)
  const [hover, setHover] = useState<Coord | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const onSelectAnswer = (questionId: string, optionId: string) =>
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
  const allChecksCorrect = CONCEPT_CHECKS.every((q) => answers[q.id] === q.correctId)

  useEffect(() => {
    // Play one match (win or lose) to unlock the checks; winning is not required.
    setChecker(() => game.gameOver && allChecksCorrect)
  }, [game.gameOver, allChecksCorrect, setChecker])

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
            title="Enemy waters — tap a cell to fire a shot."
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
            title="Your fleet — your ships are placed here."
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
        questions={CONCEPT_CHECKS}
        answers={answers}
        onSelect={onSelectAnswer}
        locked={locked}
      />
    </div>
  )
}
