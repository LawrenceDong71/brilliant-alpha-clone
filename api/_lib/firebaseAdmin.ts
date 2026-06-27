import { initializeApp, getApps, cert, type App, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

/**
 * Firebase Admin init for a NON-Firebase host (Vercel). Provide the service
 * account via the FIREBASE_SERVICE_ACCOUNT env var (raw JSON or base64-encoded
 * JSON). We deliberately use ONLY firebase-admin/app + /firestore here — NOT
 * firebase-admin/auth, whose jwks-rsa -> jose (ESM-only) chain crashes under
 * Vercel's CommonJS runtime. Token verification is done in verifyToken.ts.
 */
function loadRaw(): Record<string, unknown> {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set.')
  const json = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
  return JSON.parse(json) as Record<string, unknown>
}

let cached: App | undefined
function adminApp(): App {
  if (cached) return cached
  cached = getApps()[0] ?? initializeApp({ credential: cert(loadRaw() as unknown as ServiceAccount) })
  return cached
}

export function adminDb() {
  return getFirestore(adminApp())
}

/** The Firebase project id (from the service account), used to check token aud/iss. */
export function adminProjectId(): string {
  const pid = loadRaw().project_id
  if (typeof pid !== 'string') throw new Error('Service account missing project_id.')
  return pid
}
