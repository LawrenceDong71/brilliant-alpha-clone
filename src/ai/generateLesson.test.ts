import { describe, expect, it } from 'vitest'
import { generateLesson } from './generateLesson'
import { TOPICS } from './curriculum/topics'
import { mockProvider } from './provider'
import { verifyStep } from './verify/verifyStep'
import { isGeneratableStep } from './types'

describe('generateLesson (Feature A)', () => {
  it('builds a verified, well-shaped lesson for every topic', async () => {
    for (const topic of TOPICS) {
      const lesson = await generateLesson(topic, { provider: mockProvider })
      expect(lesson, topic.id).not.toBeNull()
      if (!lesson) continue

      // Opens with a concept intro and ends with a concept wrap.
      expect(lesson.steps[0].type).toBe('concept')
      expect(lesson.steps[lesson.steps.length - 1].type).toBe('concept')

      const interactive = lesson.steps.filter((s) => s.type !== 'concept')
      expect(interactive.length, `${topic.id} interactive count`).toBeGreaterThan(0)

      // Every generated interactive step is solvable (re-verified independently).
      for (const step of interactive) {
        expect(isGeneratableStep(step), `${step.id} generatable`).toBe(true)
        if (isGeneratableStep(step)) {
          expect(verifyStep(step).ok, `${step.id} verifies`).toBe(true)
        }
      }

      // Step ids are unique within the lesson.
      const ids = lesson.steps.map((s) => s.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})
