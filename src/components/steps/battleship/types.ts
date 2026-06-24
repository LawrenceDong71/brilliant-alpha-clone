import type { Point } from '../../../content/types'

/** A grid cell / shot target. Integer coords in 1..size on both axes. (=== Point) */
export type Coord = Point

/** 'h' = horizontal (constant y, varies x); 'v' = vertical (constant x, varies y). */
export type Orientation = 'h' | 'v'

export type Turn = 'player' | 'enemy'
export type GamePhase = 'placing' | 'battle' | 'won' | 'lost'
export type BoardMode = 'own' | 'target'

/** Uniform PRNG in [0, 1). Seeded factory lives in ai.ts (makeRng). */
export type Rng = () => number

// ---- Ships (a ship is an axis-aligned SEGMENT between two endpoints) ----

export interface Ship {
  id: string
  start: Coord // normalized: the min-(x then y) endpoint
  end: Coord // normalized: the max endpoint
  length: number // cells covered = segmentLength(start, end)
  orientation: Orientation
  hits: Coord[] // distinct cells of this ship that have been hit
  sunk: boolean // hits.length >= length
}

/** What the player may know about an enemy ship — geometry revealed ONLY when sunk. */
export interface EnemyShipView {
  id: string
  length: number
  sunk: boolean
  start?: Coord
  end?: Coord
  orientation?: Orientation
}

/** Minimal ship shape a board needs to draw a segment. Ship satisfies this structurally. */
export interface BoardShip {
  id: string
  start: Coord
  end: Coord
  orientation: Orientation
  sunk: boolean
}

// ---- Shots (a shot is a coordinate POINT) ----

export interface Shot {
  coord: Coord
  result: 'hit' | 'miss'
  shipId?: string // present iff result === 'hit'
  sunkShipId?: string // present iff this shot sank a ship
}

// ---- Board rendering view-model ----

type CellMark = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk'

export interface BoardCell {
  coord: Coord
  mark: CellMark
  shipId?: string
}

/** Hover overlay handed to BattleBoard. */
export type BoardPreview =
  | { kind: 'placement'; cells: Coord[]; legal: boolean }
  | { kind: 'fire'; coord: Coord; valid: boolean }

// ---- Placement ----

export interface PlacementSlot {
  id: string
  length: number
  placed: boolean
  shipId?: string
}

interface PlacementState {
  slots: PlacementSlot[]
  complete: boolean
}

export type PlacementError =
  | 'out-of-bounds'
  | 'not-axis-aligned'
  | 'overlap'
  | 'too-close'
  | 'no-slot-for-length' // no unplaced fleet slot matches the drawn segment's length

export interface PlacementResult {
  ok: boolean
  ship?: Ship
  error?: PlacementError
}

// ---- Announcements & fleet status (educational tie-ins) ----

export interface ShipPip {
  shipId: string
  length: number
  sunk: boolean
}

export interface FleetRemaining {
  total: number
  afloat: number
  sunk: number
  pips: ShipPip[]
}

export interface GameStats {
  shotsFired: number
  hits: number
  misses: number
  accuracy: number // hits / shotsFired (0 when none fired)
  enemyShipsSunk: number
  playerShipsLost: number
  lastSunkLength: number | null
}

export interface Announcement {
  id: string
  kind: 'sink' | 'win' | 'lose'
  by: Turn
  shipLength?: number
  coord?: Coord
  message: string
}

// ---- Config + hook contract ----

export interface BattleshipConfig {
  size?: number // grid is size×size, coords 1..size. default 8
  fleet?: number[] // ship lengths (distinct), placement order. default [2, 3, 4]
  allowTouch?: boolean // may ships sit adjacent? default true
  enemyDelayMs?: number // delay before the AI fires after the player. default 700
  seed?: number // deterministic enemy placement + AI shots. default Date.now()
  startingTurn?: Turn // default 'player'
}

export interface UseBattleshipResult {
  size: number
  fleetLengths: number[]
  allowTouch: boolean

  phase: GamePhase
  turn: Turn
  isPlayerTurn: boolean
  aiThinking: boolean
  won: boolean
  lost: boolean
  gameOver: boolean

  playerFleet: Ship[]
  enemyFleet: EnemyShipView[]

  playerShots: Shot[]
  enemyShots: Shot[]
  lastShot: Shot | null
  lastPlayerShot: Shot | null
  lastEnemyShot: Shot | null

  lastAnnouncement: Announcement | null
  lastSunkLength: number | null
  stats: GameStats

  remaining: { player: FleetRemaining; enemy: FleetRemaining }
  placement: PlacementState
  canStart: boolean

  // actions — placement (phase === 'placing')
  placeShip: (start: Coord, end: Coord) => PlacementResult
  removeShipAt: (coord: Coord) => void
  autoPlace: () => void
  clearPlacement: () => void
  ready: () => void

  // actions — battle (phase === 'battle')
  canFireAt: (coord: Coord) => boolean
  fireAt: (coord: Coord) => void

  // lifecycle
  reset: () => void
  playAgain: () => void
}
