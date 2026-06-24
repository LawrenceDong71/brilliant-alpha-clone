import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { clientToViewBox } from '../../figures/geometry'

type Point = { x: number; y: number }
export type GamePhase = 'idle' | 'drifting' | 'guiding' | 'arrived'

export interface LighthouseGameConfig {
  home: Point
  shipStart: Point
  bounds?: { min: number; max: number } // default { min: 18, max: 246 }
  guideSpeed?: number // default 44  (px/s toward home when lit)
  guideAccel?: number // default 140 (px/s^2 ease-in)
  guideDecel?: number // default 120 (px/s^2 glide-to-stall)
  driftSpeed?: number // default 10  (px/s outward when unlit)
  wanderAmp?: number // default 8   (px/s peak lateral sway)
  wanderPeriod?: number // default 3.4 (s)
  illumHalfAngleDeg?: number // default 13 (capture)
  hysteresisDeg?: number // default 2.5 (release = capture + this)
  winRadius?: number // default 18 (px)
  assistRadius?: number // default 32 (px; near-home auto-illuminate)
  turnRate?: number // default 200 (deg/s heading slew)
  beamStartDeg?: number // default 75
  keyStepDeg?: number // default 3 (arrow-key beam nudge)
}

export interface LighthouseGameState {
  beamDeg: number
  shipX: number
  shipY: number
  heading: number // deg CCW 0=east, travel/bow direction
  illuminated: boolean
  progress: number // 0..1 (0 at start -> 1 at harbor)
  distance: number // px ship->home
  phase: GamePhase
  won: boolean
  spotId: number // increments on each unlit->lit transition (retrigger pings)
  bind: {
    onPointerDown: (e: PointerEvent<SVGSVGElement>) => void
    onPointerMove: (e: PointerEvent<SVGSVGElement>) => void
    onPointerUp: (e: PointerEvent<SVGSVGElement>) => void
    onKeyDown: (e: KeyboardEvent<SVGSVGElement>) => void
  }
  reset: () => void
}

const VB = 264
const DT_MAX = 0.05
const PAGE_STEP_DEG = 10
const MAX_OVERSHOOT = 12 // never drift more than this past the start distance
const MIN_TRAVEL_SPEED = 3 // px/s below which heading is held steady

// Angle convention: degrees, CCW positive, 0 = east, 90 = screen-up, on a y-DOWN canvas.
const norm180 = (a: number) => (((a % 360) + 540) % 360) - 180
const angleDiff = (a: number, b: number) => Math.abs(norm180(a - b))
const angleFromHome = (p: Point, h: Point) => (Math.atan2(h.y - p.y, p.x - h.x) * 180) / Math.PI
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const clamp01 = (v: number) => clamp(v, 0, 1)
const approach = (cur: number, target: number, maxStep: number) =>
  cur < target ? Math.min(cur + maxStep, target) : Math.max(cur - maxStep, target)
// Velocity vector (y-down) -> heading: negate vy so screen-up reads as +90.
const travelHeading = (from: Point, to: Point) =>
  (Math.atan2(-(to.y - from.y), to.x - from.x) * 180) / Math.PI

interface Resolved {
  home: Point
  shipStart: Point
  boundsMin: number
  boundsMax: number
  guideSpeed: number
  guideAccel: number
  guideDecel: number
  driftSpeed: number
  wanderAmp: number
  wanderPeriod: number
  illumHalfAngleDeg: number
  hysteresisDeg: number
  winRadius: number
  assistRadius: number
  turnRate: number
  beamStartDeg: number
  keyStepDeg: number
}

function resolveConfig(cfg: LighthouseGameConfig): Resolved {
  const bounds = cfg.bounds ?? { min: 18, max: 246 }
  return {
    home: cfg.home,
    shipStart: cfg.shipStart,
    boundsMin: bounds.min,
    boundsMax: bounds.max,
    guideSpeed: cfg.guideSpeed ?? 44,
    guideAccel: cfg.guideAccel ?? 140,
    guideDecel: cfg.guideDecel ?? 120,
    driftSpeed: cfg.driftSpeed ?? 10,
    wanderAmp: cfg.wanderAmp ?? 8,
    wanderPeriod: cfg.wanderPeriod ?? 3.4,
    illumHalfAngleDeg: cfg.illumHalfAngleDeg ?? 13,
    hysteresisDeg: cfg.hysteresisDeg ?? 2.5,
    winRadius: cfg.winRadius ?? 18,
    assistRadius: cfg.assistRadius ?? 32,
    turnRate: cfg.turnRate ?? 200,
    beamStartDeg: cfg.beamStartDeg ?? 75,
    keyStepDeg: cfg.keyStepDeg ?? 3,
  }
}

type Snapshot = Omit<LighthouseGameState, 'bind' | 'reset'>

const startDistance = (r: Resolved) => Math.hypot(r.shipStart.x - r.home.x, r.shipStart.y - r.home.y)

function initialSnapshot(r: Resolved, won: boolean): Snapshot {
  if (won) {
    // Revisiting an already-solved step: show the ship docked at home.
    return {
      beamDeg: r.beamStartDeg,
      shipX: r.home.x,
      shipY: r.home.y,
      heading: travelHeading(r.shipStart, r.home),
      illuminated: true,
      progress: 1,
      distance: 0,
      phase: 'arrived',
      won: true,
      spotId: 0,
    }
  }
  const start = startDistance(r)
  const lit =
    angleDiff(r.beamStartDeg, angleFromHome(r.shipStart, r.home)) <= r.illumHalfAngleDeg ||
    start <= r.assistRadius
  return {
    beamDeg: r.beamStartDeg,
    shipX: r.shipStart.x,
    shipY: r.shipStart.y,
    heading: travelHeading(r.shipStart, r.home),
    illuminated: lit,
    progress: 0,
    distance: start,
    phase: 'idle',
    won: false,
    spotId: 0,
  }
}

export function useLighthouseGame(
  cfg: LighthouseGameConfig,
  opts?: { reduceMotion?: boolean; paused?: boolean },
): LighthouseGameState {
  const resolved = resolveConfig(cfg)
  const pausedAtMount = !!opts?.paused
  const init0 = initialSnapshot(resolved, pausedAtMount)

  // Latest resolved config, mirrored in an effect so the loop never reads a stale closure.
  const paramsRef = useRef(resolved)

  // Fast, loop-read simulation values live in refs (only touched inside effects/handlers).
  const beamRef = useRef(init0.beamDeg)
  const shipXRef = useRef(init0.shipX)
  const shipYRef = useRef(init0.shipY)
  const headingRef = useRef(init0.heading)
  const illumRef = useRef(init0.illuminated)
  const spotIdRef = useRef(init0.spotId)
  const phaseRef = useRef<GamePhase>(init0.phase)
  const wonRef = useRef(init0.won)
  const distanceRef = useRef(init0.distance)
  const speedRef = useRef(0)
  const wanderRef = useRef(0)
  const firstInputRef = useRef(init0.phase !== 'idle')
  const draggingRef = useRef(false)
  const pausedRef = useRef(pausedAtMount)
  const pendingResetRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  // One state object, mirrored from the refs once per simulated frame.
  const [state, setState] = useState<Snapshot>(init0)

  useEffect(() => {
    paramsRef.current = resolved
  })

  useEffect(() => {
    pausedRef.current = !!opts?.paused
  }, [opts?.paused])

  const applyInit = useCallback((won: boolean) => {
    const snap = initialSnapshot(paramsRef.current, won)
    beamRef.current = snap.beamDeg
    shipXRef.current = snap.shipX
    shipYRef.current = snap.shipY
    headingRef.current = snap.heading
    illumRef.current = snap.illuminated
    spotIdRef.current = snap.spotId
    phaseRef.current = snap.phase
    wonRef.current = snap.won
    distanceRef.current = snap.distance
    speedRef.current = 0
    wanderRef.current = 0
    firstInputRef.current = snap.phase !== 'idle'
    draggingRef.current = false
    setState(snap)
  }, [])

  // Re-initialise only when the home/ship positions change in VALUE (objects may be
  // re-created every render with the same coords). The reset is applied by the loop so
  // no setState is fired synchronously from this effect.
  const cfgKey = `${resolved.home.x},${resolved.home.y},${resolved.shipStart.x},${resolved.shipStart.y}`
  const keyRef = useRef(cfgKey)
  useEffect(() => {
    if (keyRef.current === cfgKey) return
    keyRef.current = cfgKey
    pendingResetRef.current = true
  }, [cfgKey])

  useEffect(() => {
    const simulate = (dt: number) => {
      const r = paramsRef.current
      const phase0 = phaseRef.current
      if (phase0 === 'arrived') return // terminal: stop simulating
      if (phase0 === 'idle' && !firstInputRef.current) return // wait for the first input

      wanderRef.current += dt

      // Illumination: capture inside the half-angle, release a touch wider (hysteresis),
      // and auto-illuminate once practically on top of the harbour (assist).
      const target = angleFromHome({ x: shipXRef.current, y: shipYRef.current }, r.home)
      const diff = angleDiff(beamRef.current, target)
      const within = illumRef.current
        ? diff <= r.illumHalfAngleDeg + r.hysteresisDeg
        : diff <= r.illumHalfAngleDeg
      const isLit = within || distanceRef.current <= r.assistRadius
      if (isLit && !illumRef.current) spotIdRef.current += 1
      illumRef.current = isLit

      if (phase0 === 'idle') phaseRef.current = isLit ? 'guiding' : 'drifting'

      const start = startDistance(r)
      let ax = shipXRef.current - r.home.x
      let ay = shipYRef.current - r.home.y
      const radius = Math.hypot(ax, ay) || 1
      ax /= radius
      ay /= radius
      const perpX = -ay
      const perpY = ax
      const lat = r.wanderAmp * Math.sin((2 * Math.PI * wanderRef.current) / r.wanderPeriod)
      speedRef.current = isLit
        ? approach(speedRef.current, r.guideSpeed, r.guideAccel * dt)
        : approach(speedRef.current, 0, r.guideDecel * dt)
      const vRadial = isLit ? -speedRef.current : r.driftSpeed
      const vx = ax * vRadial + perpX * lat
      const vy = ay * vRadial + perpY * lat

      let nx = clamp(shipXRef.current + vx * dt, r.boundsMin, r.boundsMax)
      let ny = clamp(shipYRef.current + vy * dt, r.boundsMin, r.boundsMax)
      let d = Math.hypot(nx - r.home.x, ny - r.home.y)
      const maxD = start + MAX_OVERSHOOT
      if (d > maxD && d > 0) {
        nx = r.home.x + ((nx - r.home.x) / d) * maxD
        ny = r.home.y + ((ny - r.home.y) / d) * maxD
        d = maxD
      }
      shipXRef.current = nx
      shipYRef.current = ny
      distanceRef.current = d

      const vMag = Math.hypot(vx, vy)
      if (vMag > MIN_TRAVEL_SPEED) {
        const travel = (Math.atan2(-vy, vx) * 180) / Math.PI
        const delta = norm180(travel - headingRef.current)
        const maxTurn = r.turnRate * dt
        const stepDeg = Math.abs(delta) <= maxTurn ? delta : Math.sign(delta) * maxTurn
        headingRef.current = norm180(headingRef.current + stepDeg)
      }

      let phase: GamePhase
      if (d <= r.winRadius) {
        phase = 'arrived'
        wonRef.current = true
      } else {
        phase = isLit ? 'guiding' : 'drifting'
      }
      phaseRef.current = phase

      const span = start - r.winRadius
      const progress = span > 0 ? clamp01((start - d) / span) : d <= r.winRadius ? 1 : 0

      setState({
        beamDeg: beamRef.current,
        shipX: nx,
        shipY: ny,
        heading: headingRef.current,
        illuminated: isLit,
        progress,
        distance: d,
        phase,
        won: wonRef.current,
        spotId: spotIdRef.current,
      })
    }

    const frame = (now: number) => {
      if (pendingResetRef.current) {
        pendingResetRef.current = false
        applyInit(pausedRef.current)
        lastTimeRef.current = now
      } else {
        const last = lastTimeRef.current
        lastTimeRef.current = now
        if (!pausedRef.current && last != null) {
          let dt = (now - last) / 1000
          if (dt < 0) dt = 0
          if (dt > DT_MAX) dt = DT_MAX
          simulate(dt)
        }
      }
      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lastTimeRef.current = null
    }
  }, [applyInit])

  const reset = useCallback(() => applyInit(false), [applyInit])

  // Helper invoked only from the event handlers below (never during render), so it may
  // touch refs and setState — mirrors the existing RayAimStep `update` pattern.
  const commitBeam = (a: number) => {
    const n = norm180(a)
    beamRef.current = n
    setState((s) => (s.beamDeg === n ? s : { ...s, beamDeg: n }))
  }

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (pausedRef.current) return
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingRef.current = true
    firstInputRef.current = true
    const p = clientToViewBox(e.currentTarget, e.clientX, e.clientY, VB, VB)
    commitBeam(angleFromHome(p, paramsRef.current.home))
  }

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (pausedRef.current || !draggingRef.current) return
    const p = clientToViewBox(e.currentTarget, e.clientX, e.clientY, VB, VB)
    commitBeam(angleFromHome(p, paramsRef.current.home))
  }

  const onPointerUp = () => {
    draggingRef.current = false
  }

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (pausedRef.current) return
    let next: number
    switch (e.key) {
      case 'ArrowLeft':
        next = beamRef.current + paramsRef.current.keyStepDeg
        break
      case 'ArrowRight':
        next = beamRef.current - paramsRef.current.keyStepDeg
        break
      case 'PageUp':
        next = beamRef.current + PAGE_STEP_DEG
        break
      case 'PageDown':
        next = beamRef.current - PAGE_STEP_DEG
        break
      default:
        return
    }
    e.preventDefault()
    firstInputRef.current = true
    commitBeam(next)
  }

  return {
    ...state,
    bind: { onPointerDown, onPointerMove, onPointerUp, onKeyDown },
    reset,
  }
}
