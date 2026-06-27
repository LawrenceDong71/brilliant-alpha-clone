import { useCallback, useEffect, useRef, useState } from 'react'
import type { SplitSprintStep as SprintStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox } from '../figures/geometry'

type Phase = 'ready' | 'playing' | 'done'
type Orientation = 'v' | 'h'
type Cell = [number, number]
interface Shape {
  cols: number
  rows: number
  cells: Cell[]
}
interface Cut {
  orientation: Orientation
  split: number
  aArea: number
  bArea: number
}

const VB_W = 340
const VB_H = 264
const PAD_X = 26
const GRID_TOP = 16
const BELT_H = 46

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

/** Is `region` a single solid rectangle (its cells exactly fill their bounding box)? */
function isSolidRect(region: Cell[]): boolean {
  if (region.length === 0) return false
  let minC = Infinity
  let maxC = -Infinity
  let minR = Infinity
  let maxR = -Infinity
  const keys = new Set<string>()
  for (const [c, r] of region) {
    keys.add(`${c},${r}`)
    if (c < minC) minC = c
    if (c > maxC) maxC = c
    if (r < minR) minR = r
    if (r > maxR) maxR = r
  }
  const w = maxC - minC + 1
  const h = maxR - minR + 1
  return keys.size === w * h
}

/** Split a slab's cells by a cut into the two sides A (before the line) and B (after). */
function partition(shape: Shape, o: Orientation, split: number): { a: Cell[]; b: Cell[] } {
  const a: Cell[] = []
  const b: Cell[] = []
  for (const [c, r] of shape.cells) {
    const onA = o === 'v' ? c < split : r < split
    ;(onA ? a : b).push([c, r])
  }
  return { a, b }
}

/** A cut is valid when it leaves TWO solid rectangles. */
function isValidCut(shape: Shape, o: Orientation, split: number): boolean {
  const { a, b } = partition(shape, o, split)
  return isSolidRect(a) && isSolidRect(b)
}

/** Find any cut that splits the slab into two rectangles (used to reveal on a miss). */
function findValidCut(shape: Shape): Cut | null {
  for (const o of ['v', 'h'] as const) {
    const n = o === 'v' ? shape.cols : shape.rows
    for (let s = 1; s < n; s++) {
      if (isValidCut(shape, o, s)) {
        const { a, b } = partition(shape, o, s)
        return { orientation: o, split: s, aArea: a.length, bArea: b.length }
      }
    }
  }
  return null
}

/** Pick a starting cut that is NOT already a solution, so the round isn't pre-solved. */
function startCut(shape: Shape): { orientation: Orientation; split: number } {
  for (const o of ['v', 'h'] as const) {
    const n = o === 'v' ? shape.cols : shape.rows
    for (let s = 1; s < n; s++) {
      if (!isValidCut(shape, o, s)) return { orientation: o, split: s }
    }
  }
  return { orientation: 'v', split: 1 }
}

function boundingRect(region: Cell[]) {
  let minC = Infinity
  let maxC = -Infinity
  let minR = Infinity
  let maxR = -Infinity
  for (const [c, r] of region) {
    if (c < minC) minC = c
    if (c > maxC) maxC = c
    if (r < minR) minR = r
    if (r > maxR) maxR = r
  }
  return { minC, minR, w: maxC - minC + 1, h: maxR - minR + 1 }
}

const shuffle = (n: number) => {
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function SplitSprintStep({ step, setChecker, locked }: InteractiveStepProps<SprintStep>) {
  const perShape = step.secondsPerShape ?? 7
  const runLen = Math.min(step.rounds ?? step.shapes.length, step.shapes.length)
  const passBar = Math.max(1, Math.ceil(runLen * (step.passRatio ?? 0.6)))

  const [phase, setPhase] = useState<Phase>('ready')
  const [order, setOrder] = useState<number[]>([])
  const [pos, setPos] = useState(0)
  const [timeLeft, setTimeLeft] = useState(perShape)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [orientation, setOrientation] = useState<Orientation>('v')
  const [split, setSplit] = useState(1)
  const [flash, setFlash] = useState<null | { ok: boolean; aArea: number; bArea: number; total: number }>(null)
  const [finished, setFinished] = useState(false)

  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragging = useRef(false)
  const advanceRef = useRef<number | undefined>(undefined)
  const streakRef = useRef(0)
  const bestRef = useRef(0)
  const stateRef = useRef({ phase, pos, order, flash })

  useEffect(() => {
    stateRef.current = { phase, pos, order, flash }
  }, [phase, pos, order, flash])

  useEffect(() => {
    setChecker(() => finished && score >= passBar)
  }, [finished, score, passBar, setChecker])

  useEffect(() => () => window.clearTimeout(advanceRef.current), [])

  const endRound = useCallback(
    (res: { ok: boolean; aArea: number; bArea: number; total: number }) => {
      const s = stateRef.current
      if (s.phase !== 'playing' || s.flash) return
      setFlash(res)
      if (res.ok) {
        setScore((v) => v + 1)
        streakRef.current += 1
        if (streakRef.current > bestRef.current) bestRef.current = streakRef.current
        setStreak(streakRef.current)
      } else {
        streakRef.current = 0
        setStreak(0)
      }
      window.clearTimeout(advanceRef.current)
      advanceRef.current = window.setTimeout(
        () => {
          const cur = stateRef.current
          const next = cur.pos + 1
          setFlash(null)
          if (next >= cur.order.length) {
            setPhase('done')
            setFinished(true)
            setBest(bestRef.current)
          } else {
            const nextShape = step.shapes[cur.order[next]]
            const sc = startCut(nextShape)
            setPos(next)
            setTimeLeft(perShape)
            setOrientation(sc.orientation)
            setSplit(sc.split)
          }
        },
        res.ok ? 950 : 1500,
      )
    },
    [perShape, step.shapes],
  )

  // Per-slab countdown. Pauses while a result is flashing. On timeout, reveal a
  // correct cut so the learner sees the decomposition they missed.
  useEffect(() => {
    if (phase !== 'playing' || flash) return
    if (timeLeft <= 0) {
      const shape = step.shapes[order[pos]]
      const cut = findValidCut(shape)
      /* eslint-disable react-hooks/set-state-in-effect -- intentional: on timeout, reveal the correct cut and end the round */
      if (cut) {
        setOrientation(cut.orientation)
        setSplit(cut.split)
        endRound({ ok: false, aArea: cut.aArea, bArea: cut.bArea, total: cut.aArea + cut.bArea })
      } else {
        endRound({ ok: false, aArea: 0, bArea: 0, total: 0 })
      }
      /* eslint-enable react-hooks/set-state-in-effect */
      return
    }
    const id = window.setTimeout(() => setTimeLeft((t) => +(t - 0.1).toFixed(1)), 100)
    return () => window.clearTimeout(id)
  }, [phase, flash, timeLeft, order, pos, step.shapes, endRound])

  const start = () => {
    if (locked) return
    streakRef.current = 0
    bestRef.current = 0
    const ord = shuffle(step.shapes.length).slice(0, runLen)
    const sc = startCut(step.shapes[ord[0]])
    setOrder(ord)
    setPos(0)
    setScore(0)
    setStreak(0)
    setBest(0)
    setTimeLeft(perShape)
    setFlash(null)
    setFinished(false)
    setOrientation(sc.orientation)
    setSplit(sc.split)
    setPhase('playing')
  }

  if (phase === 'ready') {
    return (
      <div className="interactive rapid">
        <div className="rapid-card">
          <p className="rapid-big">Split Sprint</p>
          <p className="rapid-sub">
            {runLen} slabs ride down the belt, {perShape}s each. Drag the cutter (and flip it ⟷ / ↕)
            to slice each slab into <strong>two rectangles</strong>, then tap Split before it rolls
            off. Clear {passBar} to pass — and chase a streak!
          </p>
          <button type="button" className="btn primary full" disabled={locked} onClick={start}>
            Start
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    const passed = score >= passBar
    return (
      <div className="interactive rapid">
        <div className="rapid-card">
          <p className="rapid-big">{passed ? (score === runLen ? 'Perfect run!' : 'Belt cleared!') : 'Belt jam!'}</p>
          <p className="rapid-score">
            {score} / {runLen}
          </p>
          <p className="rapid-sub">Best streak: {best} in a row.</p>
          <button type="button" className="btn ghost full" disabled={locked} onClick={start}>
            Play again
          </button>
          <p className="rapid-sub" style={{ marginTop: 4 }}>
            {passed
              ? 'Press Check below to finish the lesson.'
              : `Slice at least ${passBar} of ${runLen} to pass — tap Play again.`}
          </p>
        </div>
      </div>
    )
  }

  // ---- playing ----
  const shape = step.shapes[order[pos]]
  const { cols, rows, cells } = shape

  // Cell size + placement: the slab rests on top of the conveyor belt.
  const workW = VB_W - 2 * PAD_X
  const workH = VB_H - GRID_TOP - BELT_H - 10
  const S = Math.min(workW / cols, workH / rows)
  const floorW = cols * S
  const floorH = rows * S
  const offX = (VB_W - floorW) / 2
  const beltY = VB_H - BELT_H
  const offY = beltY - floorH
  const gx = (c: number) => offX + c * S
  const gy = (r: number) => offY + (rows - 1 - r) * S

  const { a: regionA, b: regionB } = partition(shape, orientation, split)
  const validSplit = isSolidRect(regionA) && isSolidRect(regionB)
  const areaA = regionA.length
  const areaB = regionB.length

  const regionPx = (region: Cell[]) => {
    const { minC, minR, w, h } = boundingRect(region)
    const x = offX + minC * S
    const y = offY + (rows - minR - h) * S
    const wPx = w * S
    const hPx = h * S
    return { x, y, wPx, hPx, cx: x + wPx / 2, cy: y + hPx / 2 }
  }
  const gA = validSplit ? regionPx(regionA) : null
  const gB = validSplit ? regionPx(regionB) : null

  const isV = orientation === 'v'
  const cutX = offX + split * S
  const cutY = offY + (rows - split) * S
  const lineX1 = isV ? cutX : offX
  const lineY1 = isV ? offY : cutY
  const lineX2 = isV ? cutX : offX + floorW
  const lineY2 = isV ? offY + floorH : cutY
  const handleX = isV ? cutX : offX + floorW / 2
  const handleY = isV ? offY + floorH / 2 : cutY
  const cutColor = validSplit ? 'var(--good)' : 'var(--bad)'

  const update = (clientX: number, clientY: number) => {
    if (!svgRef.current) return
    const p = clientToViewBox(svgRef.current, clientX, clientY, VB_W, VB_H)
    if (orientation === 'v') {
      setSplit(clamp(Math.round((p.x - offX) / S), 1, cols - 1))
    } else {
      setSplit(clamp(rows - Math.round((p.y - offY) / S), 1, rows - 1))
    }
  }
  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (locked || flash) return
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    update(e.clientX, e.clientY)
  }
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragging.current) update(e.clientX, e.clientY)
  }
  const onUp = () => {
    dragging.current = false
  }

  const flip = (o: Orientation) => {
    if (locked || flash) return
    setOrientation(o)
    setSplit((s) => clamp(s, 1, (o === 'v' ? cols : rows) - 1))
  }

  const submit = () => {
    if (locked || flash || !validSplit) return
    endRound({ ok: true, aArea: areaA, bArea: areaB, total: areaA + areaB })
  }

  const frac = Math.max(0, Math.min(1, timeLeft / perShape))
  const low = frac < 0.34

  // A few chevrons along the belt to suggest travel direction.
  const chevrons = Array.from({ length: 6 }, (_, i) => 30 + i * ((VB_W - 60) / 5))

  return (
    <div className="interactive rapid">
      <div className="rapid-hud">
        <span>
          Slab {pos + 1}/{runLen}
        </span>
        <span>Cleared {score}</span>
        <span>🔥 {streak}</span>
      </div>

      <div className="rapid-timer">
        <div
          className="rapid-timer-fill"
          style={{ width: `${frac * 100}%`, background: low ? 'var(--bad)' : 'var(--accent)' }}
        />
      </div>

      <div className="rapid-stage" style={{ minHeight: 0, padding: 0, overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          width="100%"
          style={{ display: 'block', touchAction: 'none', cursor: locked || flash ? 'default' : isV ? 'ew-resize' : 'ns-resize' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
        >
          {/* Conveyor belt */}
          <rect x={8} y={beltY} width={VB_W - 16} height={BELT_H} rx={10} fill="var(--fig-stroke)" opacity={0.18} />
          <rect x={8} y={beltY} width={VB_W - 16} height={BELT_H} rx={10} fill="none" stroke="var(--fig-stroke)" strokeWidth={1} opacity={0.4} />
          {chevrons.map((cx, i) => (
            <path
              key={`ch${i}`}
              d={`M${cx} ${beltY + BELT_H / 2 - 6} l8 6 l-8 6`}
              fill="none"
              stroke="var(--fig-stroke)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.35}
            />
          ))}
          <circle cx={22} cy={beltY + BELT_H / 2} r={BELT_H / 2 - 5} fill="var(--card)" stroke="var(--fig-stroke)" strokeWidth={1.5} opacity={0.7} />
          <circle cx={VB_W - 22} cy={beltY + BELT_H / 2} r={BELT_H / 2 - 5} fill="var(--card)" stroke="var(--fig-stroke)" strokeWidth={1.5} opacity={0.7} />

          {/* Soft contact shadow under the slab */}
          <ellipse cx={offX + floorW / 2} cy={beltY + 3} rx={floorW / 2} ry={6} fill="#000" opacity={0.12} />

          {/* Faint grid across the slab's bounding box */}
          {Array.from({ length: cols + 1 }, (_, i) => (
            <line key={`gv${i}`} x1={offX + i * S} y1={offY} x2={offX + i * S} y2={offY + floorH} stroke="var(--grid)" strokeWidth={1} />
          ))}
          {Array.from({ length: rows + 1 }, (_, i) => (
            <line key={`gh${i}`} x1={offX} y1={offY + i * S} x2={offX + floorW} y2={offY + i * S} stroke="var(--grid)" strokeWidth={1} />
          ))}

          {/* The slab itself, one solid stone region */}
          {cells.map(([c, r]) => (
            <rect
              key={`s${c},${r}`}
              x={gx(c)}
              y={gy(r)}
              width={S}
              height={S}
              fill="var(--fig-stroke)"
              fillOpacity={0.16}
              stroke="var(--fig-stroke)"
              strokeOpacity={0.3}
              strokeWidth={0.6}
            />
          ))}

          {/* When the cut yields two rectangles, tint + label each with its area */}
          {gA && (
            <g>
              <rect x={gA.x} y={gA.y} width={gA.wPx} height={gA.hPx} fill="var(--accent-bg)" stroke="var(--accent)" strokeWidth={2} rx={2} />
              <text x={gA.cx} y={gA.cy} textAnchor="middle" dominantBaseline="central" fontSize={Math.min(20, S * 0.7)} fontWeight={800} fill="var(--accent)">
                {areaA}
              </text>
            </g>
          )}
          {gB && (
            <g>
              <rect x={gB.x} y={gB.y} width={gB.wPx} height={gB.hPx} fill="var(--good-bg)" stroke="var(--good)" strokeWidth={2} rx={2} />
              <text x={gB.cx} y={gB.cy} textAnchor="middle" dominantBaseline="central" fontSize={Math.min(20, S * 0.7)} fontWeight={800} fill="var(--good)">
                {areaB}
              </text>
            </g>
          )}

          {/* The draggable cutter: a white casing under a dashed blade */}
          <line x1={lineX1} y1={lineY1} x2={lineX2} y2={lineY2} stroke="#fff" strokeOpacity={0.7} strokeWidth={5} strokeLinecap="round" />
          <line x1={lineX1} y1={lineY1} x2={lineX2} y2={lineY2} stroke={cutColor} strokeWidth={3} strokeDasharray="7 4" strokeLinecap="round" />
          <g style={{ cursor: locked || flash ? 'default' : isV ? 'ew-resize' : 'ns-resize' }}>
            <circle cx={handleX} cy={handleY} r={12} fill={cutColor} stroke="#fff" strokeWidth={2.5} />
            {isV ? (
              <path
                d={`M${handleX - 6} ${handleY} h12 M${handleX - 6} ${handleY} l3 -3 M${handleX - 6} ${handleY} l3 3 M${handleX + 6} ${handleY} l-3 -3 M${handleX + 6} ${handleY} l-3 3`}
                stroke="#fff"
                strokeWidth={1.4}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d={`M${handleX} ${handleY - 6} v12 M${handleX} ${handleY - 6} l-3 3 M${handleX} ${handleY - 6} l3 3 M${handleX} ${handleY + 6} l-3 -3 M${handleX} ${handleY + 6} l3 -3`}
                stroke="#fff"
                strokeWidth={1.4}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        </svg>

        {flash && (
          <div className={`rapid-flash ${flash.ok ? 'ok' : 'no'}`}>
            {flash.ok ? '✓ ' : '⏱ '}
            {flash.aArea} + {flash.bArea} = {flash.total}
          </div>
        )}
      </div>

      <p className="sort-help">
        {validSplit
          ? `Two rectangles: ${areaA} + ${areaB} = ${areaA + areaB} — tap Split!`
          : 'Drag the cutter (flip it ⟷ / ↕) to slice the slab into two full rectangles.'}
      </p>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          className={isV ? 'btn primary' : 'btn'}
          style={{ flex: 1, padding: '10px 0', fontSize: 14 }}
          disabled={locked || !!flash}
          onClick={() => flip('v')}
        >
          Cut ⟷
        </button>
        <button
          type="button"
          className={!isV ? 'btn primary' : 'btn'}
          style={{ flex: 1, padding: '10px 0', fontSize: 14 }}
          disabled={locked || !!flash}
          onClick={() => flip('h')}
        >
          Cut ↕
        </button>
      </div>

      <button
        type="button"
        className="btn primary full"
        disabled={locked || !!flash || !validSplit}
        onClick={submit}
      >
        Split!
      </button>
    </div>
  )
}
