import type {
  BoardCell,
  BoardMode,
  BoardShip,
  Coord,
  FleetRemaining,
  Orientation,
  PlacementError,
  PlacementResult,
  Ship,
  Shot,
} from './types'

export const coordsEqual = (a: Coord, b: Coord): boolean => a.x === b.x && a.y === b.y

export const inBounds = (c: Coord, size: number): boolean =>
  c.x >= 1 && c.x <= size && c.y >= 1 && c.y <= size

const isAxisAligned = (a: Coord, b: Coord): boolean => a.x === b.x || a.y === b.y

/** 8-neighbourhood adjacency (touching by edge or corner), excluding equality. */
const areAdjacent = (a: Coord, b: Coord): boolean =>
  !coordsEqual(a, b) && Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1

/** Cells covered by an axis-aligned segment = |Δx| + |Δy| + 1. */
export const segmentLength = (start: Coord, end: Coord): number =>
  Math.abs(end.x - start.x) + Math.abs(end.y - start.y) + 1

const orientationOf = (start: Coord, end: Coord): Orientation =>
  start.y === end.y ? 'h' : 'v'

/** Canonical ordering so `start` is the lesser endpoint (by x for h, by y for v). */
function normalizeSegment(start: Coord, end: Coord): { start: Coord; end: Coord } {
  if (start.y === end.y) {
    return start.x <= end.x ? { start, end } : { start: end, end: start }
  }
  return start.y <= end.y ? { start, end } : { start: end, end: start }
}

/** Every integer cell from start to end inclusive (axis-aligned only). */
export function cellsOfSegment(start: Coord, end: Coord): Coord[] {
  const cells: Coord[] = []
  const dx = Math.sign(end.x - start.x)
  const dy = Math.sign(end.y - start.y)
  let x = start.x
  let y = start.y
  // guard against a non-axis-aligned input: only step along one axis
  const stepX = dy === 0 ? dx : 0
  const stepY = dx === 0 ? dy : 0
  cells.push({ x, y })
  while (!(x === end.x && y === end.y)) {
    x += stepX
    y += stepY
    cells.push({ x, y })
    if (stepX === 0 && stepY === 0) break // degenerate safety
  }
  return cells
}

export const cellsOfShip = (ship: Ship): Coord[] => cellsOfSegment(ship.start, ship.end)

/** Pure constructor: normalizes endpoints, derives length/orientation, hits=[], sunk=false. */
function makeShip(id: string, a: Coord, b: Coord): Ship {
  const { start, end } = normalizeSegment(a, b)
  return {
    id,
    start,
    end,
    length: segmentLength(start, end),
    orientation: orientationOf(start, end),
    hits: [],
    sunk: false,
  }
}

/** Validate placing the segment a→b into `fleet`. Returns the new ship when legal. */
export function checkPlacement(
  fleet: Ship[],
  a: Coord,
  b: Coord,
  size: number,
  allowTouch: boolean,
): PlacementResult {
  if (!isAxisAligned(a, b)) return fail('not-axis-aligned')
  const cells = cellsOfSegment(a, b)
  if (cells.some((c) => !inBounds(c, size))) return fail('out-of-bounds')

  const occupied = new Set<string>()
  for (const ship of fleet) for (const c of cellsOfShip(ship)) occupied.add(key(c))
  if (cells.some((c) => occupied.has(key(c)))) return fail('overlap')

  if (!allowTouch) {
    const existing = fleet.flatMap((s) => cellsOfShip(s))
    const touches = cells.some((c) => existing.some((e) => areAdjacent(c, e)))
    if (touches) return fail('too-close')
  }
  return { ok: true, ship: makeShip(idFor(fleet), a, b) }
}

export const isLegalPlacement = (
  fleet: Ship[],
  a: Coord,
  b: Coord,
  size: number,
  allowTouch: boolean,
): boolean => checkPlacement(fleet, a, b, size, allowTouch).ok

export interface HitInfo {
  shipId: string
  ship: Ship
}

/** The ship covering `coord`, or null. */
export function isHit(fleet: Ship[], coord: Coord): HitInfo | null {
  for (const ship of fleet) {
    if (cellsOfShip(ship).some((c) => coordsEqual(c, coord))) return { shipId: ship.id, ship }
  }
  return null
}

export const alreadyFiredAt = (shots: Shot[], coord: Coord): boolean =>
  shots.some((s) => coordsEqual(s.coord, coord))

export interface ApplyShotResult {
  fleet: Ship[] // new immutable fleet
  shot: Shot
  sunkShipId: string | null
  allSunk: boolean
}

/** Pure resolution of one shot against a fleet (caller dedupes via alreadyFiredAt first). */
export function applyShot(fleet: Ship[], coord: Coord): ApplyShotResult {
  const hitInfo = isHit(fleet, coord)
  if (!hitInfo) {
    return { fleet, shot: { coord, result: 'miss' }, sunkShipId: null, allSunk: false }
  }
  let sunkShipId: string | null = null
  const next = fleet.map((ship) => {
    if (ship.id !== hitInfo.shipId) return ship
    if (ship.hits.some((h) => coordsEqual(h, coord))) return ship // already recorded
    const hits = [...ship.hits, coord]
    const sunk = hits.length >= ship.length
    if (sunk) sunkShipId = ship.id
    return { ...ship, hits, sunk }
  })
  const allSunk = next.every((s) => s.sunk)
  return {
    fleet: next,
    shot: { coord, result: 'hit', shipId: hitInfo.shipId, sunkShipId: sunkShipId ?? undefined },
    sunkShipId,
    allSunk,
  }
}

/**
 * Per-cell marks for one board.
 * - 'own': pass your full fleet; unhit ship cells render as 'ship'.
 * - 'target': pass ONLY revealed (sunk) enemy ships; afloat hits still render as 'hit'.
 */
export function buildBoardCells(opts: {
  size: number
  mode: BoardMode
  ships: BoardShip[]
  shots: Shot[]
}): BoardCell[] {
  const { size, mode, ships, shots } = opts
  const shotAt = new Map<string, Shot>()
  for (const s of shots) shotAt.set(key(s.coord), s)
  const shipAt = new Map<string, BoardShip>()
  for (const ship of ships) for (const c of cellsOfSegment(ship.start, ship.end)) shipAt.set(key(c), ship)

  const cells: BoardCell[] = []
  for (let y = 1; y <= size; y++) {
    for (let x = 1; x <= size; x++) {
      const coord = { x, y }
      const shot = shotAt.get(key(coord))
      const ship = shipAt.get(key(coord))
      let mark: BoardCell['mark'] = 'empty'
      if (shot?.result === 'hit') mark = ship && ship.sunk ? 'sunk' : 'hit'
      else if (shot?.result === 'miss') mark = 'miss'
      else if (mode === 'own' && ship) mark = 'ship'
      cells.push({ coord, mark, shipId: ship?.id })
    }
  }
  return cells
}

export function fleetRemaining(
  fleet: Array<Pick<Ship, 'id' | 'length' | 'sunk'>>,
): FleetRemaining {
  const pips = fleet.map((s) => ({ shipId: s.id, length: s.length, sunk: s.sunk }))
  const sunk = pips.filter((p) => p.sunk).length
  return { total: pips.length, afloat: pips.length - sunk, sunk, pips }
}

// ---- internals ----
const key = (c: Coord): string => `${c.x},${c.y}`
const fail = (error: PlacementError): PlacementResult => ({ ok: false, error })
const idFor = (fleet: Ship[]): string => `ship-${fleet.length + 1}-${Math.random().toString(36).slice(2, 7)}`
