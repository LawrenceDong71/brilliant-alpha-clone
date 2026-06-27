import { initializeApp, getApps, cert, type App, type ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

/**
 * Firebase Admin init for a NON-Firebase host (Vercel). Unlike Cloud Functions
 * — which get credentials automatically — Vercel must be given a service account.
 * Provide it via the FIREBASE_SERVICE_ACCOUNT env var, either as raw JSON or as
 * base64-encoded JSON (base64 is easier to paste into a dashboard).
 */
function loadServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set.')
  const json = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
  return JSON.parse(json) as ServiceAccount
}

let cached: App | undefined
function adminApp(): App {
  if (cached) return cached
  cached = getApps()[0] ?? initializeApp({ credential: cert(loadServiceAccount()) })
  return cached
}

export function adminAuth() {
  return getAuth(adminApp())
}

export function adminDb() {
  return getFirestore(adminApp())
}
