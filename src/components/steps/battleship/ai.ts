import type { Coord, Rng, Ship, Shot } from './types'
import { checkPlacement } from './battleshipGeo'

const MAX_PLACEMENT_ATTEMPTS = 1000

/** Deterministic, seeded uniform PRNG in [0, 1) (mulberry32). */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const randInt = (rng: Rng, n: number): number => Math.floor(rng() * n)

/** Randomly lay each requested length into a legal, non-overlapping fleet. */
export function aiPlaceFleet(
  size: number,
  lengths: number[],
  rng: Rng,
  allowTouch = true,
): Ship[] {
  const fleet: Ship[] = []
  for (const length of lengths) {
    const maxStart = size - length + 1
    if (maxStart < 1) continue
    for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
      const horizontal = rng() < 0.5
      const sx = 1 + randInt(rng, horizontal ? maxStart : size)
      const sy = 1 + randInt(rng, horizontal ? size : maxStart)
      const start: Coord = { x: sx, y: sy }
      const end: Coord = horizontal
        ? { x: sx + length - 1, y: sy }
        : { x: sx, y: sy + length - 1 }
      const res = checkPlacement(fleet, start, end, size, allowTouch)
      if (res.ok && res.ship) {
        fleet.push(res.ship)
        break
      }
    }
  }
  return fleet
}

type AiMode = 'hunt' | 'target'

export interface AiShotParams {
  size: number
  shots: Shot[]
  allowParity?: boolean // restrict hunting to one checkerboard colour
  mistakeChance?: number // probability the AI ignores an open hit and hunts at random
}

export interface AiShot {
  coord: Coord
  mode: AiMode
}

const keyOf = (c: Coord): string => `${c.x},${c.y}`

const ORTHO: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

/**
 * Hunt/target AI: when a hit belongs to a ship that isn't sunk yet, fire at one of its
 * orthogonal neighbours (target mode); otherwise sweep the board (hunt mode), optionally
 * on a parity mask. `mistakeChance` lets the AI occasionally squander a target.
 */
export function aiNextShot(params: AiShotParams, rng: Rng): AiShot {
  const { size, shots } = params
  const allowParity = params.allowParity ?? false
  const mistakeChance = params.mistakeChance ?? 0

  const fired = new Set(shots.map((s) => keyOf(s.coord)))
  const sunkIds = new Set(shots.flatMap((s) => (s.sunkShipId ? [s.sunkShipId] : [])))
  const openHits = shots.filter(
    (s) => s.result === 'hit' && s.shipId != null && !sunkIds.has(s.shipId),
  )

  const targets: Coord[] = []
  const seen = new Set<string>()
  for (const hit of openHits) {
    for (const [dx, dy] of ORTHO) {
      const c: Coord = { x: hit.coord.x + dx, y: hit.coord.y + dy }
      if (c.x < 1 || c.x > size || c.y < 1 || c.y > size) continue
      const k = keyOf(c)
      if (fired.has(k) || seen.has(k)) continue
      seen.add(k)
      targets.push(c)
    }
  }

  const blunder = rng() < mistakeChance
  if (targets.length > 0 && !blunder) {
    return { coord: targets[randInt(rng, targets.length)], mode: 'target' }
  }

  const open: Coord[] = []
  const parity: Coord[] = []
  for (let y = 1; y <= size; y++) {
    for (let x = 1; x <= size; x++) {
      const c: Coord = { x, y }
      if (fired.has(keyOf(c))) continue
      open.push(c)
      if ((x + y) % 2 === 0) parity.push(c)
    }
  }
  const pool = allowParity && parity.length > 0 ? parity : open
  if (pool.length === 0) return { coord: { x: 1, y: 1 }, mode: 'hunt' }
  return { coord: pool[randInt(rng, pool.length)], mode: 'hunt' }
}
