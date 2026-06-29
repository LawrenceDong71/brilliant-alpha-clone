import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { isAdmin } from '../auth/admin'
import { useAuth } from '../auth/AuthContext'
import { LESSONS, lessonById } from '../content/lessons'
import { conceptForStep, LESSON_CONCEPT } from '../content/concepts'
import type { ConceptId, Lesson } from '../content/types'
import {
  advanceStreak,
  ensureUserProfile,
  fetchAllProgress,
  fetchConceptMastery,
  saveConceptMastery,
  saveLessonProgress,
  saveStreak,
  updateUserProfile,
} from './api'
import type { ConceptMasteryMap, LessonProgress, ProgressMap, UserProfile } from './types'
import { lessonPoints } from './scoring'
import {
  allMastered,
  dueConcepts,
  emptyConceptMastery,
  MASTERY_THRESHOLD,
  recordEncounter,
  recordSkip,
} from './review'

/** Unique concepts covered by a lesson's gradable steps (v1: one per lesson). */
function conceptsForLesson(lesson: Lesson): ConceptId[] {
  const set = new Set<ConceptId>()
  for (const step of lesson.steps) {
    if (step.type === 'concept') continue
    const c = conceptForStep(lesson.id, step)
    if (c) set.add(c)
  }
  if (set.size === 0 && LESSON_CONCEPT[lesson.id]) set.add(LESSON_CONCEPT[lesson.id])
  return [...set]
}

interface SaveStepArgs {
  lessonId: string
  stepId: string
  attempts: number
  solved: boolean
  firstTry: boolean
  currentStepIndex: number
}

interface ProgressContextValue {
  profile: UserProfile | null
  progress: ProgressMap
  loading: boolean
  error: string | null
  saveStep: (args: SaveStepArgs) => Promise<void>
  savePosition: (lessonId: string, index: number) => Promise<void>
  completeLesson: (lessonId: string) => Promise<void>
  /** Update editable profile fields locally and in Firestore. */
  patchProfile: (fields: Partial<Pick<UserProfile, 'displayName' | 'email'>>) => Promise<void>
  isUnlocked: (lesson: Lesson) => boolean
  recommendedLessonId: string | null
  /** Phase 3: per-concept mastery + spaced-repetition state. */
  conceptMastery: ConceptMasteryMap
  /** Phase 3: record a Daily Review answer for a concept (affects mastery + spacing). */
  recordReview: (concept: ConceptId, outcome: { firstTry: boolean; correct: boolean }) => Promise<void>
  /** Phase 3: true when every concept in the lesson is mastered (falls back to lesson masteryScore). */
  lessonMastered: (lesson: Lesson) => boolean
  /** Phase 3: concept ids currently due for spaced review (interleaved across lessons). */
  dueConceptIds: ConceptId[]
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

function emptyLessonProgress(): LessonProgress {
  return {
    status: 'inProgress',
    currentStepIndex: 0,
    steps: {},
    masteryScore: 0,
    points: 0,
    updatedAt: Date.now(),
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [progress, setProgress] = useState<ProgressMap>({})
  const [conceptMastery, setConceptMastery] = useState<ConceptMasteryMap>({})
  const [loadedUid, setLoadedUid] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    ;(async () => {
      try {
        const load = Promise.all([
          ensureUserProfile(user, user.displayName ?? undefined),
          fetchAllProgress(user.uid),
          fetchConceptMastery(user.uid),
        ])
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore request timed out')), 12_000),
        )
        const [prof, prog, concepts] = await Promise.race([load, timeout])
        if (!active) return
        setProfile(prof)
        setProgress(prog)
        setConceptMastery(concepts)
      } catch (e) {
        if (!active) return
        console.error('Failed to load progress from Firestore:', e)
        setError(
          'Could not reach the database. This is usually caused by an ad blocker, VPN, or browser shield (e.g. Brave) blocking Google/Firebase requests — try disabling those for this site or use a plain Chrome window. Also confirm Cloud Firestore is created and its rules are published. Then refresh.',
        )
      } finally {
        if (active) setLoadedUid(user.uid)
      }
    })()
    return () => {
      active = false
    }
  }, [user])

  const loading = user ? loadedUid !== user.uid : false

  const saveStep = useCallback(
    async (args: SaveStepArgs) => {
      if (!user) return
      const lesson = lessonById(args.lessonId)
      const existing = progress[args.lessonId] ?? emptyLessonProgress()
      const updated: LessonProgress = {
        ...existing,
        status: existing.status === 'completed' ? 'completed' : 'inProgress',
        currentStepIndex: Math.max(existing.currentStepIndex, args.currentStepIndex),
        steps: {
          ...existing.steps,
          [args.stepId]: {
            attempts: args.attempts,
            solved: args.solved,
            firstTry: args.firstTry,
          },
        },
        updatedAt: Date.now(),
      }
      updated.points = lesson ? lessonPoints(lesson, updated.steps) : 0
      setProgress((prev) => ({ ...prev, [args.lessonId]: updated }))
      await saveLessonProgress(user.uid, args.lessonId, updated)

      // Phase 3: record a per-concept encounter (mastery + spaced repetition).
      const step = lesson?.steps.find((s) => s.id === args.stepId)
      const concept = lesson && step ? conceptForStep(args.lessonId, step) : undefined
      if (concept) {
        setConceptMastery((prev) => {
          const cur = prev[concept] ?? emptyConceptMastery(concept)
          const next = args.solved
            ? recordEncounter(cur, { firstTry: args.firstTry, correct: true })
            : recordSkip(cur)
          void saveConceptMastery(user.uid, next)
          return { ...prev, [concept]: next }
        })
      }

      // Solving something keeps the daily streak alive.
      if (args.solved && profile) {
        const nextStreak = advanceStreak(profile.streak)
        if (nextStreak !== profile.streak) {
          setProfile({ ...profile, streak: nextStreak })
          await saveStreak(user.uid, nextStreak)
        }
      }
    },
    [user, progress, profile],
  )

  const savePosition = useCallback(
    async (lessonId: string, index: number) => {
      if (!user) return
      const existing = progress[lessonId] ?? emptyLessonProgress()
      if (existing.status === 'completed') return
      const updated: LessonProgress = {
        ...existing,
        currentStepIndex: Math.max(existing.currentStepIndex, index),
        updatedAt: Date.now(),
      }
      setProgress((prev) => ({ ...prev, [lessonId]: updated }))
      await saveLessonProgress(user.uid, lessonId, updated)
    },
    [user, progress],
  )

  const completeLesson = useCallback(
    async (lessonId: string) => {
      if (!user) return
      const lesson = lessonById(lessonId)
      const existing = progress[lessonId] ?? emptyLessonProgress()
      const entries = Object.values(existing.steps)
      const graded = entries.length
      const firstTryCount = entries.filter((s) => s.firstTry).length
      const masteryScore = graded === 0 ? 1 : firstTryCount / graded
      const updated: LessonProgress = {
        ...existing,
        status: 'completed',
        currentStepIndex: lesson ? lesson.steps.length : existing.currentStepIndex,
        masteryScore,
        points: lesson ? lessonPoints(lesson, existing.steps) : 0,
        completedAt: Date.now(),
        updatedAt: Date.now(),
      }
      setProgress((prev) => ({ ...prev, [lessonId]: updated }))
      await saveLessonProgress(user.uid, lessonId, updated)
    },
    [user, progress],
  )

  const patchProfile = useCallback(
    async (fields: Partial<Pick<UserProfile, 'displayName' | 'email'>>) => {
      if (!user || !profile) return
      setProfile({ ...profile, ...fields })
      await updateUserProfile(user.uid, fields)
    },
    [user, profile],
  )

  const recordReview = useCallback(
    async (concept: ConceptId, outcome: { firstTry: boolean; correct: boolean }) => {
      if (!user) return
      setConceptMastery((prev) => {
        const cur = prev[concept] ?? emptyConceptMastery(concept)
        const next = recordEncounter(cur, outcome)
        void saveConceptMastery(user.uid, next)
        return { ...prev, [concept]: next }
      })
      // Reviewing also keeps the daily streak alive.
      if (profile) {
        const nextStreak = advanceStreak(profile.streak)
        if (nextStreak !== profile.streak) {
          setProfile({ ...profile, streak: nextStreak })
          await saveStreak(user.uid, nextStreak)
        }
      }
    },
    [user, profile],
  )

  // Phase 3 (FR-M1): a lesson is "mastered" when all its concepts are mastered.
  // Falls back to the stored lesson masteryScore for lessons with no per-concept
  // records yet (so existing/legacy progress still counts).
  const lessonMastered = useCallback(
    (lesson: Lesson) => {
      const concepts = conceptsForLesson(lesson)
      const haveRecords = concepts.some((c) => conceptMastery[c])
      if (haveRecords) return allMastered(conceptMastery, concepts)
      const pr = progress[lesson.id]
      return pr?.status === 'completed' && pr.masteryScore >= MASTERY_THRESHOLD
    },
    [conceptMastery, progress],
  )

  // Phase 3 (FR-M3): unlocking requires the PREVIOUS lesson mastered.
  const isUnlocked = useCallback(
    (lesson: Lesson) => {
      if (isAdmin(user?.email)) return true
      if (lesson.order === 1) return true
      const prev = LESSONS.find((l) => l.order === lesson.order - 1)
      if (!prev) return true
      return lessonMastered(prev)
    },
    [lessonMastered, user?.email],
  )

  const dueConceptIds = useMemo(() => dueConcepts(conceptMastery), [conceptMastery])

  const recommendedLessonId = useMemo(() => {
    const sorted = [...LESSONS].sort((a, b) => a.order - b.order)
    const next = sorted.find((l) => !lessonMastered(l) && isUnlocked(l))
    return next ? next.id : null
  }, [lessonMastered, isUnlocked])

  const value = useMemo<ProgressContextValue>(
    () => ({
      profile: user ? profile : null,
      progress: user ? progress : {},
      loading,
      error,
      saveStep,
      savePosition,
      completeLesson,
      patchProfile,
      isUnlocked,
      recommendedLessonId,
      conceptMastery: user ? conceptMastery : {},
      recordReview,
      lessonMastered,
      dueConceptIds,
    }),
    [user, profile, progress, conceptMastery, loading, error, saveStep, savePosition, completeLesson, patchProfile, isUnlocked, recommendedLessonId, recordReview, lessonMastered, dueConceptIds],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}
