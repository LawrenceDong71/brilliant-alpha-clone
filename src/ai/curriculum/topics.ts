/**
 * Curated "what's next" catalog for Feature A ("Keep Going"). Every topic is
 * unlocked only after the core 6 lessons are complete, and each is expressed
 * with the verifiable step types the generator + §2.5 verifier support, so a
 * generated lesson is always solvable. The `seeds` are scenario prompts handed
 * to the same generate->verify->repair pipeline as Design-a-Problem; each
 * becomes one verified interactive step.
 */
export interface TopicNode {
  id: string
  title: string
  blurb: string
  /** Drawn inside the topic card (reuses HomePage glyph kinds). */
  glyph: 'square' | 'triangle' | 'right-triangle' | 'angle'
  intro: string
  outro: string
  seeds: string[]
}

export const TOPICS: readonly TopicNode[] = [
  {
    id: 'area-pro',
    title: 'Area Masterclass',
    blurb: 'Mixed area practice — rectangles and triangles from real scenes.',
    glyph: 'square',
    intro:
      'You learned area in Lesson 5. Now stretch it across new shapes and bigger numbers. Remember: rectangle = width × height, triangle = ½ × base × height.',
    outro: 'Nice — you applied both area formulas to brand-new situations. Keep going!',
    seeds: [
      'an 8 by 6 m garden bed',
      'a triangular sail that is 10 wide and 8 tall',
      'a 9 by 7 ft kitchen rug',
    ],
  },
  {
    id: 'pythagoras-pro',
    title: 'Pythagorean Puzzles',
    blurb: 'Find missing sides of right triangles in word problems.',
    glyph: 'right-triangle',
    intro:
      'Lesson 4 introduced a² + b² = c². These puzzles hide a right triangle in a real situation — spot the legs and the hypotenuse, then solve.',
    outro: 'You found every missing side with the Pythagorean theorem. On to the next!',
    seeds: [
      'a 13 ft ladder reaching 12 ft up a wall, how far is the base',
      'walking 9 blocks east then 12 blocks north, distance as the crow flies',
      'the diagonal brace of a 8 by 15 frame',
    ],
  },
  {
    id: 'angles-pro',
    title: 'Angle Detective',
    blurb: 'Use the 180° rule to crack missing angles in triangles.',
    glyph: 'angle',
    intro:
      'From Lesson 3: a triangle’s interior angles always sum to 180°. Each case gives you two corners — work out the third.',
    outro: 'Every missing corner found by 180° minus the two you knew. Detective work done!',
    seeds: [
      'two angles of a tent are 80° and 60°, find the third',
      'a bracket with angles of 90° and 25°',
      'a corner where two angles measure 100° and 45°',
    ],
  },
]

export const topicById = (id: string): TopicNode | undefined => TOPICS.find((t) => t.id === id)
