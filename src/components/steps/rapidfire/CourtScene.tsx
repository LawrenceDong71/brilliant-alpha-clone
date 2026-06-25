import { COURT } from './types'
import type { CourtSceneProps } from './types'

// viewBox is the shared court box; all ids in this file are prefixed `rf-`.
const VB_W = COURT.width
const VB_H = COURT.height
const RIM_RX = 13
const WEDGE_R = 34
const EDGE = 12

// Trim trig output so emitted path strings stay tidy.
const r2 = (n: number) => Math.round(n * 100) / 100
const clampX = (x: number) => Math.max(EDGE, Math.min(VB_W - EDGE, x))
const clampY = (y: number) => Math.max(EDGE, Math.min(VB_H - 8, y))

/** Largest t in [0, maxLen] so origin + t·dir(rad) stays inside the viewBox. */
function fitLength(ox: number, oy: number, rad: number, maxLen: number): number {
  const ux = Math.cos(rad)
  const uy = -Math.sin(rad)
  const m = 8
  let t = maxLen
  if (ux > 1e-6) t = Math.min(t, (VB_W - m - ox) / ux)
  else if (ux < -1e-6) t = Math.min(t, (m - ox) / ux)
  if (uy > 1e-6) t = Math.min(t, (VB_H - m - oy) / uy)
  else if (uy < -1e-6) t = Math.min(t, (m - oy) / uy)
  return Math.max(0, t)
}

// Angle caption with a card-coloured legibility halo (stroke painted under fill),
// so it reads over the light or dark hardwood in either theme.
function AngleLabel({ x, y, color, text }: { x: number; y: number; color: string; text: string }) {
  return (
    <text
      x={clampX(x)}
      y={clampY(y)}
      fontSize={12}
      fontWeight={700}
      textAnchor="middle"
      fill={color}
      stroke="var(--card)"
      strokeWidth={3}
      paintOrder="stroke"
      strokeLinejoin="round"
    >
      {text}
    </text>
  )
}

export function CourtScene({
  ball,
  hoop,
  correctAngle,
  chosenAngle = null,
  reveal,
  result = null,
  width,
  height,
  reduceMotion = false,
}: CourtSceneProps) {
  const hx = hoop.x
  const hy = hoop.y

  // True ball -> hoop sightline (degrees above the horizontal baseline).
  const dx = hx - ball.x
  const dy = hy - ball.y
  const rayLen = Math.hypot(dx, dy)
  const trueRad = Math.atan2(-dy, dx)
  const trueColor = result === 'correct' ? 'var(--good)' : 'var(--accent)'
  const wedgeFill = result === 'correct' ? 'var(--good-bg)' : 'var(--accent-bg)'

  // Angle wedge at the ball, between the baseline and the true ray.
  const wedgeBaseX = ball.x + WEDGE_R
  const wedgeTipX = ball.x + WEDGE_R * Math.cos(trueRad)
  const wedgeTipY = ball.y - WEDGE_R * Math.sin(trueRad)
  const wedgePath =
    `M ${r2(ball.x)} ${r2(ball.y)} L ${r2(wedgeBaseX)} ${r2(ball.y)} ` +
    `A ${WEDGE_R} ${WEDGE_R} 0 0 0 ${r2(wedgeTipX)} ${r2(wedgeTipY)} Z`
  const trueLabelA = trueRad / 2
  const trueLabelX = ball.x + (WEDGE_R + 16) * Math.cos(trueLabelA)
  const trueLabelY = ball.y - (WEDGE_R + 16) * Math.sin(trueLabelA)

  // Learner's wrong guess: a ghost ray at chosenAngle, same length (clamped in-frame).
  const showChosen = reveal && chosenAngle != null && (result === 'wrong' || result === 'timeout')
  const chosenRad = ((chosenAngle ?? 0) * Math.PI) / 180
  const chosenLen = showChosen ? fitLength(ball.x, ball.y, chosenRad, rayLen) : 0
  const chosenEndX = ball.x + chosenLen * Math.cos(chosenRad)
  const chosenEndY = ball.y - chosenLen * Math.sin(chosenRad)
  // Push the caption to the side of the ghost ray facing away from the true ray.
  const chosenSide = chosenRad >= trueRad ? 1 : -1
  const chosenLabelT = chosenLen * 0.6
  const chosenLabelX = ball.x + chosenLabelT * Math.cos(chosenRad) - chosenSide * 11 * Math.sin(chosenRad)
  const chosenLabelY = ball.y - chosenLabelT * Math.sin(chosenRad) - chosenSide * 11 * Math.cos(chosenRad)

  // Hoop hardware sits on the side away from the ball, kept inside the frame.
  let far = hx >= ball.x ? 1 : -1
  if (far === 1 && hx + 30 > VB_W - 2) far = -1
  if (far === -1 && hx - 30 < 2) far = 1
  const poleX = hx + far * 26
  const bbX = far === 1 ? hx + 12 : hx - 28
  const innerX = far === 1 ? hx + 15 : hx - 24

  // Remount key so the SMIL shot + swish replay on every new round's reveal.
  const revealKey = `${ball.x}-${ball.y}-${hx}-${hy}`

  const ballArt = (
    <>
      <circle r={COURT.ballR} fill="#e8743b" stroke="#b85a26" strokeWidth={1} />
      <line x1={-COURT.ballR} y1={0} x2={COURT.ballR} y2={0} stroke="#7a3c18" strokeWidth={1} />
      <line x1={0} y1={-COURT.ballR} x2={0} y2={COURT.ballR} stroke="#7a3c18" strokeWidth={1} />
      <path d="M -9 0 A 12 12 0 0 1 -2 -8.7" fill="none" stroke="#7a3c18" strokeWidth={1} />
      <path d="M 9 0 A 12 12 0 0 0 2 -8.7" fill="none" stroke="#7a3c18" strokeWidth={1} />
    </>
  )

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="interactive-svg court"
      width={width}
      height={height}
      role="img"
      aria-label={
        reveal
          ? `The true shot angle is ${Math.round(correctAngle)} degrees`
          : 'Eyeball the angle from the basketball to the hoop'
      }
    >
      {/* hardwood floor: ground line + faint plank seam + faint midcourt line */}
      <line x1={0} y1={COURT.ground + 12} x2={VB_W} y2={COURT.ground + 12} stroke="var(--fig-stroke)" strokeWidth={1} opacity={0.16} />
      <line x1={VB_W / 2} y1={COURT.ground} x2={VB_W / 2} y2={VB_H} stroke="var(--fig-stroke)" strokeWidth={1} opacity={0.14} />
      <line x1={4} y1={COURT.ground} x2={VB_W - 4} y2={COURT.ground} stroke="var(--fig-stroke)" strokeWidth={3} strokeLinecap="round" />

      {/* angle baseline: faint horizontal through the ball's centre */}
      <line x1={10} y1={ball.y} x2={VB_W - 10} y2={ball.y} stroke="var(--muted)" strokeWidth={1} opacity={0.5} strokeDasharray="2 5" />

      {/* question-only 0° origin: the angle is read from here, sweeping up and over.
          This anchors the measurement so a left-side (obtuse) hoop reads as the
          wide outward angle, not the small one. */}
      {!reveal && (
        <g pointerEvents="none">
          <line
            x1={ball.x}
            y1={ball.y}
            x2={clampX(ball.x + 32)}
            y2={ball.y}
            stroke="var(--muted)"
            strokeWidth={2}
            opacity={0.85}
          />
          <text x={clampX(ball.x + 40)} y={ball.y + 4} fontSize={9} fill="var(--muted)">
            0°
          </text>
        </g>
      )}

      {/* hoop: pole, backboard, net, rim (rim opening centred on props.hoop) */}
      <line x1={poleX} y1={COURT.ground} x2={poleX} y2={hy - 26} stroke="var(--fig-stroke)" strokeWidth={3} />
      <rect x={bbX} y={hy - 30} width={16} height={34} rx={2} fill="var(--card)" stroke="var(--fig-stroke)" strokeWidth={2} />
      <rect x={innerX} y={hy - 22} width={9} height={11} fill="none" stroke="var(--fig-stroke)" strokeWidth={1.5} />
      <path
        d={`M ${r2(hx - RIM_RX)} ${hy} L ${r2(hx - RIM_RX * 0.5)} ${hy + 16} L ${r2(hx + RIM_RX * 0.5)} ${hy + 16} L ${r2(hx + RIM_RX)} ${hy} Z`}
        fill="rgba(255,255,255,0.35)"
        stroke="#aaa"
        strokeWidth={1}
        opacity={0.8}
      />
      <line x1={hx} y1={hy} x2={hx} y2={hy + 16} stroke="#aaa" strokeWidth={1} opacity={0.7} />
      <ellipse cx={hx} cy={hy} rx={RIM_RX} ry={4} fill="none" stroke="var(--fig-stroke)" strokeWidth={3.5} />

      {/* reveal: wedge + true sightline + optional wrong-guess ghost ray + labels */}
      {reveal && (
        <>
          <path d={wedgePath} fill={wedgeFill} stroke={trueColor} strokeWidth={1.5} />
          <line x1={ball.x} y1={ball.y} x2={hx} y2={hy} stroke={trueColor} strokeWidth={3} strokeLinecap="round" />
          {showChosen && (
            <line
              x1={ball.x}
              y1={ball.y}
              x2={r2(chosenEndX)}
              y2={r2(chosenEndY)}
              stroke="var(--bad)"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              strokeLinecap="round"
            />
          )}
          {showChosen && chosenAngle != null && (
            <AngleLabel x={chosenLabelX} y={chosenLabelY} color="var(--bad)" text={`${Math.round(chosenAngle)}°`} />
          )}
          <AngleLabel x={trueLabelX} y={trueLabelY} color={trueColor} text={`${Math.round(correctAngle)}°`} />
        </>
      )}

      {/* basketball: static during the question; flies along the true ray on reveal */}
      {!reveal && <g transform={`translate(${ball.x}, ${ball.y})`}>{ballArt}</g>}
      {reveal && reduceMotion && <g transform={`translate(${hx}, ${hy})`}>{ballArt}</g>}
      {reveal && !reduceMotion && (
        <g key={revealKey}>
          {ballArt}
          <animateMotion
            dur="0.6s"
            begin="0s"
            fill="freeze"
            calcMode="spline"
            keyTimes="0;1"
            keySplines="0.4 0 0.6 1"
            path={`M ${r2(ball.x)} ${r2(ball.y)} L ${r2(hx)} ${r2(hy)}`}
          />
        </g>
      )}

      {/* swish: flash the rim green the instant a correct shot drops through */}
      {reveal &&
        result === 'correct' &&
        (reduceMotion ? (
          <ellipse cx={hx} cy={hy} rx={RIM_RX} ry={4} fill="none" stroke="var(--good)" strokeWidth={3.5} />
        ) : (
          <ellipse
            key={`swish-${revealKey}`}
            cx={hx}
            cy={hy}
            rx={RIM_RX}
            ry={4}
            fill="none"
            stroke="var(--good)"
            strokeWidth={3.5}
            opacity={0}
          >
            <animate attributeName="opacity" values="0;1;0.4;1" dur="0.5s" begin="0.5s" fill="freeze" />
            <animate attributeName="stroke-width" values="3.5;7;3.5" dur="0.5s" begin="0.5s" fill="freeze" />
          </ellipse>
        ))}
    </svg>
  )
}
