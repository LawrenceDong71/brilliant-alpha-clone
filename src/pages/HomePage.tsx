import { useEffect, useRef, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsAdmin } from '../auth/admin'
import { LESSONS } from '../content/lessons'
import { useProgress } from '../progress/ProgressContext'
import { hasPassed, lessonMaxPoints, PASS_RATIO, lessonPoints } from '../progress/scoring'

/** Maps each lesson to a geometry glyph drawn inside its node. */
const KIND_BY_ID: Record<string, string> = {
  'points-lines': 'point',
  angles: 'angle',
  triangles: 'triangle',
  pythagorean: 'right-triangle',
  'area-perimeter': 'square',
  transformations: 'mirror',
}

/** A small line-art glyph of the lesson's topic, shaping each node. */
function TopicGlyph({ kind }: { kind: string }) {
  switch (kind) {
    case 'point':
      return (
        <svg className="node-glyph" viewBox="0 0 40 40" aria-hidden="true">
          <line className="faint" x1="20" y1="5" x2="20" y2="35" />
          <line className="faint" x1="5" y1="20" x2="35" y2="20" />
          <circle className="fill" cx="20" cy="20" r="4.4" />
        </svg>
      )
    case 'angle':
      return (
        <svg className="node-glyph" viewBox="0 0 40 40" aria-hidden="true">
          <path d="M9 30 L35 30" />
          <path d="M9 30 L31 9" />
          <path d="M21 30 A 12 12 0 0 0 17.1 21.6" />
        </svg>
      )
    case 'triangle':
      return (
        <svg className="node-glyph" viewBox="0 0 40 40" aria-hidden="true">
          <path d="M20 6 L6 33 L34 33 Z" />
        </svg>
      )
    case 'right-triangle':
      return (
        <svg className="node-glyph" viewBox="0 0 40 40" aria-hidden="true">
          <path d="M9 8 L9 32 L33 32 Z" />
          <path d="M15 32 L15 26 L9 26" />
        </svg>
      )
    case 'square':
      return (
        <svg className="node-glyph" viewBox="0 0 40 40" aria-hidden="true">
          <path d="M8 8 L32 8 L32 32 L8 32 Z" />
          <line className="faint" x1="20" y1="8" x2="20" y2="32" />
          <line className="faint" x1="8" y1="20" x2="32" y2="20" />
        </svg>
      )
    case 'mirror':
      return (
        <svg className="node-glyph" viewBox="0 0 40 40" aria-hidden="true">
          <line className="faint" x1="20" y1="5" x2="20" y2="35" />
          <path d="M15 11 L15 29 L8 20 Z" />
          <path d="M25 11 L25 29 L32 20 Z" />
        </svg>
      )
    default:
      return (
        <svg className="node-glyph" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="12" />
        </svg>
      )
  }
}

/** Blueprint-style geometric line art for the hero corner. */
function HeroDecor() {
  return (
    <svg className="hero-decor" width="250" height="180" viewBox="0 0 250 180" fill="none" aria-hidden="true">
      <g stroke="#fff">
        <circle cx="196" cy="40" r="44" strokeWidth="2" opacity="0.16" />
        <path d="M168 150 L168 92 L226 150 Z" strokeWidth="2" strokeLinejoin="round" opacity="0.22" />
        <path d="M174 150 L174 144 L168 144" strokeWidth="1.6" opacity="0.35" />
        <line x1="120" y1="150" x2="240" y2="150" strokeWidth="1.4" strokeDasharray="3 7" opacity="0.3" />
        <line x1="168" y1="22" x2="168" y2="150" strokeWidth="1.4" strokeDasharray="3 7" opacity="0.18" />
        <circle cx="168" cy="92" r="2.6" fill="#fff" stroke="none" opacity="0.5" />
        <circle cx="226" cy="150" r="2.6" fill="#fff" stroke="none" opacity="0.5" />
      </g>
    </svg>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const { profile, progress, loading, error, isUnlocked, recommendedLessonId } = useProgress()
  const admin = useIsAdmin()

  // Decorative only: nudge the backdrop shapes toward the cursor (parallax) and
  // brighten them while the pointer is moving. Drives CSS vars on the backdrop.
  const bgRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let idle: ReturnType<typeof setTimeout> | undefined
    const onMove = (e: PointerEvent) => {
      const el = bgRef.current
      if (!el) return
      el.classList.add('is-active')
      if (idle) clearTimeout(idle)
      idle = setTimeout(() => el.classList.remove('is-active'), 700)
      if (reduce) return
      const nx = (e.clientX / window.innerWidth - 0.5) * 2
      const ny = (e.clientY / window.innerHeight - 0.5) * 2
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mx', nx.toFixed(3))
        el.style.setProperty('--my', ny.toFixed(3))
      })
    }
    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (raf) cancelAnimationFrame(raf)
      if (idle) clearTimeout(idle)
    }
  }, [])

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
  const completionPct = Math.round((completedCount / LESSONS.length) * 100)

  return (
    <div className="home">
      <div className="home-bg" aria-hidden="true" ref={bgRef}>
        <svg className="bg-shape bg-1" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" />
          <circle className="dot" cx="50" cy="50" r="2.5" />
        </svg>
        <svg className="bg-shape bg-2" viewBox="0 0 100 100">
          <path d="M50 6 L92 92 L8 92 Z" />
        </svg>
        <svg className="bg-shape bg-3" viewBox="0 0 100 100">
          <rect x="8" y="8" width="84" height="84" rx="6" />
        </svg>
        <svg className="bg-shape bg-4" viewBox="0 0 100 60">
          <path d="M4 54 A 46 46 0 0 1 96 54" />
          <line x1="4" y1="54" x2="96" y2="54" />
        </svg>
      </div>

      <section className="hero-card">
        <HeroDecor />
        <div className="hero-head">
          <div>
            <h1>Hi {profile?.displayName ?? 'there'} 👋</h1>
            <p className="hero-sub">Geometry, one hands-on lesson at a time.</p>
          </div>
          <div
            className="hero-ring"
            style={{ '--pct': completionPct } as CSSProperties}
            aria-label={`${completionPct}% of lessons complete`}
          >
            <span className="hero-ring-num">{completionPct}%</span>
          </div>
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
        {admin && <span className="admin-badge">Admin mode</span>}
      </div>

      <ol className="path">
        {LESSONS.map((lesson, i) => {
          const p = progress[lesson.id]
          const done = p?.status === 'completed'
          const unlocked = isUnlocked(lesson)
          const recommended = lesson.id === recommendedLessonId
          const inProgress = !done && unlocked && p && p.currentStepIndex > 0
          const points = lessonPoints(lesson, p?.steps ?? {})
          const maxPoints = lessonMaxPoints(lesson)
          const passed = done && hasPassed(points, maxPoints)
          const kind = KIND_BY_ID[lesson.id] ?? 'point'
          const pip = done ? (passed ? '✓' : '↻') : unlocked ? null : '🔒'
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
                <span className="node-rail">
                  <span className="node-badge">
                    <TopicGlyph kind={kind} />
                    {pip && <span className="node-pip">{pip}</span>}
                  </span>
                </span>
                <span className="node-label">
                  <span className="node-step">Lesson {i + 1}</span>
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
                            : `Locked · score ${Math.round(PASS_RATIO * 100)}%+`}
                  </span>
                </span>
                {unlocked && <span className="node-go" aria-hidden="true">→</span>}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
