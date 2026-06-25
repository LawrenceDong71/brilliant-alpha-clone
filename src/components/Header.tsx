import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useProgress } from '../progress/ProgressContext'

export function Header() {
  const { logOut } = useAuth()
  const { profile } = useProgress()

  return (
    <header className="app-header">
      <Link to="/" className="brand">
        <span className="brand-mark">△</span>
        <span className="brand-name">GeoSpark</span>
      </Link>
      <div className="header-right">
        <span className="streak-pill" title="Daily streak">
          🔥 {profile?.streak.current ?? 0}
        </span>
        {profile && (
          <Link to="/profile" className="profile-chip" title="Profile & settings">
            <span className="profile-chip-avatar">
              {(profile.displayName || '?').charAt(0).toUpperCase()}
            </span>
            <span className="profile-chip-name">{profile.displayName}</span>
            <span className="profile-chip-caret" aria-hidden="true">⌄</span>
          </Link>
        )}
        <button type="button" className="link-btn" onClick={() => void logOut()}>
          Log out
        </button>
      </div>
    </header>
  )
}
