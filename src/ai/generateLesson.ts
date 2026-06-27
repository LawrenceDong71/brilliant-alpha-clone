import type { ConceptStep, Lesson, Step } from '../content/types'
import { designProblem } from './designProblem'
import type { AiProvider } from './provider'
import type { TopicNode } from './curriculum/topics'

function concept(id: string, prompt: string, body: string): ConceptStep {
  return { id, type: 'concept', prompt, body, feedback: { correct: '', hints: [], explanation: '' } }
}

export interface GenerateLessonOptions {
  provider?: AiProvider
}

/**
 * Feature A ("Keep Going"): assemble a fresh practice lesson for a topic by
 * running each scenario seed through the verified Design-a-Problem pipeline, then
 * wrapping the verified steps with a concept intro/outro. Every interactive step
 * is already §2.5-verified (solvable) before it lands in the lesson. Returns null
 * if not a single step could be verified (caller then declines / falls back).
 */
export async function generateLesson(
  topic: TopicNode,
  options: GenerateLessonOptions = {},
): Promise<Lesson | null> {
  const steps: Step[] = [concept(`${topic.id}-intro`, topic.title, topic.intro)]

  for (const seed of topic.seeds) {
    const out = await designProblem(seed, { provider: options.provider })
    if (out.ok) steps.push(out.step)
  }

  const interactiveCount = steps.filter((s) => s.type !== 'concept').length
  if (interactiveCount === 0) return null

  steps.push(concept(`${topic.id}-wrap`, 'Nice work!', topic.outro))

  return {
    id: `gen-${topic.id}-${Date.now().toString(36)}`,
    order: 0,
    title: topic.title,
    summary: topic.blurb,
    estimatedMinutes: Math.max(3, interactiveCount * 2),
    steps,
  }
}
