import { useEffect, useRef, useState } from 'react'
import type { BraceItStep as BStep } from '../../content/types'
import type { InteractiveStepProps } from './stepProps'
import { clientToViewBox } from '../figures/geometry'

const VB_W = 320
const VB_H = 300

// Schematic frame (fixed on-screen size, NOT to scale — forces computing, not eyeballing).
const FX = 78
const FY = 46
const FW = 150
const FH = 116
const BL = { x: FX, y: FY + FH }
const TR = { x: FX + FW, y: FY }

// Cut ruler ("lumber")
const RULER_X0 = 40
const RULER_X1 = 284
const RULER_Y = 250

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const braceLen = (w: number, h: number) => Math.round(Math.hypot(w, h))

export function BraceItStep({ step, setChecker, locked }: InteractiveStepProps<BStep>) {
  const frames = step.frames
  const unit = step.unit ?? ''
  const maxCut = step.maxCut ?? Math.max(...frames.map((f) => braceLen(f.w, f.h))) + 3

  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragging = useRef(false)
  const advanceTimer = useRef<number | null>(null)
  const shakeTimer = useRef<number | null>(null)

  const [current, setCurrent] = useState(0)
  const [cut, setCut] = useState(2)
  const [wasted, setWasted] = useState(0)
  const [feedback, setFeedback] = useState<'idle' | 'short' | 'long'>('idle')
  const [shake, setShake] = useState(false)
  const [justBraced, setJustBraced] = useState(false)

  const allDone = current >= frames.length

  useEffect(() => setChecker(() => current >= frames.length), [current, frames.length, setChecker])

  useEffect(
    () => () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current)
      if (shakeTimer.current) window.clearTimeout(shakeTimer.current)
    },
    [],
  )

  const frame = frames[Math.min(current, frames.length - 1)]
  const answer = braceLen(frame.w, frame.h)
  const busy = locked || allDone || justBraced

  const valueToX = (v: number) => RULER_X0 + ((v - 1) / (maxCut - 1)) * (RULER_X1 - RULER_X0)
  const xToValue = (x: number) =>
    clamp(Math.round(1 + ((x - RULER_X0) / (RULER_X1 - RULER_X0)) * (maxCut - 1)), 1, maxCut)

  const setFromPointer = (clientX: number, clientY: number) => {
    if (!svgRef.current) return
    const p = clientToViewBox(svgRef.current, clientX, clientY, VB_W, VB_H)
    setCut(xToValue(p.x))
    setFeedback('idle')
  }
  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (busy) return
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    setFromPointer(e.clientX, e.clientY)
  }
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragging.current) setFromPointer(e.clientX, e.clientY)
  }
  const onUp = () => {
    dragging.current = false
  }

  const nudge = (d: number) => {
    if (busy) return
    setCut((c) => clamp(c + d, 1, maxCut))
    setFeedback('idle')
  }

  const cutAndFit = () => {
    if (busy) return
    if (cut === answer) {
      setJustBraced(true)
      setFeedback('idle')
      advanceTimer.current = window.setTimeout(() => {
        setJustBraced(false)
        setCurrent((c) => c + 1)
        setCut(2)
      }, 900)
    } else {
      setWasted((n) => n + 1)
      setFeedback(cut < answer ? 'short' : 'long')
      setShake(true)
      if (shakeTimer.current) window.clearTimeout(shakeTimer.current)
      shakeTimer.current = window.setTimeout(() => setShake(false), 420)
    }
  }

  // ruler ticks
  const ticks = []
  for (let v = 1; v <= maxCut; v++) {
    const major = v % 5 === 0 || v === 1
    const x = valueToX(v)
    ticks.push(
      <line key={`tk${v}`} x1={x} y1={RULER_Y} x2={x} y2={RULER_Y - (major ? 10 : 6)} stroke="var(--border)" strokeWidth={major ? 1.5 : 1} />,
    )
    if (major)
      ticks.push(
        <text key={`tl${v}`} x={x} y={RULER_Y + 13} fontSize={9} fill="var(--muted)" textAnchor="middle">{v}</text>,
      )
  }
  const handleX = valueToX(cut)

  const frameClass = shake ? 'brace-shake' : !busy ? 'brace-wobble' : ''
  const beamColor = justBraced ? 'var(--good)' : '#b5854b'

  return (
    <div className="interactive">
      <div className="brace-hud">
        <span>{allDone ? 'All frames braced' : `Frame ${current + 1} of ${frames.length}`}</span>
        <span>Boards wasted: {wasted}</span>
      </div>

      <div className="readout">
        <span className="readout-value">{allDone ? '✓' : `${cut} ${unit}`}</span>
        <span className="readout-label">{allDone ? 'workshop complete' : 'brace length to cut'}</span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="interactive-svg"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        style={{ touchAction: 'none' }}
      >
        {/* ---- frame ---- */}
        <g className={frameClass}>
          {/* beams */}
          <rect x={FX} y={FY} width={FW} height={FH} fill="none" stroke={beamColor} strokeWidth={9} strokeLinejoin="round" />

          {/* diagonal brace: a faint guide with "?" until cut correctly, solid wood when braced */}
          {justBraced ? (
            <line x1={BL.x} y1={BL.y} x2={TR.x} y2={TR.y} stroke="var(--good)" strokeWidth={9} strokeLinecap="round" />
          ) : (
            !allDone && (
              <>
                <line x1={BL.x} y1={BL.y} x2={TR.x} y2={TR.y} stroke="var(--fig-stroke)" strokeWidth={1.5} strokeDasharray="5 5" opacity={0.5} />
                <text x={(BL.x + TR.x) / 2 + 10} y={(BL.y + TR.y) / 2} fontSize={16} fontWeight={800} fill="var(--accent)" textAnchor="middle">?</text>
              </>
            )
          )}

          {/* right-angle tick at the bottom-left corner */}
          <path d={`M ${BL.x + 12} ${BL.y} L ${BL.x + 12} ${BL.y - 12} L ${BL.x} ${BL.y - 12}`} fill="none" stroke="var(--card)" strokeWidth={1.5} />

          {/* side labels (the only measurements you get) */}
          {!allDone && (
            <>
              <text x={FX + FW / 2} y={FY + FH + 20} fontSize={13} fontWeight={700} fill="var(--text-h)" textAnchor="middle">{frame.w} {unit}</text>
              <text x={FX - 14} y={FY + FH / 2} fontSize={13} fontWeight={700} fill="var(--text-h)" textAnchor="middle" dominantBaseline="central">{frame.h} {unit}</text>
            </>
          )}
        </g>

        {allDone && (
          <text x={VB_W / 2} y={FY + FH / 2} fontSize={18} fontWeight={800} fill="var(--good)" textAnchor="middle">Every frame locked square!</text>
        )}

        {/* ---- cut ruler / lumber ---- */}
        {!allDone && (
          <>
            <rect x={RULER_X0 - 6} y={RULER_Y - 4} width={RULER_X1 - RULER_X0 + 12} height={8} rx={3} fill="#d8b27a" opacity={0.5} />
            <line x1={RULER_X0} y1={RULER_Y} x2={RULER_X1} y2={RULER_Y} stroke="var(--border)" strokeWidth={2} />
            {ticks}
            {/* the board being cut, from start to the handle */}
            <line x1={RULER_X0} y1={RULER_Y - 18} x2={handleX} y2={RULER_Y - 18} stroke="#b5854b" strokeWidth={7} strokeLinecap="round" />
            <circle cx={handleX} cy={RULER_Y - 18} r={9} fill="var(--accent)" stroke="#fff" strokeWidth={2} style={{ cursor: busy ? 'default' : 'grab' }} />
          </>
        )}
      </svg>

      {feedback !== 'idle' && (
        <p className="sort-help brace-feedback bad">
          {feedback === 'short' ? 'Too short — the board can’t reach the far corner. Re-measure and recut.' : 'Too long — the board juts past the corner. Re-measure and recut.'}
        </p>
      )}

      {allDone ? (
        <p className="sort-help brace-feedback win">
          Workshop complete! Every diagonal brace was just c = √(w² + h²) of its frame.
        </p>
      ) : (
        <>
          <div className="brace-controls">
            <button type="button" className="btn" onClick={() => nudge(-1)} disabled={busy} aria-label="Shorter">−</button>
            <button type="button" className="btn primary grow" onClick={cutAndFit} disabled={busy}>Cut &amp; fit the brace</button>
            <button type="button" className="btn" onClick={() => nudge(1)} disabled={busy} aria-label="Longer">+</button>
          </div>
          <p className="sort-help">
            Read the frame’s two sides, work out the diagonal brace, set the saw to that length, then cut &amp; fit it to lock the frame.
          </p>
        </>
      )}
    </div>
  )
}
