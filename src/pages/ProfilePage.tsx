import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useProgress } from '../progress/ProgressContext'

function friendlyError(code: string): string {
  if (code.includes('requires-recent-login'))
    return 'For your security, please log out and back in, then try again.'
  if (code.includes('email-already-in-use')) return 'That email is already in use by another account.'
  if (code.includes('invalid-email')) return 'Please enter a valid email address.'
  if (code.includes('operation-not-allowed'))
    return 'Email changes need to be verified first. Check your inbox, or log out and back in and retry.'
  return 'Something went wrong. Please try again.'
}

const emailLooksValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

type Status = { kind: 'idle' | 'saved' | 'error'; message?: string }

export function ProfilePage() {
  const navigate = useNavigate()
  const { updateName, changeEmail } = useAuth()
  const { profile, loading, patchProfile } = useProgress()

  const [name, setName] = useState(profile?.displayName ?? '')
  const [email, setEmail] = useState(profile?.email ?? '')
  const [nameBusy, setNameBusy] = useState(false)
  const [emailBusy, setEmailBusy] = useState(false)
  const [nameStatus, setNameStatus] = useState<Status>({ kind: 'idle' })
  const [emailStatus, setEmailStatus] = useState<Status>({ kind: 'idle' })

  if (loading || !profile) {
    return (
      <div className="center-screen">
        <div className="spinner" />
      </div>
    )
  }

  const trimmedName = name.trim()
  const trimmedEmail = email.trim()
  const nameChanged = trimmedName !== profile.displayName
  const emailChanged = trimmedEmail !== profile.email

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trimmedName) {
      setNameStatus({ kind: 'error', message: 'Name cannot be empty.' })
      return
    }
    setNameBusy(true)
    setNameStatus({ kind: 'idle' })
    try {
      await updateName(trimmedName)
      await patchProfile({ displayName: trimmedName })
      setNameStatus({ kind: 'saved', message: 'Name updated.' })
    } catch (err) {
      setNameStatus({ kind: 'error', message: friendlyError((err as { code?: string }).code ?? '') })
    } finally {
      setNameBusy(false)
    }
  }

  const saveEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailLooksValid(trimmedEmail)) {
      setEmailStatus({ kind: 'error', message: 'Please enter a valid email address.' })
      return
    }
    setEmailBusy(true)
    setEmailStatus({ kind: 'idle' })
    try {
      await changeEmail(trimmedEmail)
      await patchProfile({ email: trimmedEmail })
      setEmailStatus({ kind: 'saved', message: 'Email updated.' })
    } catch (err) {
      setEmailStatus({ kind: 'error', message: friendlyError((err as { code?: string }).code ?? '') })
    } finally {
      setEmailBusy(false)
    }
  }

  return (
    <div className="profile">
      <button type="button" className="link-btn profile-back" onClick={() => navigate('/')}>
        ← Back
      </button>

      <header className="profile-head">
        <div className="profile-avatar">{(profile.displayName || '?').charAt(0).toUpperCase()}</div>
        <div>
          <h1 className="profile-title">Your profile</h1>
          <p className="muted">Update your name and email.</p>
        </div>
      </header>

      <form className="profile-card" onSubmit={saveName}>
        <label className="profile-field">
          Name
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setNameStatus({ kind: 'idle' })
            }}
            placeholder="Your name"
            autoComplete="name"
          />
        </label>
        {nameStatus.kind === 'error' && <p className="profile-msg error">{nameStatus.message}</p>}
        {nameStatus.kind === 'saved' && <p className="profile-msg ok">{nameStatus.message}</p>}
        <button type="submit" className="btn primary full" disabled={nameBusy || !nameChanged}>
          {nameBusy ? 'Saving…' : 'Save name'}
        </button>
      </form>

      <form className="profile-card" onSubmit={saveEmail}>
        <label className="profile-field">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setEmailStatus({ kind: 'idle' })
            }}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>
        {emailStatus.kind === 'error' && <p className="profile-msg error">{emailStatus.message}</p>}
        {emailStatus.kind === 'saved' && <p className="profile-msg ok">{emailStatus.message}</p>}
        <button type="submit" className="btn primary full" disabled={emailBusy || !emailChanged}>
          {emailBusy ? 'Saving…' : 'Save email'}
        </button>
      </form>
    </div>
  )
}
