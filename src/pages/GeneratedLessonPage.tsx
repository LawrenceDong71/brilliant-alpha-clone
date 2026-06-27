import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { generateLesson } from '../ai/generateLesson'
import { topicById } from '../ai/curriculum/topics'
import { StepPlayer } from '../components/steps/StepPlayer'
import type { Lesson } from '../content/types'

type Phase = 'loading' | 'ready' | 'failed'

export function GeneratedLessonPage() {
  const { topicId = '' } = useParams()
  const navigate = useNavigate()
  const topic = topicById(topicId)

  const [phase, setPhase] = useState<Phase>('loading')
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [solved, setSolved] = useState(false)

  useEffect(() => {
    if (!topic) return
    let cancelled = false
    generateLesson(topic)
      .then((l) => {
        if (cancelled) return
        if (l) {
          setLesson(l)
          setStepIndex(0)
          setSolved(false)
          setPhase('ready')
        } else {
          setPhase('failed')
        }
      })
      .catch(() => {
        if (!cancelled) setPhase('failed')
      })
    return () => {
      cancelled = true
    }
  }, [topic])

  if (!topic) {
    return (
      <div className="center-screen">
        <p>Topic not found.</p>
        <button className="btn" onClick={() => navigate('/')}>
          Back to path
        </button>
      </div>
    )
  }

  if (phase === 'loading') {
    return (
      <div className="center-screen">
        <div className="spinner" />
        <p className="design-sub">Generating &amp; verifying your “{topic.title}” lesson…</p>
      </div>
    )
  }

  if (phase === 'failed' || !lesson) {
    return (
      <div className="center-screen">
        <div className="error-card">
          <h2>Couldn’t build that lesson</h2>
          <p>We couldn’t generate a verified lesson right now. Please try again.</p>
          <button className="btn primary" onClick={() => navigate('/')}>
            Back to path
          </button>
        </div>
      </div>
    )
  }

  const step = lesson.steps[stepIndex]
  const isConcept = step.type === 'concept'
  const canContinue = isConcept || solved
  const isLast = stepIndex === lesson.steps.length - 1

  const advance = () => {
    if (isLast) {
      navigate('/')
      return
    }
    setStepIndex((i) => i + 1)
    setSolved(false)
  }

  return (
    <div className="lesson">
      <div className="lesson-top">
        <button className="link-btn" onClick={() => navigate('/')}>
          ← Path
        </button>
        <div className="progress-bar" aria-label="Lesson progress">
          {lesson.steps.map((s, i) => (
            <span
              key={s.id}
              className={`progress-seg${i < stepIndex || (i === stepIndex && (isConcept || solved)) ? ' filled' : ''}`}
            />
          ))}
        </div>
        <span className="step-count">
          {stepIndex + 1}/{lesson.steps.length}
        </span>
      </div>

      <StepPlayer key={step.id} step={step} onSolved={() => setSolved(true)} />

      <div className="lesson-footer">
        <div className="footer-row">
          <button className="btn primary grow" disabled={!canContinue} onClick={advance}>
            {isLast ? 'Finish' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
