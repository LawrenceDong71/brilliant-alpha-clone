import type { Lesson } from './types'

/**
 * Six hand-authored geometry lessons forming a linear path.
 * All prompts, hints and explanations are written by hand (no AI/generated content).
 * Coordinates use a math convention (x right, y up); step components flip y for SVG.
 */
export const LESSONS: Lesson[] = [
  {
    id: 'points-lines',
    order: 1,
    title: 'Points, Lines & Rays',
    summary: 'Build constellations and aim a lighthouse to meet the building blocks of geometry.',
    estimatedMinutes: 9,
    steps: [
      {
        id: 'l1-hook',
        type: 'concept',
        prompt: 'It all starts with a dot',
        body: 'A star in the sky, a pin on a map, a single pixel on your screen — each marks one exact spot. In geometry that spot is called a point, and it is the most basic building block of everything else. Let us start by playing with some points.',
        figure: { kind: 'pointsScatter' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l1-constellation',
        type: 'connectDots',
        prompt: 'Tap the stars 1 → 5 in order to draw the constellation Cassiopeia.',
        instruction: 'Tap each star in number order to connect them.',
        grid: { min: 0, max: 10 },
        dots: [
          { id: 's1', at: { x: 1, y: 3 } },
          { id: 's2', at: { x: 3, y: 7 } },
          { id: 's3', at: { x: 5, y: 3 } },
          { id: 's4', at: { x: 7, y: 7 } },
          { id: 's5', at: { x: 9, y: 3 } },
        ],
        order: ['s1', 's2', 's3', 's4', 's5'],
        feedback: {
          correct: 'You drew a constellation! Each star is a point, and every line you made between two stars is a segment.',
          hints: [
            'Start at star 1, then tap 2, 3, 4, 5 in order.',
            'Tapped the wrong one? Hit "Start over" and follow the numbers.',
          ],
          explanation:
            'Each star is a point — a single location. Connecting two points with a straight path makes a segment. You just built four segments between five points.',
        },
      },
      {
        id: 'l1-point-concept',
        type: 'concept',
        prompt: 'What a point really is',
        body: 'A point marks one exact location and has no size at all — no length, no width. We label points with capital letters, like A or B, so we can talk about them. The stars you tapped were points; the dot here is point A.',
        figure: { kind: 'pointDot' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l1-segment-concept',
        type: 'concept',
        prompt: 'Connecting points: the segment',
        body: 'Join two points with a straight path and you get a segment. A segment has exactly two endpoints and a fixed, measurable length — like the rung of a ladder or the edge of a phone. Each line you drew in the constellation was a segment.',
        figure: { kind: 'segment' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l1-segment-q',
        type: 'multipleChoice',
        prompt: 'Which everyday object is the best example of a segment?',
        options: [
          { id: 'a', label: 'A pencil' },
          { id: 'b', label: 'A single star in the sky' },
          { id: 'c', label: 'A laser beam shining into space' },
          { id: 'd', label: 'A straight road with no end in sight' },
        ],
        correctOptionId: 'a',
        feedback: {
          correct: 'Yes — a pencil has two endpoints and a set length, exactly like a segment.',
          hints: [
            'A segment has two endpoints and a fixed length.',
            'Which option clearly starts and stops at two ends?',
          ],
          explanation:
            'A pencil has two clear ends and a fixed length, so it models a segment. A star is a point, while a laser beam and an endless road keep going (a ray and a line).',
        },
      },
      {
        id: 'l1-ray-concept',
        type: 'concept',
        prompt: 'When one end runs forever: the ray',
        body: 'Now keep one endpoint but let the other end shoot off forever. That is a ray: one fixed starting point and an arrow that never stops. A flashlight beam, a laser pointer, and a sunbeam all start somewhere and travel endlessly in one direction.',
        figure: { kind: 'ray' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l1-mc-ray',
        type: 'multipleChoice',
        prompt: 'A flashlight beam starts at the bulb and shines off into the distance. Which geometry object is it most like?',
        options: [
          { id: 'a', label: 'A point' },
          { id: 'b', label: 'A segment' },
          { id: 'c', label: 'A ray' },
          { id: 'd', label: 'A line' },
        ],
        correctOptionId: 'c',
        feedback: {
          correct: 'Exactly — a beam has one starting point and keeps going one direction. That is a ray.',
          hints: [
            'It has a clear starting point (the bulb). Does it have an ending point?',
            'One endpoint, goes forever in one direction — what is that called?',
          ],
          explanation:
            'A ray has exactly one endpoint and extends forever in a single direction, just like a beam of light leaving a flashlight. A segment would have two endpoints; a line would have none.',
        },
      },
      {
        id: 'l1-lighthouse',
        type: 'rayAim',
        prompt: 'Guide the ship home. Drag to aim the lighthouse beam — while the ship sits in the light, the captain can see and sails toward the harbor.',
        grid: { min: 0, max: 10 },
        origin: { x: 1, y: 1 },
        target: { x: 8, y: 7 },
        startDeg: 75,
        toleranceDeg: 4,
        originLabel: '🗼',
        targetLabel: '⛵',
        feedback: {
          correct: 'Safe harbor! A ray starts at one point — the lighthouse — and shines out in the single direction you aim it. You kept the ship inside that ray the whole way home.',
          hints: [
            'The beam pivots around the lighthouse. Sweep it onto the ship to light it up.',
            'While the ship sits inside the beam it sails home; if it drifts into the dark, re-aim to catch it again.',
          ],
          explanation:
            'A ray has a fixed starting point (the lighthouse) and extends in one direction forever. Rotating the beam only changes that direction — so you steer the ship home by keeping the ray pointed right at it.',
        },
      },
      {
        id: 'l1-line-concept',
        type: 'concept',
        prompt: 'No ends at all: the line',
        body: 'Remove both endpoints and you have a line: perfectly straight, with no start and no finish, running forever in both directions. Think of an endless straight highway vanishing toward the horizon on either side. We draw arrows on both ends to show it never stops.',
        figure: { kind: 'line' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l1-mc-line',
        type: 'multipleChoice',
        prompt: 'What is the key difference between a line and a segment?',
        options: [
          { id: 'a', label: 'A line goes on forever in both directions; a segment has two endpoints' },
          { id: 'b', label: 'A line is straight; a segment is curved' },
          { id: 'c', label: 'A line is longer, but both have two endpoints' },
          { id: 'd', label: 'There is no difference' },
        ],
        correctOptionId: 'a',
        feedback: {
          correct: 'Right — a segment is a finite piece with two endpoints, while a line never ends in either direction.',
          hints: [
            'Both are straight. Think about whether each one ends.',
            'How many endpoints does a line have? How many does a segment have?',
          ],
          explanation:
            'Both are perfectly straight. The difference is endpoints: a segment has exactly two (so it has a fixed length), while a line has none and continues forever in both directions.',
        },
      },
      {
        id: 'l1-compare',
        type: 'concept',
        prompt: 'The whole family, side by side',
        body: 'Here are all four together. The difference is simply how many endpoints each one has: a point is a single spot; a segment has two endpoints; a ray has one endpoint and one arrow; a line has no endpoints and two arrows. Counting endpoints is the fastest way to tell them apart.',
        figure: { kind: 'pointsLines' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l1-sort',
        type: 'sortBins',
        prompt: 'Sort each real-world thing by the geometry object it best matches.',
        bins: [
          { id: 'point', label: 'Point' },
          { id: 'ray', label: 'Ray' },
          { id: 'line', label: 'Line' },
          { id: 'segment', label: 'Segment' },
        ],
        items: [
          { id: 'star', label: '⭐ A star in the sky', correctBin: 'point' },
          { id: 'sunbeam', label: '☀️ A sunbeam', correctBin: 'ray' },
          { id: 'highway', label: '🛣️ An endless straight highway', correctBin: 'line' },
          { id: 'bridge', label: '🌉 A bridge between two towers', correctBin: 'segment' },
          { id: 'pin', label: '📍 A pin on a map', correctBin: 'point' },
          { id: 'pencil', label: '✏️ A pencil', correctBin: 'segment' },
        ],
        feedback: {
          correct: 'Spot on! Points have no size, rays start somewhere and run off forever, lines run forever both ways, and segments have two ends.',
          hints: [
            'Ask: does it have 0, 1, or 2 endpoints — or is it just a single spot?',
            'A sunbeam starts at the sun and goes one way (ray); a highway has no end either way (line).',
          ],
          explanation:
            'A star and a map pin are single locations (points). A sunbeam starts at one point and travels one direction forever (ray). An endless highway runs both directions forever (line). A bridge and a pencil have two definite ends (segments).',
        },
      },
      {
        id: 'l1-wrap',
        type: 'concept',
        prompt: 'Building blocks unlocked',
        body: 'Every figure in geometry — triangles, squares, circles, even 3-D shapes — is built from points and the straight paths between them. Master these four (point, segment, ray, line) and you have the vocabulary for everything that follows. Next up: what happens when two rays meet and form an angle.',
        figure: { kind: 'angle', degrees: 60 },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l1-battleship',
        type: 'battleship',
        prompt:
          'Capstone — Battleship! Each shot is a point (a coordinate); each ship is a segment with two endpoints. Sink the enemy fleet, then answer the concept check.',
        size: 8,
        fleet: [2, 3, 4],
        feedback: {
          correct:
            'Fleet sunk! Every shot was a point; every ship was a segment — two endpoints and a finite, countable length.',
          hints: [
            'Sink every enemy ship, then choose the concept answer to finish.',
            'A ship is a segment: two endpoints with a length you can count (cells = |difference| + 1).',
          ],
          explanation:
            'Points locate; segments measure. Each shot named one point (x, y); each ship was a segment you could measure — and that finite length is exactly why it can be sunk.',
        },
      },
    ],
  },
  {
    id: 'angles',
    order: 2,
    title: 'Angles & Measuring',
    summary: 'Aim, sort, and build angles to learn how turning is measured.',
    estimatedMinutes: 8,
    steps: [
      {
        id: 'l2-hook',
        type: 'concept',
        prompt: 'Angles are everywhere',
        body: 'A skateboard ramp, the hands of a clock, a slice of pizza, a basketball shot — they all involve an angle: a measure of how much something turns. You already have an instinct for this. Let us put it to the test before we define anything.',
        figure: { kind: 'anglesHook' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l2-aim',
        type: 'angleTarget',
        prompt: 'Sink the shot! Drag the ball to set your launch angle so the arc drops through the hoop.',
        targetCenter: 72,
        targetHeight: 20,
        targetWidth: 6,
        startAngle: 20,
        targetLabel: 'hoop',
        feedback: {
          correct: 'Swish! You did not use a formula — you just felt the right angle. See the shaded corner at your feet? That is the angle you set.',
          hints: [
            'Watch the shaded angle at your feet grow as you aim higher.',
            'Too flat and the ball sails under the rim; raise the angle to about 60° so the arc drops in.',
          ],
          explanation:
            'The launch angle — the shaded corner between the flat ground and your shot — decides the whole arc. Aim around 60° and the ball curves up and drops right through the rim. Even a jump shot is really about an angle.',
        },
      },
      {
        id: 'l2-reveal',
        type: 'concept',
        prompt: 'So what did you just do?',
        body: 'You sank that shot by feel, not by formula — and that tilt between the flat ground and your shot was an angle. Here is the idea behind it: an angle is the amount of turn between two rays that meet at a point called the vertex. We measure it in degrees (°), where a full turn is 360°. A quarter turn — a perfect square corner — is 90°, a right angle.',
        figure: { kind: 'angle', degrees: 50 },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l2-make-right',
        type: 'angleDrag',
        prompt: 'Drag the blue ray to build a right angle (90°).',
        targetDegrees: 90,
        toleranceDegrees: 0,
        startDegrees: 25,
        feedback: {
          correct: 'Perfect right angle! That clean square corner is the 90° you find on books, walls, and tiles.',
          hints: [
            'A right angle is a perfect "L" shape — a quarter turn.',
            'Watch the live readout and aim for exactly 90°.',
          ],
          explanation:
            'A right angle measures exactly 90°, a quarter of a full turn. It forms a square corner like the edge of a book or a wall meeting the floor.',
        },
      },
      {
        id: 'l2-acute-obtuse',
        type: 'concept',
        prompt: 'Acute, right, obtuse',
        body: 'Now that you have felt 90°, the rest are easy to name. An acute angle is "cute and small" — less than 90°. A right angle is exactly 90°. An obtuse angle is wide and open — more than 90° but less than 180°. A straight line is 180°.',
        figure: { kind: 'angle', degrees: 130 },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l2-make-acute',
        type: 'angleDrag',
        prompt: 'Your turn: build a 45° angle — exactly half of a right angle.',
        targetDegrees: 45,
        toleranceDegrees: 0,
        startDegrees: 110,
        feedback: {
          correct: 'That is 45° — half of a right angle, and an acute angle.',
          hints: [
            '45° is halfway between 0° and 90°.',
            'Aim for the readout to show exactly 45°.',
          ],
          explanation:
            '45° is half of a 90° right angle. Because it is less than 90°, it is an acute angle.',
        },
      },
      {
        id: 'l2-sort',
        type: 'sortBins',
        prompt: 'Sort these real-world angles into the right group.',
        bins: [
          { id: 'acute', label: 'Acute' },
          { id: 'right', label: 'Right' },
          { id: 'obtuse', label: 'Obtuse' },
        ],
        items: [
          { id: 'pizza', label: '🍕 Thin pizza slice', correctBin: 'acute' },
          { id: 'scissors', label: '✂️ Slightly open scissors', correctBin: 'acute' },
          { id: 'book', label: '📕 Corner of a book', correctBin: 'right' },
          { id: 'tile', label: '⬜ Corner of a floor tile', correctBin: 'right' },
          { id: 'chair', label: '🛋️ Reclined beach chair', correctBin: 'obtuse' },
          { id: 'laptop', label: '💻 Fully opened laptop', correctBin: 'obtuse' },
        ],
        feedback: {
          correct: 'Nicely sorted! You can size up an angle just by how open it looks.',
          hints: [
            'Compare each one to a square corner (90°). Smaller = acute, wider = obtuse.',
            'The two exactly-square corners (book, tile) go in the Right group.',
          ],
          explanation:
            'Anything below a square corner is acute, exactly a square corner is right (90°), and wider than that is obtuse. Pizza (30°) and scissors (45°) are acute; the book and tile corners are right; the reclined chair (130°) and open laptop (160°) are obtuse.',
        },
      },
      {
        id: 'l2-clock',
        type: 'multipleChoice',
        prompt: 'The clock reads 3:00. What angle do the two hands make?',
        figure: { kind: 'clock', hour: 3, minute: 0 },
        options: [
          { id: 'a', label: '30°' },
          { id: 'b', label: '90°' },
          { id: 'c', label: '180°' },
          { id: 'd', label: '45°' },
        ],
        correctOptionId: 'b',
        feedback: {
          correct: 'Exactly — at 3:00 the hands form a clean right angle, 90°.',
          hints: [
            'The clock face is split into 12 hours, all the way around (360°).',
            'From 12 to 3 is a quarter of the way around the clock. A quarter of 360° is…?',
          ],
          explanation:
            'A full clock is 360°, divided into 12 hours, so each hour mark is 30°. From 12 to 3 is 3 hours = 3 × 30° = 90°, a right angle.',
        },
      },
      {
        id: 'l2-degrees',
        type: 'concept',
        prompt: 'Where degrees come from',
        body: 'You just measured a clock without a protractor. Here is why it works: one full turn around any point is 360°, and a clock splits that evenly into 12 hours — so each hour is 360 ÷ 12 = 30°. A clock face is secretly a protractor! Spinning all the way around is 360°, half a turn is 180° (a straight line), and a quarter turn is 90° (a right angle).',
        figure: { kind: 'angle', degrees: 30 },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l2-aim2',
        type: 'angleTarget',
        prompt: 'Final challenge: the hoop is closer now. Re-aim the ball to score.',
        targetCenter: 52,
        targetHeight: 20,
        targetWidth: 6,
        startAngle: 78,
        targetLabel: 'hoop',
        feedback: {
          correct: 'Money! Did you spot it — a flat ~40° shot AND a steep ~71° shot both drop through the closer hoop.',
          hints: [
            'The hoop is closer, so you can loft it steeply over a short distance.',
            'Bring the angle down from the top — around 71° drops it in (a flat ~40° works too).',
          ],
          explanation:
            'For a closer hoop there are two winning angles: a high, steep arc (~71°) and a low, flat one (~40°). Same hoop, two different angles — proof that the angle, not luck, controls the shot.',
        },
      },
      {
        id: 'l2-wrap',
        type: 'concept',
        prompt: 'You measured turning',
        body: 'Every challenge here was the same idea in disguise: an angle is just how much something turns, measured in degrees. You felt it in a jump shot, built exact right and acute angles, spotted them in everyday objects, and read them off a clock. Next we will snap three angles together into the most important shape in geometry — the triangle.',
        figure: { kind: 'angle', degrees: 90 },
        feedback: { correct: '', hints: [], explanation: '' },
      },
    ],
  },
  {
    id: 'triangles',
    order: 3,
    title: 'Triangles & the Angle Sum',
    summary: 'Bend a tent frame, tear paper corners, and fill angle gaps to master the 180° rule.',
    estimatedMinutes: 9,
    steps: [
      {
        id: 'l3-hook',
        type: 'concept',
        prompt: 'The strongest shape',
        body: 'Roof trusses, bridges, bike frames, the Eiffel Tower — engineers reach for the triangle because it holds its shape under load. Squares wobble; triangles do not. Hidden inside every triangle is a rule that never breaks. Let us poke at one and find it.',
        figure: { kind: 'truss' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l3-explore',
        type: 'dragTriangle',
        prompt: 'Before we explain anything — just play. This is an A-frame tent. Drag the peak all over and watch ∠A, ∠B, ∠C and their sum. Try to break it: can you make the three angles add up to anything other than 180°? Once you give up, park the peak so ∠C is about 90°.',
        initial: { A: { x: 1, y: 1 }, B: { x: 9, y: 1 }, C: { x: 4, y: 6 } },
        draggable: ['C'],
        targetVertex: 'C',
        targetAngle: 90,
        toleranceDegrees: 5,
        feedback: {
          correct: 'No matter where you drag the peak, the three angles always re-balance to 180°. You just locked ∠C ≈ 90°.',
          hints: [
            'Drag the peak (vertex C) high, low, left, right — keep watching the "sum" readout.',
            'To finish, shape it so the corner at C reads about 90°.',
          ],
          explanation:
            'Try as you might, the sum stays pinned at 180°. Widen one angle and the others shrink to compensate. This balancing act is the angle-sum property.',
        },
      },
      {
        id: 'l3-reveal',
        type: 'concept',
        prompt: 'The 180° rule',
        body: 'You just felt it: no matter how you drag the peak, the three angles always re-balance to the same total. That total is 180° — exactly a straight line. Stretch one angle wider and the other two shrink to make room. Next, let us prove it with our hands instead of taking my word for it.',
        figure: { kind: 'triangleAngles' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l3-tear',
        type: 'cornerTear',
        prompt: 'Tear off all three corners and lay them along the table edge. Tap each colored corner.',
        triangle: { A: { x: 1, y: 1 }, B: { x: 9, y: 1 }, C: { x: 3.5, y: 6.5 } },
        feedback: {
          correct: 'Look at that — the three corners fill a perfectly straight line. A straight line is 180°, so the angles must sum to 180°.',
          hints: [
            'Tap each corner of the triangle; it folds down onto the table edge.',
            'Place all three and watch the running total reach 180°.',
          ],
          explanation:
            'Laid corner-to-corner, the three angles exactly fill a straight angle (a half-turn). Since a straight line measures 180°, the three interior angles must add to 180° for any triangle.',
        },
      },
      {
        id: 'l3-use',
        type: 'concept',
        prompt: 'A built-in cheat code',
        body: 'Here is the payoff of the 180° rule: if you know two angles of a triangle, the third is never a mystery. It has to be whatever is left over after the first two — that is, 180° minus the two you already have. Builders use this constantly: measure two corners of a roof or a brace, and the last corner is decided for you. Let us put that to work by hand.',
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l3-fill1',
        type: 'angleFill',
        prompt: 'A wheelchair ramp brace is a triangle. Two of its corners are already set at 90° and 35° (laid out for you on the line). Drag to build the third corner so the three angles snap into one straight edge. What does the last corner have to be?',
        given: [90, 35],
        tolerance: 0,
        context: 'ramp brace',
        feedback: {
          correct: 'There it is — the gap closes at 55°. And 90 + 35 + 55 = 180. You did not memorize it; you felt the leftover space.',
          hints: [
            'Drag the handle until there is no gap and no overlap — a perfectly flat line.',
            'The three corners together must equal a straight line: 180°.',
          ],
          explanation:
            'Two corners use up 90 + 35 = 125°. A straight line is 180°, so the corner that fills the rest is 180 − 125 = 55°.',
        },
      },
      {
        id: 'l3-fill2',
        type: 'angleFill',
        prompt: 'Now a kite panel: two corners measure 105° and 40°. Drag to fill in the last corner until the three pieces lie flat. How small does it have to be?',
        given: [105, 40],
        tolerance: 0,
        context: 'kite panel',
        feedback: {
          correct: 'Snapped flat at 35°. Notice the big 105° corner left only a sliver for the rest — the angles always trade off to hit 180°.',
          hints: [
            'Close the gap completely so the wedges form a straight line.',
            '105 + 40 = 145 is already used up. What is left of 180?',
          ],
          explanation:
            'The two known corners total 105 + 40 = 145°. The third must complete the straight line: 180 − 145 = 35°.',
        },
      },
      {
        id: 'l3-sort',
        type: 'sortBins',
        prompt: 'Triangles also come in three “flavors.” Each card lists a triangle’s three angles — drop it into the bin you think it belongs in and learn from the feedback. (Hint: keep your eye on the biggest angle in each card.)',
        bins: [
          { id: 'acute', label: 'Acute' },
          { id: 'right', label: 'Right' },
          { id: 'obtuse', label: 'Obtuse' },
        ],
        items: [
          { id: 't1', label: '📐 90°, 60°, 30°', correctBin: 'right' },
          { id: 't2', label: '🍕 75°, 65°, 40°', correctBin: 'acute' },
          { id: 't3', label: '🏔️ 120°, 40°, 20°', correctBin: 'obtuse' },
          { id: 't4', label: '⛵ 90°, 45°, 45°', correctBin: 'right' },
          { id: 't5', label: '🔺 60°, 60°, 60°', correctBin: 'acute' },
          { id: 't6', label: '🛹 100°, 50°, 30°', correctBin: 'obtuse' },
        ],
        feedback: {
          correct: 'Nailed it. The biggest angle decides everything: all under 90° → acute, exactly 90° → right, over 90° → obtuse.',
          hints: [
            'Look only at the largest of the three angles on each card.',
            'Largest under 90° → acute; exactly 90° → right; over 90° → obtuse.',
          ],
          explanation:
            'The type is decided by the biggest angle: under 90° everywhere is acute, exactly 90° is right, and more than 90° is obtuse.',
        },
      },
      {
        id: 'l3-types',
        type: 'concept',
        prompt: 'Naming the three flavors',
        body: 'You just discovered the rule by sorting: a triangle is named after its largest angle. Acute means all three angles are under 90° (it looks “sharp”). Right means one angle is exactly 90° (it has a square corner). Obtuse means one angle is over 90° (it looks “stretched”). And because the three must add to 180°, a triangle can have at most one right or obtuse angle — there is never enough budget for two.',
        figure: { kind: 'triangleTypes' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l3-detective',
        type: 'multipleChoice',
        prompt: 'Put both ideas together. A triangle has two angles of 50° and 50°. Without measuring, what is the third angle — and what type of triangle is it?',
        options: [
          { id: 'a', label: '80°, and it is acute' },
          { id: 'b', label: '100°, and it is obtuse' },
          { id: 'c', label: '80°, and it is right' },
          { id: 'd', label: '90°, and it is right' },
        ],
        correctOptionId: 'a',
        feedback: {
          correct: 'Perfect detective work — 180 − 50 − 50 = 80°, and since every angle is under 90° it is acute.',
          hints: [
            'First find the third angle: 180 − 50 − 50 = ?',
            'Then check the largest angle to name the type.',
          ],
          explanation:
            'The third angle is 180 − 50 − 50 = 80°. The three angles are 50°, 50°, 80° — all under 90° — so the triangle is acute.',
        },
      },
      {
        id: 'l3-wrap',
        type: 'concept',
        prompt: 'What you uncovered',
        body: 'You bent a tent frame and could not break the 180° total. You tore the corners off and watched them fill a straight line. Then you used that rule as a cheat code — fill the gap and the missing angle appears — and you sorted triangles into acute, right, and obtuse. One unbreakable rule, the angle sum, did all the work. Next up: the most famous rule about a triangle’s sides.',
        figure: { kind: 'triangle' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
    ],
  },
  {
    id: 'pythagorean',
    order: 4,
    title: 'The Pythagorean Theorem',
    summary: 'Grow squares on a triangle and raise a ladder to crack a² + b² = c².',
    estimatedMinutes: 10,
    steps: [
      {
        id: 'l4-hook',
        type: 'concept',
        prompt: 'The shortcut across',
        body: 'Walk 3 blocks east, then 4 blocks north — you traveled 7 blocks, but as the crow flies you are only 5 blocks from where you started. Right triangles hide a shortcut like this, and one ancient rule unlocks it. Let us discover it by building.',
        figure: { kind: 'rightTriangle', a: 3, b: 4 },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l4-squares',
        type: 'pythagSquares',
        prompt: 'Each side of this right triangle has a square built on it. Drag the legs and watch the three areas. Can you make the longest side (red square) come out to exactly 5?',
        initialA: 2,
        initialB: 2,
        minLeg: 1,
        maxLeg: 6,
        targetC: 5,
        tolerance: 0.05,
        feedback: {
          correct: 'Look closely: the blue area + the green area ALWAYS equals the red area. With legs 3 and 4, that is 9 + 16 = 25, so the long side is √25 = 5.',
          hints: [
            'The two small squares (blue + green) always add up to the big red square.',
            'Try legs of 3 and 4 — what does the red square’s area become?',
          ],
          explanation:
            'No matter how you drag the legs, area(leg a) + area(leg b) = area(hypotenuse). That is the Pythagorean theorem: a² + b² = c². Legs 3 and 4 give 9 + 16 = 25, so c = √25 = 5.',
        },
      },
      {
        id: 'l4-reveal',
        type: 'concept',
        prompt: 'a² + b² = c²',
        body: 'In a right triangle the two sides that form the square corner are the legs (a and b); the long side opposite the right angle is the hypotenuse (c). The squares you grew prove the rule: a² + b² = c². To find the hypotenuse, square both legs, add them, and take the square root.',
        figure: { kind: 'rightTriangle', a: 3, b: 4 },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l4-hyp',
        type: 'multipleChoice',
        prompt: 'Which side is the hypotenuse?',
        figure: { kind: 'rightTriangle', a: 3, b: 4 },
        options: [
          { id: 'a', label: 'The longest side, opposite the right angle' },
          { id: 'b', label: 'The shortest side' },
          { id: 'c', label: 'A side that touches the right angle' },
        ],
        correctOptionId: 'a',
        feedback: {
          correct: 'Right — the hypotenuse is the longest side and sits directly across from the square corner.',
          hints: [
            'The right angle is the square corner. The hypotenuse is across from it.',
            'It is also the longest of the three sides.',
          ],
          explanation:
            'The hypotenuse is the side opposite the right angle, and it is always the longest side. The two sides forming the right angle are the legs.',
        },
      },
      {
        id: 'l4-ladder',
        type: 'ladder',
        prompt: 'A 10 m fire ladder leans against a building. Slide its base along the ground until the top just reaches the window 8 m up.',
        ladderLength: 10,
        windowHeight: 8,
        tolerance: 0.25,
        feedback: {
          correct: 'Perfect placement! The base sits 6 m out: 6² + 8² = 36 + 64 = 100 = 10², so the ladder (10 m) reaches exactly.',
          hints: [
            'The ladder length never changes — sliding the base out lowers the top.',
            'You need base² + 8² = 10². What base makes that true?',
          ],
          explanation:
            'The ladder, wall, and ground form a right triangle with hypotenuse 10 (the ladder). To reach 8 m high: base² + 8² = 10², so base² = 100 − 64 = 36 and base = 6 m.',
        },
      },
      {
        id: 'l4-leg',
        type: 'concept',
        prompt: 'Working backwards to a missing leg',
        body: 'Notice what the ladder problem really did: you already knew the long slanted side (the 10 m ladder) — what you hunted for was a leg, the 6 m base. The same rule runs in reverse. Starting from a² + b² = c², subtract instead of add: b² = c² − a². So when you know the hypotenuse and one leg, square the hypotenuse, subtract the known leg squared, and take the square root to free the missing leg.',
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l4-legfind',
        type: 'multipleChoice',
        prompt: 'Put the reverse trick to work. A right triangle has a hypotenuse of 25 cm and one leg of 7 cm. How long is the other leg?',
        options: [
          { id: 'a', label: '24 cm' },
          { id: 'b', label: '18 cm' },
          { id: 'c', label: '32 cm' },
          { id: 'd', label: '26 cm' },
        ],
        correctOptionId: 'a',
        feedback: {
          correct: 'Exactly — b² = 25² − 7² = 625 − 49 = 576, so the leg is √576 = 24 cm.',
          hints: [
            'You know the hypotenuse (25) and one leg (7). Rearrange to leg² = 25² − 7².',
            '625 − 49 = 576. What number squared is 576?',
          ],
          explanation:
            'Because 7² + b² = 25², we get b² = 625 − 49 = 576, so b = √576 = 24 cm. Subtracting the sides (25 − 7 = 18) is the classic trap. (7-24-25 is another Pythagorean triple.)',
        },
      },
      {
        id: 'l4-crow',
        type: 'distanceFlight',
        prompt:
          'Your nest is 8 blocks east and 15 blocks north — but it is not marked on the map. Count the streets and land the crow exactly on it. How far is that trip, as the crow flies?',
        grid: { min: 0, max: 16 },
        origin: { x: 0, y: 0 },
        target: { x: 8, y: 15 },
        tolerance: 0,
        startLabel: 'You',
        targetLabel: 'Nest',
        unit: ' blocks',
        feedback: {
          correct: 'Spot on — 8² + 15² = 64 + 225 = 289, and √289 = 17 blocks.',
          hints: [
            'Use the block numbers along the edges to count 8 east and 15 north — land exactly on that corner.',
            'The legs are 8 and 15, so the straight flight is √(64 + 225) = √289. What is that?',
          ],
          explanation:
            'East and north are perpendicular, so the straight-line distance is √(8² + 15²) = √289 = 17 blocks. (8-15-17 is a Pythagorean triple.)',
        },
      },
      {
        id: 'l4-tv',
        type: 'multipleChoice',
        prompt: 'A TV’s “size” is the diagonal of its screen. This screen is 30 in wide and 16 in tall (its legs are drawn below). What size is this TV?',
        figure: { kind: 'rightTriangle', a: 16, b: 30 },
        options: [
          { id: 'a', label: '34 in' },
          { id: 'b', label: '46 in' },
          { id: 'c', label: '40 in' },
          { id: 'd', label: '32 in' },
        ],
        correctOptionId: 'a',
        feedback: {
          correct: 'Yes — 30² + 16² = 900 + 256 = 1156, and √1156 = 34 in.',
          hints: [
            'The diagonal is the hypotenuse of a right triangle with legs 30 and 16.',
            '900 + 256 = 1156. What is √1156?',
          ],
          explanation:
            'The diagonal is √(30² + 16²) = √(900 + 256) = √1156 = 34 inches, so it is sold as a 34-inch TV. Just adding the sides (30 + 16 = 46) is the classic wrong answer.',
        },
      },
      {
        id: 'l4-sort',
        type: 'sortBins',
        prompt: 'A triangle is right only if a² + b² = c² for its sides. Test each set of side lengths and sort it.',
        bins: [
          { id: 'right', label: 'Right triangle' },
          { id: 'not', label: 'Not a right triangle' },
        ],
        items: [
          { id: 's1', label: '3, 4, 5', correctBin: 'right' },
          { id: 's2', label: '5, 12, 13', correctBin: 'right' },
          { id: 's3', label: '5, 6, 7', correctBin: 'not' },
          { id: 's4', label: '8, 15, 17', correctBin: 'right' },
          { id: 's5', label: '2, 3, 4', correctBin: 'not' },
          { id: 's6', label: '6, 8, 10', correctBin: 'right' },
        ],
        feedback: {
          correct: 'Great testing! Square the two shorter sides, add them, and check against the square of the longest side.',
          hints: [
            'Take the longest number as c. Does (shorter)² + (shorter)² equal c²?',
            'Example: 5,12,13 → 25 + 144 = 169 = 13². That is a right triangle.',
          ],
          explanation:
            'It is a right triangle exactly when the two smaller sides squared add up to the largest side squared. 3,4,5 (9+16=25 ✓), 5,12,13 (25+144=169 ✓), 8,15,17 (64+225=289 ✓), and 6,8,10 (36+64=100 ✓) all pass. 5,6,7 (25+36=61≠49) and 2,3,4 (4+9=13≠16) do not.',
        },
      },
      {
        id: 'l4-wrap',
        type: 'concept',
        prompt: 'What you can do now',
        body: 'One rule did all of it. You grew squares and watched a² + b² always equal c², leaned a ladder to recover a leg, freed a missing leg by subtracting, sized up a TV by its diagonal, retraced a walk as the crow flies, and tested which side-lengths make a true right triangle. Forwards it finds the long side; backwards it finds a leg — and it only ever works because of the square corner.',
        figure: { kind: 'rightTriangle', a: 3, b: 4 },
        feedback: { correct: '', hints: [], explanation: '' },
      },
    ],
  },
  {
    id: 'area-perimeter',
    order: 5,
    title: 'Area & Perimeter',
    summary: 'Lay tiles and build fences to measure the space inside and the edge around.',
    estimatedMinutes: 9,
    steps: [
      {
        id: 'l5-hook',
        type: 'concept',
        prompt: 'Two ways to measure a space',
        body: 'Say you are redoing a room. To buy carpet, you care about the space inside the floor — that is its area. To buy baseboard trim, you care about the distance around the edge — that is its perimeter. Same room, two completely different measurements. In this lesson you will measure both by hand.',
        figure: { kind: 'areaVsPerimeter', w: 5, h: 3 },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l5-area-concept',
        type: 'concept',
        prompt: 'What area really is',
        body: 'Area is just a count: how many unit squares fit inside a shape with no gaps or overlaps. A "unit square" is 1 unit on each side. Because we are covering a flat space, area is always measured in square units (like square feet or cm²). Let us literally tile a floor to feel it.',
        figure: { kind: 'unitSquares', w: 5, h: 3 },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l5-tile',
        type: 'gridShape',
        prompt: 'Tile this kitchen floor. Tap every square to lay a 1×1 tile, then count how many it took.',
        mode: 'area',
        cols: 5,
        rows: 3,
        cells: [
          [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
          [0, 1], [1, 1], [2, 1], [3, 1], [4, 1],
          [0, 2], [1, 2], [2, 2], [3, 2], [4, 2],
        ],
        feedback: {
          correct: 'You laid 15 tiles, so the area is 15 square units.',
          hints: [
            'Cover every square — leave no gaps.',
            'When the whole floor is blue, count the tiles you placed.',
          ],
          explanation:
            'The floor holds exactly 15 unit squares, so its area is 15 square units. Counting always works — but look how the tiles line up in rows and columns…',
        },
      },
      {
        id: 'l5-area-insight',
        type: 'concept',
        prompt: 'The shortcut: width × height',
        body: 'Counting one tile at a time is slow. Notice the tiles formed 3 rows of 5. Instead of counting all 15, you can multiply: 5 across × 3 up = 15. That is the rule for any rectangle: Area = width × height. The grid is why multiplication works.',
        figure: { kind: 'areaProduct', w: 5, h: 3 },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l5-area-q',
        type: 'areaBuild',
        prompt: 'An area rug is 7 units wide and 4 units tall. Roll it out to build its area.',
        width: 7,
        height: 4,
        target: 28,
        unit: ' sq',
        context: 'area rug',
        feedback: {
          correct: 'Exactly — 7 × 4 = 28 square units. No tile-counting needed.',
          hints: [
            'Area of a rectangle = width × height.',
            'Multiply 7 × 4.',
          ],
          explanation:
            'Area = width × height = 7 × 4 = 28 square units.',
        },
      },
      {
        id: 'l5-perimeter-concept',
        type: 'concept',
        prompt: 'Now the edge: perimeter',
        body: 'Perimeter is a different idea entirely. It is the total distance around the outside of a shape — the length of fence you would need to enclose a yard, or trim to frame a picture. You find it by walking the boundary and adding up the lengths. Since it is a length, perimeter is measured in plain units (not squared).',
        figure: { kind: 'perimeterWalk', w: 5, h: 3 },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l5-fence',
        type: 'gridShape',
        prompt: 'Fence this garden. Tap each edge panel around the outside, then count how many panels of fence it took.',
        mode: 'perimeter',
        cols: 5,
        rows: 3,
        cells: [
          [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
          [0, 1], [1, 1], [2, 1], [3, 1], [4, 1],
          [0, 2], [1, 2], [2, 2], [3, 2], [4, 2],
        ],
        feedback: {
          correct: 'You placed 16 fence panels, so the perimeter is 16 units.',
          hints: [
            'Only the outside edges need fencing — go all the way around.',
            'Count the panels: the top, the bottom, and both sides.',
          ],
          explanation:
            'Walking the boundary: 5 along the top + 5 along the bottom + 3 up each side = 16 units. That distance around is the perimeter.',
        },
      },
      {
        id: 'l5-perimeter-insight',
        type: 'concept',
        prompt: 'The shortcut: 2 × (width + height)',
        body: 'A rectangle has two widths (top and bottom) and two heights (left and right). So instead of adding four numbers, add one width and one height, then double it: Perimeter = 2 × (width + height). For our garden: 2 × (5 + 3) = 16. Notice area used multiplication; perimeter uses addition.',
        figure: { kind: 'perimeterSides', w: 5, h: 3 },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l5-compare',
        type: 'multipleChoice',
        prompt: 'Two dog pens each use 16 m of fencing. Pen A is 6 × 2; Pen B is 4 × 4. Which pen gives the dog more room (area)?',
        options: [
          { id: 'a', label: 'Pen B (4 × 4) — it has more area' },
          { id: 'b', label: 'Pen A (6 × 2) — it has more area' },
          { id: 'c', label: 'They have the same area' },
        ],
        correctOptionId: 'a',
        feedback: {
          correct: 'Right! Same perimeter (16 m), but B’s area is 4 × 4 = 16 vs A’s 6 × 2 = 12. Squarer shapes pack in more area.',
          hints: [
            'Both have the same perimeter — now compare their areas.',
            'Area A = 6 × 2; Area B = 4 × 4. Which is bigger?',
          ],
          explanation:
            'Perimeter and area are independent. Both pens have perimeter 16, yet Pen B holds 16 square units and Pen A only 12. For a fixed perimeter, the closer to a square, the larger the area.',
        },
      },
      {
        id: 'l5-lshape',
        type: 'gridShape',
        prompt: 'Rooms are not always rectangles. Tile this L-shaped room to find its area.',
        mode: 'area',
        cols: 4,
        rows: 4,
        cells: [
          [0, 0], [1, 0], [2, 0], [3, 0],
          [0, 1], [1, 1], [2, 1], [3, 1],
          [0, 2], [1, 2],
          [0, 3], [1, 3],
        ],
        feedback: {
          correct: 'The L-shaped room holds 12 tiles, so its area is 12 square units.',
          hints: [
            'Tile the whole L, including the narrow part.',
            'Tip: split the L into two rectangles and add their areas.',
          ],
          explanation:
            'You can split the L into a 4×2 rectangle (8) on the bottom and a 2×2 rectangle (4) on top: 8 + 4 = 12 square units. Breaking a complex shape into rectangles is a powerful trick.',
        },
      },
      {
        id: 'l5-triangle-concept',
        type: 'concept',
        prompt: 'Triangles are half a rectangle',
        body: 'Slice any rectangle along its diagonal and you get two identical right triangles. So a triangle covers exactly half the rectangle that boxes it in. That gives the rule: Area of a triangle = ½ × base × height, where the height is measured straight up from the base.',
        figure: { kind: 'rightTriangle', a: 4, b: 3 },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l5-triangle-q',
        type: 'multipleChoice',
        prompt: 'A triangular sail has a base of 10 and a height of 6. What is its area?',
        options: [
          { id: 'a', label: '60 sq units' },
          { id: 'b', label: '30 sq units' },
          { id: 'c', label: '16 sq units' },
        ],
        correctOptionId: 'b',
        feedback: {
          correct: 'Yes — ½ × base × height = ½ × 10 × 6 = 30 square units.',
          hints: [
            'The triangle is half of a 10 × 6 rectangle.',
            'Area = ½ × base × height = ½ × 10 × 6.',
          ],
          explanation:
            'A 10 × 6 rectangle has area 60; the triangle is half of it, so ½ × 10 × 6 = 30 square units.',
        },
      },
      {
        id: 'l5-wrap',
        type: 'concept',
        prompt: 'Putting it together',
        body: 'Area measures the space inside (in square units): rectangle = width × height, triangle = ½ × base × height. Perimeter measures the distance around (in plain units): rectangle = 2 × (width + height). Two shapes can share a perimeter but not an area — so always ask which one a problem is really after.',
        figure: { kind: 'areaFormulas' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
    ],
  },
  {
    id: 'transformations',
    order: 6,
    title: 'Transformations & Symmetry',
    summary: 'Slide, flip, and spin shapes by hand first — then name the moves and master symmetry.',
    estimatedMinutes: 10,
    steps: [
      {
        id: 'l6-hook',
        type: 'concept',
        prompt: 'Shapes on the move',
        body: 'Slide a chess piece across the board, glance at your reflection in a still lake, watch a Ferris wheel turn — in every case the object moves but stays exactly the same size and shape. Mathematicians call these moves transformations. Instead of defining them, let us just start moving some shapes and see what we discover.',
        figure: { kind: 'transformTrio' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l6-translate',
        type: 'slideShape',
        prompt:
          'Before we name it — just drag the boat around. Watch the vector arrow and the (Δx, Δy) readout as it moves, then dock the boat onto the dashed outline by sliding it 5 right and 3 up.',
        grid: { min: -7, max: 7 },
        shapeLabel: 'boat',
        shape: [
          { x: -5, y: -6 },
          { x: -1, y: -6 },
          { x: 0, y: -5 },
          { x: -3, y: -5 },
          { x: -3, y: -1 },
          { x: -5, y: -5 },
          { x: -6, y: -5 },
        ],
        vector: { x: 5, y: 3 },
        tolerance: 0.5,
        feedback: {
          correct: 'Nice slide — notice you moved every point of the boat the same distance in the same direction, with no turning or flipping.',
          hints: [
            'The boat keeps facing the same way — no turning, no flipping. Just slide it.',
            'Read the vector arrow: you want it to read (+5, +3) — five across, three up.',
          ],
          explanation:
            'Every point shifted by the same amount: (x, y) → (x + 5, y + 3). When your vector reads (+5, +3), every vertex of the boat lands exactly on the dashed target.',
        },
      },
      {
        id: 'l6-translate-reveal',
        type: 'concept',
        prompt: 'That move was a translation',
        body: 'You just slid every point of the boat the same distance in the same direction — that move is called a translation. We describe it with two numbers: how far across (x) and how far up or down (y). The slide you did, 5 right and 3 up, sends every point (x, y) → (x + 5, y + 3). No turning, no flipping, no resizing — just a clean slide.',
        figure: { kind: 'translation' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l6-reflect',
        type: 'mirrorShape',
        prompt:
          'Now poke at this one. The y-axis is a mirror — the still surface of a lake. Drag the boat and watch its twin move on the far side. Park the boat so its mirror image settles onto the dashed outline.',
        grid: { min: -7, max: 7 },
        shapeLabel: 'boat',
        mirror: { axis: 'y', at: 0 },
        shape: [
          { x: 1, y: -2 },
          { x: 5, y: -2 },
          { x: 6, y: -1 },
          { x: 3, y: -1 },
          { x: 3, y: 3 },
          { x: 1, y: -1 },
          { x: 0, y: -1 },
        ],
        target: [
          { x: -2, y: -1 },
          { x: -6, y: -1 },
          { x: -7, y: 0 },
          { x: -4, y: 0 },
          { x: -4, y: 4 },
          { x: -2, y: 0 },
          { x: -1, y: 0 },
        ],
        tolerance: 0.5,
        feedback: {
          correct: 'Perfect — every point of the boat landed mirrored to the same distance on the far side of the line.',
          hints: [
            'Notice the reflection always stays the same distance from the mirror as the real boat — move one and the other moves with it.',
            'Across the y-axis the x-coordinate flips sign while the height (y) stays the same. Slide the boat until its reflection lands on the dashes.',
          ],
          explanation:
            'The mirror image is always the same distance from the line as the boat. Across the y-axis that means x flips sign while y stays put: (x, y) → (−x, y). Sliding the boat right pushes its reflection left onto the dashed target.',
        },
      },
      {
        id: 'l6-reflect-reveal',
        type: 'concept',
        prompt: 'That flip was a reflection',
        body: 'You just made a mirror image across a line — that move is called a reflection, exactly like your reflection in a lake. Every point lands the same distance on the opposite side of the mirror line. When the mirror is the y-axis, left↔right flips while height stays the same: a point at (x, y) becomes (−x, y). That is the rule you felt as you dragged the boat.',
        figure: { kind: 'reflection' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l6-butterfly',
        type: 'mirrorGrid',
        prompt: 'Half of this butterfly is drawn. Before we explain symmetry, just complete it: tap cells to paint the mirror image of the wing across the dashed line.',
        instruction: 'Tap squares on the right to mirror the left wing across the dashed line.',
        cols: 8,
        rows: 6,
        axis: 'vertical',
        given: [
          [3, 5], [2, 5],
          [3, 4], [2, 4], [1, 4],
          [3, 3], [2, 3], [1, 3], [0, 3],
          [3, 2], [2, 2], [1, 2],
          [3, 1], [2, 1],
          [3, 0],
        ],
        feedback: {
          correct: 'Beautiful — the two wings are perfect mirror images. That dashed fold line down the middle is what makes the butterfly symmetric.',
          hints: [
            'Each painted square should be the same distance from the dashed line as its partner.',
            'A cell at 2 squares left of the line maps to 2 squares right of it, at the same height.',
          ],
          explanation:
            'Every cell reflects across the dashed line to the same height on the opposite side. When both halves match, the fold line through the middle is a line of symmetry.',
        },
      },
      {
        id: 'l6-symmetry-reveal',
        type: 'concept',
        prompt: 'You found a line of symmetry',
        body: 'Completing that butterfly, you reflected the whole wing across one line and the two halves matched perfectly — that fold line is a line of symmetry. A shape has one wherever you can fold it so the two halves land on top of each other, each the reflection of the other. Faces, snowflakes, and letters like A, M, T have it too. Some shapes have several lines — see how many you can find next.',
        figure: { kind: 'symmetryLines' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l6-square-q',
        type: 'multipleChoice',
        prompt: 'How many lines of symmetry does a square have?',
        figure: { kind: 'symmetryLines' },
        options: [
          { id: 'a', label: '2' },
          { id: 'b', label: '4' },
          { id: 'c', label: '1' },
          { id: 'd', label: '0' },
        ],
        correctOptionId: 'b',
        feedback: {
          correct: 'Correct — a square has 4: one vertical, one horizontal, and the two diagonals.',
          hints: [
            'Think of every fold that makes the halves match.',
            'Try vertical, horizontal, and both diagonal folds.',
          ],
          explanation:
            'A square has 4 lines of symmetry — vertical, horizontal, and two diagonals. (A rectangle that is not a square has only 2.)',
        },
      },
      {
        id: 'l6-rotate',
        type: 'spinShape',
        prompt:
          'One move left to discover. Spin the Ferris wheel — drag the car around the hub at the origin and watch the angle climb. Bring it to rest a quarter-turn (90° counterclockwise) on, matching the dashed outline.',
        grid: { min: -7, max: 7 },
        shapeLabel: 'car',
        center: { x: 0, y: 0 },
        shape: [
          { x: 3, y: -1 },
          { x: 5, y: -1 },
          { x: 5, y: 2 },
          { x: 4, y: 2 },
          { x: 4, y: 1 },
          { x: 3, y: 1 },
        ],
        targetAngle: 90,
        toleranceDegrees: 6,
        snapDegrees: 5,
        feedback: {
          correct: 'Exactly — a quarter-turn (90° counterclockwise) about the hub swept the car onto the target.',
          hints: [
            'Drag the car the short way counterclockwise — the readout shows your angle as it sweeps.',
            'A quarter of a full 360° turn is 90°. Stop when the readout reaches 90°.',
          ],
          explanation:
            'Every point turned the same angle about a fixed center, keeping its distance from the center unchanged. A 90° counterclockwise turn about the origin sends (x, y) → (−y, x), swinging the whole car onto the dashed outline.',
        },
      },
      {
        id: 'l6-rotate-reveal',
        type: 'concept',
        prompt: 'That turn was a rotation',
        body: 'You just turned the car around a fixed center point — that move is called a rotation, like a clock hand or a Ferris wheel sweeping around its hub. A quarter-turn is 90°, a half-turn is 180°. The 90° counterclockwise turn you did about the origin sends each point (x, y) → (−y, x). Every point keeps its distance from the center; only its direction changes.',
        figure: { kind: 'rotation' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l6-rotational-q',
        type: 'multipleChoice',
        prompt: 'Here is a twist on symmetry: a pinwheel with 4 identical blades looks exactly the same every quarter-turn. How many times does it match itself in one full 360° turn? (That count is its order of rotational symmetry.)',
        figure: { kind: 'rotationalSymmetry' },
        options: [
          { id: 'a', label: '4' },
          { id: 'b', label: '2' },
          { id: 'c', label: '1' },
          { id: 'd', label: '8' },
        ],
        correctOptionId: 'a',
        feedback: {
          correct: 'Right — it matches every 90°, and 360 ÷ 90 = 4 matching positions.',
          hints: [
            'How many degrees is each turn until it matches? How many fit in 360°?',
            'It matches every 90°: 360 ÷ 90 = ?',
          ],
          explanation:
            'It matches every 90° turn, and 360 ÷ 90 = 4, so its order of rotational symmetry is 4.',
        },
      },
      {
        id: 'l6-rotational-reveal',
        type: 'concept',
        prompt: 'That is rotational symmetry',
        body: 'You just counted how many times a shape repeats as it spins — that count is its order of rotational symmetry. A 4-blade pinwheel and a square have order 4; a recycling logo, order 3; the letter S matches twice (every half-turn), order 2. Same idea as a line of symmetry, but with turning instead of folding.',
        figure: { kind: 'rotationalSymmetry' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l6-wrap',
        type: 'concept',
        prompt: 'You’ve got the moves',
        body: 'You did all three before anyone named them: you slid a boat (a translation), flipped it in a lake (a reflection), and spun a Ferris wheel car (a rotation). Together these are the rigid motions — they move a shape without ever changing its size or form. And symmetry is just a shape mapping onto itself: a line of symmetry means one half mirrors the other, while rotational symmetry means it repeats as you spin it. These ideas power everything from tile patterns and logos to animation and architecture.',
        figure: { kind: 'transformTrio' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
    ],
  },
]

export const lessonById = (id: string): Lesson | undefined =>
  LESSONS.find((l) => l.id === id)

export const nextLesson = (id: string): Lesson | undefined => {
  const current = lessonById(id)
  if (!current) return undefined
  return LESSONS.find((l) => l.order === current.order + 1)
}
