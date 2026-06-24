import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { lessonById } from '../content/lessons'
import { useProgress } from '../progress/ProgressContext'
import { StepRenderer } from '../components/steps/StepRenderer'
import { POINTS_BASE, POINTS_PENALTY, questionWorth, lessonPoints } from '../progress/scoring'
import { useIsAdmin } from '../auth/admin'

type GradeResult = { attempts: number; solved: boolean }

export function LessonPage() {
  const { lessonId = '' } = useParams()
  const navigate = useNavigate()
  const lesson = lessonById(lessonId)
  const { progress, loading, saveStep, savePosition, completeLesson } = useProgress()
  const admin = useIsAdmin()

  const [stepIndex, setStepIndex] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [solved, setSolved] = useState(false)
  const [gradeResults, setGradeResults] = useState<Record<string, GradeResult>>({})
  const initialized = useRef(false)
  const checkerRef = useRef<() => boolean>(() => false)
  const setChecker = useCallback((fn: () => boolean) => {
    checkerRef.current = fn
  }, [])

  useEffect(() => {
    if (loading || !lesson || initialized.current) return
    const p = progress[lesson.id]
    const start =
      p && p.status !== 'completed'
        ? Math.min(p.currentStepIndex, lesson.steps.length - 1)
        : 0
    setStepIndex(start)
    setGradeResults(p && p.status !== 'completed' ? p.steps : {})
    initialized.current = true
  }, [loading, lesson, progress])

  if (!lesson) {
    return (
      <div className="center-screen">
        <p>Lesson not found.</p>
        <button className="btn" onClick={() => navigate('/')}>Back to path</button>
      </div>
    )
  }

  const step = lesson.steps[stepIndex]
  const isConcept = step.type === 'concept'
  const revealed = attempts >= 2

  const gradableCount = lesson.steps.filter((s) => s.type !== 'concept').length
  const maxScore = gradableCount * POINTS_BASE
  const score = lessonPoints(lesson, gradeResults)
  const currentWorth = questionWorth(attempts)

  const resetStepState = () => {
    setAttempts(0)
    setSolved(false)
  }

  const finish = async () => {
    await completeLesson(lesson.id)
    navigate(`/done/${lesson.id}`)
  }

  const advance = () => {
    const next = stepIndex + 1
    if (next >= lesson.steps.length) {
      void finish()
      return
    }
    void savePosition(lesson.id, next)
    setStepIndex(next)
    resetStepState()
  }

  const goBack = () => {
    if (stepIndex === 0) return
    setStepIndex(stepIndex - 1)
    resetStepState()
  }

  const check = () => {
    if (checkerRef.current()) {
      setSolved(true)
      setGradeResults((prev) => ({ ...prev, [step.id]: { attempts, solved: true } }))
      void saveStep({
        lessonId: lesson.id,
        stepId: step.id,
        attempts,
        solved: true,
        firstTry: attempts === 0,
        currentStepIndex: stepIndex,
      })
    } else {
      const next = attempts + 1
      setAttempts(next)
      setGradeResults((prev) => ({ ...prev, [step.id]: { attempts: next, solved: false } }))
    }
  }

  const skip = () => {
    setGradeResults((prev) => ({ ...prev, [step.id]: { attempts, solved: false } }))
    void saveStep({
      lessonId: lesson.id,
      stepId: step.id,
      attempts,
      solved: false,
      firstTry: false,
      currentStepIndex: stepIndex,
    })
    advance()
  }

  const hint =
    attempts > 0 && step.feedback.hints.length > 0
      ? step.feedback.hints[Math.min(attempts - 1, step.feedback.hints.length - 1)]
      : ''

  return (
    <div className="lesson">
      <div className="lesson-top">
        <button className="link-btn" onClick={() => navigate('/')}>← Path</button>
        <div className="progress-bar" aria-label="Lesson progress">
          {lesson.steps.map((s, i) => (
            <span
              key={s.id}
              className={`progress-seg${i < stepIndex || (i === stepIndex && solved) ? ' filled' : ''}`}
            />
          ))}
        </div>
        <span className="step-count">{stepIndex + 1}/{lesson.steps.length}</span>
      </div>

      <div className="score-bar" aria-label="Lesson score">
        <span className="score-chip">
          <span className="score-star">★</span>
          <span className="score-num">{score}</span>
          <span className="score-max">/ {maxScore} pts</span>
        </span>
        {!isConcept && !solved && attempts > 0 && (
          <span className="score-penalty">−{POINTS_PENALTY} per wrong answer</span>
        )}
        {admin && <span className="score-chip">Admin</span>}
      </div>

      <div className="lesson-body">
        <h2 className="step-prompt">{step.prompt}</h2>

        <StepRenderer key={step.id} step={step} setChecker={setChecker} locked={solved} />

        {solved && (
          <div className="feedback correct">
            <strong>Correct! +{currentWorth} pts.</strong> {step.feedback.correct}
          </div>
        )}
        {!isConcept && !solved && attempts > 0 && (
          <div className="feedback incorrect">
            <strong>Incorrect — −{POINTS_PENALTY} pts.</strong>{' '}
            {currentWorth > 0
              ? `This question is now worth ${currentWorth} pts. Try again.`
              : 'Try again.'}
          </div>
        )}
        {!solved && hint && (
          <div className="feedback hint">
            <strong>Hint:</strong> {hint}
          </div>
        )}
        {!solved && revealed && (
          <div className="feedback explain">
            <strong>Explanation:</strong> {step.feedback.explanation}
          </div>
        )}
      </div>

      <div className="lesson-footer">
        <div className="footer-row">
          {stepIndex > 0 && (
            <button className="btn ghost back-btn" onClick={goBack}>← Back</button>
          )}
          {isConcept || solved || admin ? (
            <button className="btn primary grow" onClick={advance}>Continue</button>
          ) : (
            <button className="btn primary grow" onClick={check}>Check</button>
          )}
        </div>
        {!isConcept && !solved && revealed && (
          <button className="btn ghost full" onClick={skip}>Skip for now</button>
        )}
      </div>
    </div>
  )
}
