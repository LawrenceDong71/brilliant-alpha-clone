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
import type { Lesson } from '../content/types'
import {
  advanceStreak,
  ensureUserProfile,
  fetchAllProgress,
  saveLessonProgress,
  saveStreak,
  updateUserProfile,
} from './api'
import type { LessonProgress, ProgressMap, UserProfile } from './types'
import { hasPassed, lessonMaxPoints, lessonPoints } from './scoring'

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
        ])
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore request timed out')), 12_000),
        )
        const [prof, prog] = await Promise.race([load, timeout])
        if (!active) return
        setProfile(prof)
        setProgress(prog)
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

  const isUnlocked = useCallback(
    (lesson: Lesson) => {
      if (isAdmin(user?.email)) return true
      if (lesson.order === 1) return true
      const prev = LESSONS.find((l) => l.order === lesson.order - 1)
      if (!prev) return true
      const prevProgress = progress[prev.id]
      if (prevProgress?.status !== 'completed') return false
      return hasPassed(lessonPoints(prev, prevProgress.steps), lessonMaxPoints(prev))
    },
    [progress, user?.email],
  )

  const recommendedLessonId = useMemo(() => {
    const sorted = [...LESSONS].sort((a, b) => a.order - b.order)
    const next = sorted.find((l) => {
      const pr = progress[l.id]
      const passed = pr?.status === 'completed' && hasPassed(lessonPoints(l, pr.steps), lessonMaxPoints(l))
      return !passed && isUnlocked(l)
    })
    return next ? next.id : null
  }, [progress, isUnlocked])

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
    }),
    [user, profile, progress, loading, error, saveStep, savePosition, completeLesson, patchProfile, isUnlocked, recommendedLessonId],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}
