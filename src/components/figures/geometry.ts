import type { Point } from '../../content/types'

/** Convert a pointer event's client coordinates into SVG viewBox coordinates. */
export function clientToViewBox(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
  vbW: number,
  vbH: number,
): Point {
  const rect = svg.getBoundingClientRect()
  return {
    x: ((clientX - rect.left) / rect.width) * vbW,
    y: ((clientY - rect.top) / rect.height) * vbH,
  }
}

/** Interior angle (degrees) at vertex `v` formed by rays to `a` and `b`. */
export function angleAtDeg(v: Point, a: Point, b: Point): number {
  const v1 = { x: a.x - v.x, y: a.y - v.y }
  const v2 = { x: b.x - v.x, y: b.y - v.y }
  const dot = v1.x * v2.x + v1.y * v2.y
  const m1 = Math.hypot(v1.x, v1.y)
  const m2 = Math.hypot(v2.x, v2.y)
  if (m1 === 0 || m2 === 0) return 0
  const cos = Math.min(1, Math.max(-1, dot / (m1 * m2)))
  return (Math.acos(cos) * 180) / Math.PI
}

export const dist = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y)
