import { COURT, type ShotRound } from './types'

export type Rng = () => number

/** Deterministic seeded PRNG in [0, 1) (mulberry32). */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DEG = Math.PI / 180
const L_MIN = 84 // minimum ball→hoop distance (px) so figures never get tiny/overlapping
// Playable horizontal band for the ball↔hoop pair (room for hoop hardware + the
// ball radius on either side). The hoop may sit up-RIGHT (acute angle), straight
// UP (right angle), or up-LEFT (obtuse angle) of the ball.
const PLAY_X_MIN = 32
const PLAY_X_MAX = 300
const HOOP_Y_MIN = 46

const randRange = (rng: Rng, lo: number, hi: number) => lo + rng() * (hi - lo)
const pick = <T>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]

/** Build the angle choices: the correct angle + distractors (all ≥15° apart), sorted. */
function makeChoices(
  rng: Rng,
  theta: number,
  pool: number[],
  optionsPerRound: number,
  easy: boolean,
): { choices: number[]; correctIndex: number } {
  const others = pool.filter((a) => a !== theta)
  const byNear = [...others].sort((a, b) => Math.abs(a - theta) - Math.abs(b - theta))
  const need = Math.max(1, optionsPerRound - 1)
  const distractors: number[] = []

  if (easy) {
    if (byNear[0] !== undefined) distractors.push(byNear[0]) // nearest neighbour
    const far = others.filter((a) => Math.abs(a - theta) >= 45)
    if (far.length) {
      const f = pick(rng, far)
      if (!distractors.includes(f)) distractors.push(f)
    }
  }
  for (const a of byNear) {
    if (distractors.length >= need) break
    if (!distractors.includes(a)) distractors.push(a)
  }

  const choices = [theta, ...distractors.slice(0, need)].sort((a, b) => a - b)
  return { choices, correctIndex: choices.indexOf(theta) }
}

/** Generate a full run of rounds. Deterministic given the rng sequence. */
export function makeRounds(
  rng: Rng,
  opts: { rounds: number; anglePool: number[]; optionsPerRound: number },
): ShotRound[] {
  const { rounds, anglePool, optionsPerRound } = opts
  const pool = anglePool.length ? anglePool : [15, 30, 45, 60, 75, 90, 105, 120, 135, 150]
  const out: ShotRound[] = []
  const usedCount = new Map<number, number>()
  let prev = -1

  for (let i = 0; i < rounds; i++) {
    // Pick a "nice" target angle: never repeat the previous round, cap each at twice.
    const eligible = pool.filter((a) => a !== prev && (usedCount.get(a) ?? 0) < 2)
    const theta = eligible.length ? pick(rng, eligible) : pick(rng, pool)
    prev = theta
    usedCount.set(theta, (usedCount.get(theta) ?? 0) + 1)

    const c = Math.cos(theta * DEG)
    const s = Math.sin(theta * DEG)

    // Cap the shot length so the hoop stays above the top margin (vertical room)
    // and the ball↔hoop horizontal span fits the playable band (horizontal room).
    const band = PLAY_X_MAX - PLAY_X_MIN
    const lMaxV = (COURT.ballY - HOOP_Y_MIN) / s // s > 0 for every 0 < θ < 180
    const lMaxH = Math.abs(c) < 0.02 ? Infinity : band / Math.abs(c)
    const cap = Math.max(L_MIN, Math.min(lMaxV, lMaxH))
    const len = randRange(rng, Math.max(L_MIN, 0.55 * cap), Math.max(L_MIN + 1, 0.92 * cap))

    // Signed horizontal offset from ball to hoop: + = hoop up-right (acute),
    // ≈0 = straight up (right angle), − = hoop up-left (obtuse, leaning back).
    const off = len * c
    const span = Math.abs(off)
    const spanLeft = randRange(rng, PLAY_X_MIN, Math.max(PLAY_X_MIN, PLAY_X_MAX - span))
    // Place the ball on whichever side keeps the whole figure inside the band: it
    // sits left for acute/right shots and right for obtuse (lean-back) shots.
    const bx = c >= 0 ? spanLeft : spanLeft + span
    const hoopX = c >= 0 ? spanLeft + off : spanLeft

    const ball = { x: Math.round(bx), y: COURT.ballY }
    const hoop = { x: Math.round(hoopX), y: Math.round(COURT.ballY - len * s) }

    const { choices, correctIndex } = makeChoices(rng, theta, pool, optionsPerRound, i < 2)
    out.push({ ball, hoop, correctAngle: theta, choices, correctIndex })
  }
  return out
}
