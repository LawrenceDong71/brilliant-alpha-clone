import { useNavigate } from 'react-router-dom'
import { useIsAdmin } from '../auth/admin'
import { LESSONS } from '../content/lessons'
import { useProgress } from '../progress/ProgressContext'
import { hasPassed, lessonMaxPoints, PASS_RATIO, lessonPoints } from '../progress/scoring'

export function HomePage() {
  const navigate = useNavigate()
  const { profile, progress, loading, error, isUnlocked, recommendedLessonId } = useProgress()
  const admin = useIsAdmin()

  if (loading) {
    return (
      <div className="center-screen">
        <div className="spinner" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="center-screen">
        <div className="error-card">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button className="btn primary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    )
  }

  const completedCount = LESSONS.filter((l) => progress[l.id]?.status === 'completed').length

  return (
    <div className="home">
      <section className="hero-card">
        <div>
          <h1>Hi {profile?.displayName ?? 'there'} 👋</h1>
          <p className="muted">Geometry, one hands-on lesson at a time.</p>
        </div>
        <div className="stat-row">
          <div className="stat">
            <span className="stat-num">🔥 {profile?.streak.current ?? 0}</span>
            <span className="stat-label">day streak</span>
          </div>
          <div className="stat">
            <span className="stat-num">{completedCount}/{LESSONS.length}</span>
            <span className="stat-label">lessons done</span>
          </div>
          <div className="stat">
            <span className="stat-num">🏆 {profile?.streak.longest ?? 0}</span>
            <span className="stat-label">best streak</span>
          </div>
        </div>
      </section>

      <div className="path-title-row">
        <h2 className="path-title">Your geometry path</h2>
        {admin && (
          <span
            className="admin-badge"
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              background: 'rgba(124, 92, 255, 0.15)',
              color: '#7c5cff',
              letterSpacing: '0.02em',
            }}
          >
            Admin mode
          </span>
        )}
      </div>
      <ol className="path">
        {LESSONS.map((lesson) => {
          const p = progress[lesson.id]
          const done = p?.status === 'completed'
          const unlocked = isUnlocked(lesson)
          const recommended = lesson.id === recommendedLessonId
          const inProgress = !done && unlocked && p && p.currentStepIndex > 0
          const points = lessonPoints(lesson, p?.steps ?? {})
          const maxPoints = lessonMaxPoints(lesson)
          const passed = done && hasPassed(points, maxPoints)
          return (
            <li
              key={lesson.id}
              className={`path-node${unlocked ? '' : ' locked'}${done ? ' done' : ''}${done && !passed ? ' failed' : ''}${recommended ? ' recommended' : ''}`}
            >
              <button
                type="button"
                className="path-card"
                disabled={!unlocked}
                onClick={() => navigate(`/lesson/${lesson.id}`)}
              >
                <span className="node-badge">{done ? (passed ? '✓' : '↻') : unlocked ? lesson.order : '🔒'}</span>
                <span className="node-text">
                  <span className="node-title">{lesson.title}</span>
                  <span className="node-summary">{lesson.summary}</span>
                  <span className="node-meta">
                    {done
                      ? passed
                        ? `Completed · ${points}/${maxPoints} pts`
                        : `${points}/${maxPoints} pts · replay to unlock next`
                      : recommended
                        ? 'Recommended next'
                        : inProgress
                          ? 'In progress'
                          : unlocked
                            ? `${lesson.estimatedMinutes} min`
                            : `Locked · score ${Math.round(PASS_RATIO * 100)}%+ on the previous lesson`}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
