import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createUserWithEmailAndPassword,
  getIdTokenResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateEmail,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  /** True when the user's ID token carries the server-minted `admin` claim. */
  isAdminClaim: boolean
  signUp: (name: string, email: string, password: string) => Promise<void>
  logIn: (email: string, password: string) => Promise<void>
  logInWithGoogle: () => Promise<void>
  logOut: () => Promise<void>
  /** Update the signed-in user's display name. */
  updateName: (name: string) => Promise<void>
  /** Update the signed-in user's email address. */
  changeEmail: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdminClaim, setIsAdminClaim] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          const result = await getIdTokenResult(u)
          setIsAdminClaim(result.claims.admin === true)
        } catch {
          setIsAdminClaim(false)
        }
      } else {
        setIsAdminClaim(false)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdminClaim,
      async signUp(name, email, password) {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName: name })
        setUser({ ...cred.user })
      },
      async logIn(email, password) {
        await signInWithEmailAndPassword(auth, email, password)
      },
      async logInWithGoogle() {
        await signInWithPopup(auth, new GoogleAuthProvider())
      },
      async logOut() {
        await signOut(auth)
      },
      async updateName(name) {
        if (!auth.currentUser) return
        await updateProfile(auth.currentUser, { displayName: name })
        setUser({ ...auth.currentUser })
      },
      async changeEmail(email) {
        if (!auth.currentUser) return
        await updateEmail(auth.currentUser, email)
        setUser({ ...auth.currentUser })
      },
    }),
    [user, loading, isAdminClaim],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
