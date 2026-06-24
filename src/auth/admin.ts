import { useAuth } from './AuthContext'

/**
 * Allowlist of accounts that get admin mode. Admins can move freely through the
 * lesson path without completing assignments. Kept as an email allowlist because
 * this is a single-owner dev tool; comparison is case-insensitive.
 */
const ADMIN_EMAILS = ['lawrence.dong@alphaaiengineering.com']

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.trim().toLowerCase())
}

/**
 * Convenience hook: true when the signed-in user is an admin.
 *
 * Prefers the tamper-proof `admin` custom claim from the user's ID token (set
 * via scripts/grant-admin.mjs and enforced by Firestore rules). Falls back to
 * the email allowlist so admin UX works before the claim has been granted.
 * Note: this only gates client-side UX; real data access is enforced by rules.
 */
export function useIsAdmin(): boolean {
  const { user, isAdminClaim } = useAuth()
  return isAdminClaim || isAdmin(user?.email)
}
