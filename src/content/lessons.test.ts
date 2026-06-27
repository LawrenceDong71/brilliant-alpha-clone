import { describe, expect, it } from 'vitest'
import { LESSONS, lessonById, nextLesson } from './lessons'
import type { Step } from './types'

describe('curriculum structure', () => {
  it('has six lessons numbered 1..6 in order', () => {
    expect(LESSONS).toHaveLength(6)
    expect(LESSONS.map((l) => l.order)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('uses unique lesson ids', () => {
    const ids = LESSONS.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every lesson required, non-empty metadata', () => {
    for (const lesson of LESSONS) {
      expect(lesson.id, 'id').toBeTruthy()
      expect(lesson.title, `${lesson.id} title`).toBeTruthy()
      expect(lesson.summary, `${lesson.id} summary`).toBeTruthy()
      expect(lesson.estimatedMinutes, `${lesson.id} minutes`).toBeGreaterThan(0)
      expect(lesson.steps.length, `${lesson.id} steps`).toBeGreaterThan(0)
    }
  })
})

describe('steps', () => {
  const allSteps: Step[] = LESSONS.flatMap((l) => l.steps)

  it('have globally unique ids', () => {
    const ids = allSteps.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('always carry a prompt and a well-formed feedback shape', () => {
    for (const step of allSteps) {
      expect(step.prompt, `${step.id} prompt`).toBeTruthy()
      expect(step.feedback, `${step.id} feedback`).toBeDefined()
      expect(Array.isArray(step.feedback.hints), `${step.id} hints`).toBe(true)
      expect(typeof step.feedback.correct, `${step.id} correct`).toBe('string')
      expect(typeof step.feedback.explanation, `${step.id} explanation`).toBe('string')
    }
  })

  it('open each lesson with a concept intro', () => {
    for (const lesson of LESSONS) {
      expect(lesson.steps[0].type, `${lesson.id} first step`).toBe('concept')
    }
  })
})

describe('lesson lookup helpers', () => {
  it('lessonById finds a lesson and misses gracefully', () => {
    expect(lessonById('angles')?.title).toBe('Angles & Measuring')
    expect(lessonById('does-not-exist')).toBeUndefined()
  })

  it('nextLesson walks the path and stops at the end', () => {
    expect(nextLesson('points-lines')?.id).toBe('angles')
    const last = LESSONS[LESSONS.length - 1]
    expect(nextLesson(last.id)).toBeUndefined()
  })
})
