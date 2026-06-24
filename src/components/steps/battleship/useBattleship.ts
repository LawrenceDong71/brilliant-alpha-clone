import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  Announcement,
  BattleshipConfig,
  Coord,
  EnemyShipView,
  GamePhase,
  GameStats,
  PlacementResult,
  PlacementSlot,
  Rng,
  Ship,
  Shot,
  Turn,
  UseBattleshipResult,
} from './types'
import {
  alreadyFiredAt,
  applyShot,
  cellsOfShip,
  checkPlacement,
  coordsEqual,
  fleetRemaining,
  inBounds,
  segmentLength,
} from './battleshipGeo'
import { aiNextShot, aiPlaceFleet, makeRng } from './ai'

const DEFAULT_FLEET: number[] = [2, 3, 4]

/** All render-facing game data. Derived values (stats/remaining/…) are recomputed in render. */
interface Game {
  phase: GamePhase
  turn: Turn
  aiThinking: boolean
  playerFleet: Ship[]
  playerShots: Shot[]
  enemyShots: Shot[]
  enemyView: EnemyShipView[] // redacted enemy fleet — geometry only when sunk
  slots: PlacementSlot[]
  lastShot: Shot | null
  lastAnnouncement: Announcement | null
  lastSunkLength: number | null
}

const makeSlots = (fleet: number[]): PlacementSlot[] =>
  fleet.map((length, i) => ({ id: `slot-${i + 1}`, length, placed: false }))

/** Reveal a ship's geometry to the player only once it has been sunk. */
const toEnemyView = (fleet: Ship[]): EnemyShipView[] =>
  fleet.map((s) =>
    s.sunk
      ? { id: s.id, length: s.length, sunk: true, start: s.start, end: s.end, orientation: s.orientation }
      : { id: s.id, length: s.length, sunk: false },
  )

const lengthOf = (fleet: Ship[], id: string): number => fleet.find((s) => s.id === id)?.length ?? 0

const makeInitial = (startingTurn: Turn, fleet: number[]): Game => ({
  phase: 'placing',
  turn: startingTurn,
  aiThinking: false,
  playerFleet: [],
  playerShots: [],
  enemyShots: [],
  enemyView: [],
  slots: makeSlots(fleet),
  lastShot: null,
  lastAnnouncement: null,
  lastSunkLength: null,
})

export function useBattleship(config?: BattleshipConfig): UseBattleshipResult {
  // ---- config (resolved purely every render; defaults applied here) ----
  const size = config?.size ?? 8
  const allowTouch = config?.allowTouch ?? true
  const enemyDelayMs = config?.enemyDelayMs ?? 700
  const startingTurn: Turn = config?.startingTurn ?? 'player'
  // Guard re-init by a stable VALUE key so a fresh `fleet` array of equal contents is a no-op.
  const fleetKey = (config?.fleet ?? DEFAULT_FLEET).join(',')
  const fleet = useMemo(() => fleetKey.split(',').map(Number), [fleetKey])

  // Seed is captured once (Date.now() must not run during render → lazy initializer).
  const [seed0] = useState<number>(() => config?.seed ?? Date.now())

  // ---- private, loop/handler-only state lives in refs (never read during render) ----
  const enemyFleetFullRef = useRef<Ship[]>([]) // full enemy geometry — kept private
  const rngRef = useRef<Rng>(() => 0) // replaced with the seeded rng on init
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const annIdRef = useRef(0)
  const seedRef = useRef(seed0)
  const gameRef = useRef<Game>(makeInitial(startingTurn, fleet)) // authoritative latest snapshot

  // One render-facing state object, mirrored from gameRef on every mutation.
  const [game, setGame] = useState<Game>(() => makeInitial(startingTurn, fleet))

  // Mirror a new snapshot to both the ref (synchronous reads) and state (rendering).
  const commit = useCallback((next: Game) => {
    gameRef.current = next
    setGame(next)
  }, [])

  const announce = (
    kind: Announcement['kind'],
    by: Turn,
    message: string,
    shipLength?: number,
    coord?: Coord,
  ): Announcement => {
    annIdRef.current += 1
    return { id: `ann-${annIdRef.current}`, kind, by, shipLength, coord, message }
  }

  // (Re)initialise a game. Touches refs + setState, so it only runs from effects/handlers.
  const initGame = useCallback(
    (nextSeed: number) => {
      seedRef.current = nextSeed
      if (timerRef.current != null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      const rng = makeRng(nextSeed)
      const enemyFull = aiPlaceFleet(size, fleet, rng, allowTouch)
      rngRef.current = rng
      enemyFleetFullRef.current = enemyFull
      commit({
        ...makeInitial(startingTurn, fleet),
        enemyView: toEnemyView(enemyFull),
      })
    },
    [commit, size, fleet, allowTouch, startingTurn],
  )

  // Init on mount and re-init whenever the resolved config (size/fleet/touch/turn) changes.
  useEffect(() => {
    initGame(seedRef.current)
  }, [initGame])

  // Clear any pending enemy turn on unmount.
  useEffect(
    () => () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    },
    [],
  )

  // ---- battle scheduling (event-handler / timer territory only) ----
  const runEnemyTurn = (base: Game) => {
    const decision = aiNextShot(
      { size, shots: base.enemyShots, allowParity: true, mistakeChance: 0.15 },
      rngRef.current,
    )
    const r = applyShot(base.playerFleet, decision.coord)
    const enemyShots = [...base.enemyShots, r.shot]
    let lastAnnouncement = base.lastAnnouncement
    let lastSunkLength = base.lastSunkLength
    if (r.sunkShipId) {
      const len = lengthOf(r.fleet, r.sunkShipId)
      lastSunkLength = len
      lastAnnouncement = announce(
        'sink',
        'enemy',
        `The enemy sank your length-${len} segment!`,
        len,
        decision.coord,
      )
    }
    if (r.allSunk) {
      commit({
        ...base,
        phase: 'lost',
        turn: 'enemy',
        aiThinking: false,
        playerFleet: r.fleet,
        enemyShots,
        lastShot: r.shot,
        lastAnnouncement: announce('lose', 'enemy', 'Your fleet was destroyed — you lose.'),
        lastSunkLength,
      })
      return
    }
    commit({
      ...base,
      phase: 'battle',
      turn: 'player',
      aiThinking: false,
      playerFleet: r.fleet,
      enemyShots,
      lastShot: r.shot,
      lastAnnouncement,
      lastSunkLength,
    })
  }

  const scheduleEnemyTurn = (base: Game) => {
    if (timerRef.current != null) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      runEnemyTurn(base)
    }, enemyDelayMs)
  }

  // ---- actions: placement ----
  const placeShip = (a: Coord, b: Coord): PlacementResult => {
    const g = gameRef.current
    const len = segmentLength(a, b)
    const slot = g.slots.find((s) => !s.placed && s.length === len)
    if (!slot) return { ok: false, error: 'no-slot-for-length' }
    const res = checkPlacement(g.playerFleet, a, b, size, allowTouch)
    if (!res.ok || !res.ship) return res
    const ship = res.ship
    commit({
      ...g,
      playerFleet: [...g.playerFleet, ship],
      slots: g.slots.map((s) => (s.id === slot.id ? { ...s, placed: true, shipId: ship.id } : s)),
    })
    return { ok: true, ship }
  }

  const removeShipAt = (coord: Coord): void => {
    const g = gameRef.current
    const ship = g.playerFleet.find((s) => cellsOfShip(s).some((c) => coordsEqual(c, coord)))
    if (!ship) return
    commit({
      ...g,
      playerFleet: g.playerFleet.filter((s) => s.id !== ship.id),
      slots: g.slots.map((s) =>
        s.shipId === ship.id ? { ...s, placed: false, shipId: undefined } : s,
      ),
    })
  }

  const autoPlace = (): void => {
    const g = gameRef.current
    const placed = aiPlaceFleet(size, fleet, rngRef.current, allowTouch)
    const used = new Set<string>()
    const slots = makeSlots(fleet).map((slot) => {
      const ship = placed.find((p) => p.length === slot.length && !used.has(p.id))
      if (!ship) return slot
      used.add(ship.id)
      return { ...slot, placed: true, shipId: ship.id }
    })
    commit({ ...g, playerFleet: placed, slots })
  }

  const clearPlacement = (): void => {
    const g = gameRef.current
    commit({ ...g, playerFleet: [], slots: makeSlots(fleet) })
  }

  const ready = (): void => {
    const g = gameRef.current
    if (g.phase !== 'placing' || !g.slots.every((s) => s.placed)) return
    if (startingTurn === 'enemy') {
      const base: Game = { ...g, phase: 'battle', turn: 'enemy', aiThinking: true }
      commit(base)
      scheduleEnemyTurn(base)
    } else {
      commit({ ...g, phase: 'battle', turn: 'player', aiThinking: false })
    }
  }

  // ---- actions: battle ----
  const canFire = (g: Game, coord: Coord): boolean =>
    g.phase === 'battle' &&
    g.turn === 'player' &&
    !g.aiThinking &&
    inBounds(coord, size) &&
    !alreadyFiredAt(g.playerShots, coord)

  const canFireAt = (coord: Coord): boolean => canFire(game, coord)

  const fireAt = (coord: Coord): void => {
    const g = gameRef.current
    if (!canFire(g, coord)) return
    const r = applyShot(enemyFleetFullRef.current, coord)
    enemyFleetFullRef.current = r.fleet
    const playerShots = [...g.playerShots, r.shot]
    const enemyView = toEnemyView(r.fleet)
    let lastAnnouncement = g.lastAnnouncement
    let lastSunkLength = g.lastSunkLength
    if (r.sunkShipId) {
      const len = lengthOf(r.fleet, r.sunkShipId)
      lastSunkLength = len
      lastAnnouncement = announce('sink', 'player', `You sank a length-${len} segment!`, len, coord)
    }
    if (r.allSunk) {
      commit({
        ...g,
        phase: 'won',
        turn: 'player',
        aiThinking: false,
        playerShots,
        enemyView,
        lastShot: r.shot,
        lastAnnouncement: announce('win', 'player', 'You cleared the enemy fleet — you win!'),
        lastSunkLength,
      })
      return
    }
    const base: Game = {
      ...g,
      phase: 'battle',
      turn: 'enemy',
      aiThinking: true,
      playerShots,
      enemyView,
      lastShot: r.shot,
      lastAnnouncement,
      lastSunkLength,
    }
    commit(base)
    scheduleEnemyTurn(base)
  }

  // ---- lifecycle ----
  const reset = (): void => {
    initGame(seedRef.current) // same seed → identical enemy layout
  }

  const playAgain = (): void => {
    const g = gameRef.current
    initGame(seedRef.current + 1 + g.playerShots.length + g.enemyShots.length) // fresh seed
  }

  // ---- derived view-model (pure, from state) ----
  const placementComplete = game.slots.every((s) => s.placed)
  const shotsFired = game.playerShots.length
  const hits = game.playerShots.filter((s) => s.result === 'hit').length
  const enemyShipsSunk = game.enemyView.filter((s) => s.sunk).length
  const playerShipsLost = game.playerFleet.filter((s) => s.sunk).length
  const stats: GameStats = {
    shotsFired,
    hits,
    misses: shotsFired - hits,
    accuracy: shotsFired > 0 ? hits / shotsFired : 0,
    enemyShipsSunk,
    playerShipsLost,
    lastSunkLength: game.lastSunkLength,
  }
  const won = game.phase === 'won'
  const lost = game.phase === 'lost'
  const lastPlayerShot = shotsFired > 0 ? game.playerShots[shotsFired - 1] : null
  const lastEnemyShot = game.enemyShots.length > 0 ? game.enemyShots[game.enemyShots.length - 1] : null

  return {
    size,
    fleetLengths: fleet,
    allowTouch,

    phase: game.phase,
    turn: game.turn,
    isPlayerTurn: game.phase === 'battle' && game.turn === 'player',
    aiThinking: game.aiThinking,
    won,
    lost,
    gameOver: won || lost,

    playerFleet: game.playerFleet,
    enemyFleet: game.enemyView,

    playerShots: game.playerShots,
    enemyShots: game.enemyShots,
    lastShot: game.lastShot,
    lastPlayerShot,
    lastEnemyShot,

    lastAnnouncement: game.lastAnnouncement,
    lastSunkLength: game.lastSunkLength,
    stats,

    remaining: {
      player: fleetRemaining(game.playerFleet),
      enemy: fleetRemaining(game.enemyView),
    },
    placement: { slots: game.slots, complete: placementComplete },
    canStart: placementComplete && game.phase === 'placing',

    placeShip,
    removeShipAt,
    autoPlace,
    clearPlacement,
    ready,

    canFireAt,
    fireAt,

    reset,
    playAgain,
  }
}
