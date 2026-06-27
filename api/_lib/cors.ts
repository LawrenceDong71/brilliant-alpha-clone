import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Allowed origin for cross-origin calls. Defaults to "*" so the API works
 * whether the frontend is served from the same Vercel deployment (same-origin,
 * no CORS needed) or a separate host (e.g. Firebase Hosting). Set
 * CORS_ALLOW_ORIGIN to your exact frontend origin to lock it down.
 */
const ALLOW_ORIGIN = process.env.CORS_ALLOW_ORIGIN ?? '*'

/** Apply CORS headers; returns true if it handled a preflight (caller should stop). */
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN)
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
