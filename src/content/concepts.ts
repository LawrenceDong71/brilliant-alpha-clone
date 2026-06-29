import type { ConceptId, Step } from './types'

/**
 * Phase 3 concept catalog. v1 maps one concept per core lesson; this is the unit
 * tracked for mastery, spaced repetition, and interleaved review. Finer-grained
 * concepts can be introduced later by tagging individual steps with `concept`.
 */
export interface Concept {
  id: ConceptId
  /** Human-friendly name shown in the retention panel / review. */
  name: string
  /** One-line description of the skill. */
  blurb: string
}

export const CONCEPTS: Concept[] = [
  { id: 'points-lines', name: 'Points, Lines & Rays', blurb: 'Points, segments, rays, and lines on the plane.' },
  { id: 'angles', name: 'Angles', blurb: 'Measuring, naming, and reasoning about angles.' },
  { id: 'triangles', name: 'Triangles & Angle Sum', blurb: 'Triangle types and the 180° angle sum.' },
  { id: 'pythagorean', name: 'Pythagorean Theorem', blurb: 'Finding missing sides with a² + b² = c².' },
  { id: 'area-perimeter', name: 'Area & Perimeter', blurb: 'Area and perimeter of rectangles and composite shapes.' },
  { id: 'transformations', name: 'Transformations', blurb: 'Translations, reflections, rotations, and symmetry.' },
]

export const CONCEPT_IDS: ConceptId[] = CONCEPTS.map((c) => c.id)

const CONCEPT_BY_ID: Record<ConceptId, Concept> = Object.fromEntries(
  CONCEPTS.map((c) => [c.id, c]),
) as Record<ConceptId, Concept>

/** Each core lesson id → its primary concept (the default for its steps). */
export const LESSON_CONCEPT: Record<string, ConceptId> = {
  'points-lines': 'points-lines',
  angles: 'angles',
  triangles: 'triangles',
  pythagorean: 'pythagorean',
  'area-perimeter': 'area-perimeter',
  transformations: 'transformations',
}

export function conceptName(id: ConceptId): string {
  return CONCEPT_BY_ID[id]?.name ?? id
}

export function getConcept(id: ConceptId): Concept | undefined {
  return CONCEPT_BY_ID[id]
}

/**
 * The concept a step belongs to: its explicit `concept` tag if present, otherwise
 * its lesson's primary concept. Returns undefined if neither is known.
 */
export function conceptForStep(lessonId: string, step: Step): ConceptId | undefined {
  return step.concept ?? LESSON_CONCEPT[lessonId]
}
