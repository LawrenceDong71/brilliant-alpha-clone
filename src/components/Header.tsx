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
          <Link to="/profile" className="header-name" title="Edit your profile">
            {profile.displayName}
          </Link>
        )}
        <button type="button" className="link-btn" onClick={() => void logOut()}>
          Log out
        </button>
      </div>
    </header>
  )
}
