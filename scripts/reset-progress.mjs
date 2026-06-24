// Reset all progress for a single user (by email), keeping their account/profile.
//
// What it does:
//   1. Looks up the Firebase Auth user by email -> uid.
//   2. Deletes every doc under users/{uid}/progress.
//   3. Resets the streak on users/{uid} back to zero (profile fields untouched).
//
// Credentials (admin scripts cannot use the app's interactive login):
//   Provide a service account key via either
//     GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
//   or place the file at ./serviceAccount.json in the project root.
//   Download one from: Firebase Console -> Project Settings -> Service accounts
//   -> "Generate new private key".
//
// Usage:
//   node scripts/reset-progress.mjs ronny65physics@gmail.com           # dry run (shows what WOULD happen)
//   node scripts/reset-progress.mjs ronny65physics@gmail.com --confirm # actually reset

import { readFileSync, existsSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const email = process.argv[2]
const confirm = process.argv.includes('--confirm')

if (!email) {
  console.error('Usage: node scripts/reset-progress.mjs <email> [--confirm]')
  process.exit(1)
}

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ?? './serviceAccount.json'

if (!existsSync(keyPath)) {
  console.error(
    `No service account key found at "${keyPath}".\n` +
      'Set GOOGLE_APPLICATION_CREDENTIALS or place serviceAccount.json in the project root.\n' +
      'Download it from Firebase Console -> Project Settings -> Service accounts -> Generate new private key.',
  )
  process.exit(1)
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))
initializeApp({ credential: cert(serviceAccount) })

const auth = getAuth()
const db = getFirestore()

const emptyStreak = { current: 0, longest: 0, lastActiveDate: '' }

async function main() {
  const user = await auth.getUserByEmail(email)
  const uid = user.uid
  console.log(`Found user: ${email} -> uid ${uid}`)

  const progressCol = db.collection('users').doc(uid).collection('progress')
  const snap = await progressCol.get()

  console.log(`Progress lessons to delete: ${snap.size}`)
  snap.forEach((d) => console.log(`  - ${d.id}`))

  if (!confirm) {
    console.log(
      '\nDry run only. Re-run with --confirm to delete progress and reset the streak.',
    )
    return
  }

  const batch = db.batch()
  snap.forEach((d) => batch.delete(d.ref))
  batch.update(db.collection('users').doc(uid), { streak: emptyStreak })
  await batch.commit()

  console.log(`\nDone. Deleted ${snap.size} lesson(s) and reset streak for ${email}.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed:', err.message ?? err)
    process.exit(1)
  })
