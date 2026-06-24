import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { initializeFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Phase 1 runs locally. If the project hasn't been configured yet, the app
// renders a friendly setup screen instead of crashing (see App.tsx).
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
)

let app: FirebaseApp | undefined
let authInstance: Auth | undefined
let dbInstance: Firestore | undefined

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  authInstance = getAuth(app)
  // Auto-detect long polling so Firestore still connects behind proxies,
  // VPNs, or browser shields/ad blockers that break the default streaming
  // transport (a common cause of "stuck loading" on localhost).
  dbInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  })
}

export const auth = authInstance as Auth
export const db = dbInstance as Firestore
