import { useNavigate, useParams } from 'react-router-dom'
import { useIsAdmin } from '../auth/admin'
import { lessonById, nextLesson } from '../content/lessons'
import { useProgress } from '../progress/ProgressContext'
import { hasPassed, lessonMaxPoints, passThreshold, lessonPoints } from '../progress/scoring'

export function DonePage() {
  const { lessonId = '' } = useParams()
  const navigate = useNavigate()
  const { progress, profile } = useProgress()
  const admin = useIsAdmin()
  const lesson = lessonById(lessonId)
  const next = nextLesson(lessonId)
  const lessonProgress = progress[lessonId]
  const mastery = Math.round((lessonProgress?.masteryScore ?? 0) * 100)
  const maxPoints = lesson ? lessonMaxPoints(lesson) : 0
  const points = lesson ? lessonPoints(lesson, lessonProgress?.steps ?? {}) : 0
  const threshold = passThreshold(maxPoints)
  const passed = hasPassed(points, maxPoints)
  const nextLocked = !!next && !passed && !admin

  return (
    <div className="done">
      <div className="done-card">
        <div className="done-emoji">{nextLocked ? '📈' : '🎉'}</div>
        <h1>{nextLocked ? 'So close!' : 'Lesson complete!'}</h1>
        <p className="muted">{lesson?.title}</p>

        <div className="done-stats">
          <div className="stat">
            <span className="stat-num">{points}<span className="stat-denom">/{maxPoints}</span></span>
            <span className="stat-label">points earned</span>
          </div>
          <div className="stat">
            <span className="stat-num">{mastery}%</span>
            <span className="stat-label">first-try mastery</span>
          </div>
          <div className="stat">
            <span className="stat-num">🔥 {profile?.streak.current ?? 0}</span>
            <span className="stat-label">day streak</span>
          </div>
        </div>

        {next && nextLocked ? (
          <>
            <div className="gate-notice">
              You need <strong>{threshold}</strong> of {maxPoints} points to unlock{' '}
              <strong>{next.title}</strong>. You earned <strong>{points}</strong> — replay the lesson to raise your score.
            </div>
            <button className="btn primary full" onClick={() => navigate(`/lesson/${lessonId}`)}>
              Retry lesson
            </button>
            <button className="btn ghost full" onClick={() => navigate('/')}>Back to path</button>
          </>
        ) : next ? (
          <>
            <p className="next-hint">You passed! Up next on your path:</p>
            <div className="next-card">
              <span className="next-title">{next.title}</span>
              <span className="next-summary">{next.summary}</span>
            </div>
            <button className="btn primary full" onClick={() => navigate(`/lesson/${next.id}`)}>
              Start next lesson
            </button>
            <button className="btn ghost full" onClick={() => navigate('/')}>Back to path</button>
          </>
        ) : (
          <>
            <p className="next-hint">You finished the whole geometry path. Incredible work!</p>
            <button className="btn primary full" onClick={() => navigate('/')}>Back to path</button>
          </>
        )}
      </div>
    </div>
  )
}
