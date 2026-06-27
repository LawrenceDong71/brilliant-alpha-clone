import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'
import { adminProjectId } from './firebaseAdmin.js'

/**
 * Verify a Firebase ID token WITHOUT firebase-admin/auth, whose jwks-rsa -> jose
 * dependency chain crashes under Vercel (jwks-rsa is CJS and require()s the
 * ESM-only jose). We validate the RS256 signature against Google's public keys
 * and check issuer / audience / expiry directly with `jose`. Throws if invalid.
 */

const JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

let jwks: JWTVerifyGetKey | undefined

export async function verifyFirebaseToken(token: string): Promise<void> {
  const projectId = adminProjectId()
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(JWKS_URL))
  }
  await jwtVerify(token, jwks, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  })
}
