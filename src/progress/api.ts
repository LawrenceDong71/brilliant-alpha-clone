import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '../lib/firebase'
import { dayDiff, localDateStr } from '../lib/dates'
import {
  emptyStreak,
  type LessonProgress,
  type ProgressMap,
  type StreakState,
  type UserProfile,
} from './types'

const userRef = (uid: string) => doc(db, 'users', uid)
const progressRef = (uid: string, lessonId: string) =>
  doc(db, 'users', uid, 'progress', lessonId)

export async function ensureUserProfile(
  user: User,
  displayName?: string,
): Promise<UserProfile> {
  const ref = userRef(user.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    const data = snap.data()
    return {
      uid: user.uid,
      displayName: data.displayName ?? user.displayName ?? 'Learner',
      email: data.email ?? user.email ?? '',
      streak: (data.streak as StreakState) ?? { ...emptyStreak },
    }
  }
  const profile: UserProfile = {
    uid: user.uid,
    displayName:
      displayName ?? user.displayName ?? user.email?.split('@')[0] ?? 'Learner',
    email: user.email ?? '',
    streak: { ...emptyStreak },
  }
  await setDoc(ref, {
    displayName: profile.displayName,
    email: profile.email,
    streak: profile.streak,
    createdAt: Date.now(),
  })
  return profile
}

export async function fetchAllProgress(uid: string): Promise<ProgressMap> {
  const snap = await getDocs(collection(db, 'users', uid, 'progress'))
  const map: ProgressMap = {}
  snap.forEach((d) => {
    map[d.id] = d.data() as LessonProgress
  })
  return map
}

export async function saveLessonProgress(
  uid: string,
  lessonId: string,
  progress: LessonProgress,
): Promise<void> {
  await setDoc(progressRef(uid, lessonId), progress)
}

export async function saveStreak(
  uid: string,
  streak: StreakState,
): Promise<void> {
  await updateDoc(userRef(uid), { streak })
}

/** Persist editable profile fields (display name / email) to the user doc. */
export async function updateUserProfile(
  uid: string,
  fields: Partial<Pick<UserProfile, 'displayName' | 'email'>>,
): Promise<void> {
  await updateDoc(userRef(uid), fields)
}

/**
 * Advances a streak when the learner is active on a new calendar day.
 * Same day -> unchanged. Consecutive day -> +1. Gap -> reset to 1.
 */
export function advanceStreak(
  streak: StreakState,
  today: string = localDateStr(),
): StreakState {
  if (streak.lastActiveDate === today) return streak
  const gap = streak.lastActiveDate ? dayDiff(streak.lastActiveDate, today) : Infinity
  const current = gap === 1 ? streak.current + 1 : 1
  return {
    current,
    longest: Math.max(streak.longest, current),
    lastActiveDate: today,
  }
}
