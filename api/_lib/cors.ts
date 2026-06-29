import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Allowed origins for cross-origin calls. CORS_ALLOW_ORIGIN may be a single
 * origin or a comma-separated list. "*" allows any origin. Local dev origins
 * (localhost / 127.0.0.1 on any port) are always allowed so the app works from
 * `vite` without weakening the production allowlist.
 */
const CONFIGURED = (process.env.CORS_ALLOW_ORIGIN ?? '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

const isLocalhost = (origin: string): boolean =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)

/** Resolve the value to send back in Access-Control-Allow-Origin, or null if disallowed. */
function resolveOrigin(reqOrigin: string | undefined): string | null {
  if (CONFIGURED.includes('*')) return '*'
  if (!reqOrigin) return CONFIGURED[0] ?? null
  if (CONFIGURED.includes(reqOrigin) || isLocalhost(reqOrigin)) return reqOrigin
  return CONFIGURED[0] ?? null
}

/** Apply CORS headers; returns true if it handled a preflight (caller should stop). */
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const reqOrigin = Array.isArray(req.headers.origin)
    ? req.headers.origin[0]
    : req.headers.origin
  const allowOrigin = resolveOrigin(reqOrigin)
  if (allowOrigin) res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '3600')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}
