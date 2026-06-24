import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

function friendlyError(code: string): string {
  if (code.includes('invalid-credential') || code.includes('wrong-password'))
    return 'Incorrect email or password.'
  if (code.includes('email-already-in-use')) return 'That email is already registered. Try logging in.'
  if (code.includes('weak-password')) return 'Password should be at least 6 characters.'
  if (code.includes('invalid-email')) return 'Please enter a valid email address.'
  if (code.includes('popup-closed')) return 'Google sign-in was cancelled.'
  return 'Something went wrong. Please try again.'
}

export function LoginPage() {
  const { user, signUp, logIn, logInWithGoogle } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'signup') await signUp(name.trim() || 'Learner', email, password)
      else await logIn(email, password)
    } catch (err) {
      setError(friendlyError((err as { code?: string }).code ?? ''))
    } finally {
      setBusy(false)
    }
  }

  const google = async () => {
    setError('')
    setBusy(true)
    try {
      await logInWithGoogle()
    } catch (err) {
      setError(friendlyError((err as { code?: string }).code ?? ''))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark big">△</span>
          <h1>GeoSpark</h1>
          <p className="auth-tag">Learn geometry by doing, not watching.</p>
        </div>

        <div className="auth-tabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Log in
          </button>
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
            Sign up
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && (
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" />
            </label>
          )}
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="••••••••" />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn primary full" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <button type="button" className="btn google full" onClick={() => void google()} disabled={busy}>
          Continue with Google
        </button>
      </div>
    </div>
  )
}
