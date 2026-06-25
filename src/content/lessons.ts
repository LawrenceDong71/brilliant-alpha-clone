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
        prompt: 'Tap the stars one by one to link them into the constellation Cassiopeia — connect them in any order you like.',
        instruction: 'Tap each star to connect it to the last. Any order works.',
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
            'Tap any star to begin, then keep tapping the others until all five are linked.',
            'Want a different shape? Hit "Start over" and connect them in another order.',
          ],
          explanation:
            'Each star is a point — a single location. Connecting two points with a straight path makes a segment. By linking all five stars you built a constellation out of segments — and the order you chose was up to you.',
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
        type: 'clipSegment',
        prompt: 'This pencil rests on a line that runs forever both ways. Drag the two stops to clip the line down to just the pencil — that makes a segment.',
        instruction: 'Drag each stop to a pencil end so the lit part covers only the pencil.',
        min: 0,
        max: 10,
        startTarget: 3,
        endTarget: 7,
        tolerance: 0.4,
        context: 'pencil',
        feedback: {
          correct: 'That is a segment! Two endpoints and a fixed length — exactly like the pencil.',
          hints: [
            'A segment has two endpoints. Slide each stop to one end of the pencil.',
            'Cover the pencil exactly: left stop at the eraser, right stop at the tip.',
          ],
          explanation:
            'Clipping the endless line at two points leaves a finite piece with two endpoints and a measurable length — that is a segment. Without the stops the line runs forever (no endpoints); with one stop it would be a ray.',
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
          "Capstone — Battleship! Place your fleet, then hunt the enemy's hidden ships one shot at a time. Sink them all to win.",
        size: 8,
        fleet: [2, 3, 4],
        feedback: {
          correct:
            'Fleet sunk and every concept check nailed! A shot was a point, a ship was a segment, and a line never ends.',
          hints: [
            'Sink every enemy ship first — the concept checks unlock once you win.',
            'Then answer each concept check: think about endpoints (0, 1, or 2) and whether it ever ends.',
          ],
          explanation:
            'Points locate; segments measure. Each shot named one point (x, y); each ship was a segment with two endpoints and a countable length — which is exactly why it could be sunk. A ray (one endpoint) or a line (no endpoints) runs forever, so it never could.',
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
        prompt: 'Drag the blue ray to build a right angle.',
        targetDegrees: 90,
        toleranceDegrees: 0,
        startDegrees: 25,
        feedback: {
          correct: 'Perfect right angle! That clean square corner is the 90° you find on books, walls, and tiles.',
          hints: [
            'A right angle is a perfect "L" shape — a quarter turn.',
            'Make a perfect square corner — a quarter turn — and watch the live readout.',
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
        type: 'clockAngles',
        prompt:
          'A clock is secretly a protractor — each hour mark is 30°. Drag the two hands to build each angle. (The hands snap to the hour marks.)',
        targets: [90, 30, 120],
        feedback: {
          correct:
            'Nicely done — you built a right angle (90°), an acute angle (30°), and an obtuse angle (120°), straight from the hour marks.',
          hints: [
            'Each hour mark is 30°. Count the hours between the two hands — 3 hours is 90°.',
            'For 30° put the hands one hour apart; for 120°, four hours apart.',
          ],
          explanation:
            'A full clock is 360°, divided into 12 hours, so each hour mark is 30°. Counting hour marks between the hands turns the clock into a protractor: 90° is a right angle, 30° is acute, and 120° is obtuse.',
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
      {
        id: 'l2-rapidfire',
        type: 'rapidFire',
        prompt: 'Rapid fire! A ball and a hoop flash up — beat the clock and tap the angle of the shot that sinks it. Trust your eye.',
        rounds: 7,
        secondsPerRound: 5,
        feedback: {
          correct: 'Sharp eye! You read acute, right, and obtuse shots on instinct — exactly the angle sense this whole lesson was building.',
          hints: [
            'Compare the shot to flat (0°), straight up (90°), and leaning back past 90° — is it acute, a right angle, or obtuse?',
            'A far, low hoop needs a small angle; straight overhead is 90°; a hoop up-and-behind the ball leans past 90° (obtuse).',
          ],
          explanation:
            'Eyeballing an angle is the skill you practiced all lesson: below 90° is acute (shallow), exactly 90° is a right angle (straight up), and between 90° and 180° is obtuse (leaning back over the ball).',
        },
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
        id: 'l3-crack',
        type: 'angleLock',
        prompt: 'Crack the angle safe. Each tumbler hides a triangle with one corner rubbed out — only the right missing angle will turn it. Work out the third corner, spin the dial to it, and lock each tumbler to pop the safe. There is no gap to eyeball this time: you have to do the math.',
        snapDegrees: 5,
        tolerance: 0,
        dials: [
          { a: 90, b: 35, context: 'ramp brace' },
          { a: 60, b: 70, context: 'roof truss' },
          { a: 105, b: 40, context: 'kite panel' },
        ],
        feedback: {
          correct: 'Safe cracked! 90+35→55, 60+70→50, 105+40→35 — every missing corner was just 180° minus the two you were given.',
          hints: [
            'For each dial, add the two known corners, then subtract from 180°.',
            'Ramp brace: 90 + 35 = 125, so the third is 180 − 125 = 55°. Dial it and lock it.',
            'The dial snaps in 5° steps, and every answer lands on one — so trust your arithmetic.',
          ],
          explanation:
            'The three interior angles of any triangle add to 180°, so a missing corner is always 180° minus the other two: 180 − 125 = 55°, 180 − 130 = 50°, and 180 − 145 = 35°.',
        },
      },
      {
        id: 'l3-sort',
        type: 'sortBins',
        prompt: 'Triangles also come in three “flavors.” Each card lists a triangle’s three angles — drop it into the bin you think it belongs in and learn from the feedback.',
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
        id: 'l3-rescue',
        type: 'trussRescue',
        prompt: 'Storm damage! Repair the truss bridge before the convoy crosses. For each panel, work out the missing corner, fit the right bracket, then certify the triangle’s type.',
        panels: [
          { a: 90, b: 35, context: 'Ramp brace' },
          { a: 60, b: 70, context: 'Roof truss' },
          { a: 105, b: 40, context: 'Kite spar', spec: 'Final span — find the corner, then sign off its type.' },
        ],
        feedback: {
          correct: 'Bridge secured! Every panel: the missing corner is 180° minus the two you knew, and its largest angle named the type.',
          hints: [
            'For each panel, the third corner is 180° − (the two shown angles).',
            'Then name it by its largest angle: all under 90° → acute, exactly 90° → right, over 90° → obtuse.',
          ],
          explanation:
            'Each triangle’s interior angles sum to 180°, so the missing corner is 180° minus the two given. The largest of the three angles decides the type: acute (all < 90°), right (one = 90°), or obtuse (one > 90°).',
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
        type: 'pythagSolve',
        prompt: 'A 10 m fire ladder reaches a window 8 m up — the ladder, wall, and ground form a right triangle. How far from the wall is the base? Work it out step by step: drop the right number into each blank.',
        hypotenuse: 10,
        knownLeg: 8,
        targetLeg: 6,
        context: 'fire ladder',
        feedback: {
          correct: 'Worked it out! 10² − 8² = 100 − 64 = 36, and √36 = 6, so the base sits 6 m from the wall.',
          hints: [
            'Square each known side first: the ladder is the hypotenuse (10²), the wall is a leg (8²).',
            'Reverse the theorem: b² = c² − a² = 100 − 64 = 36. The base is √36 — not 100 − 64 left as is, and not 10 − 8.',
          ],
          explanation:
            'The ladder (10) is the hypotenuse and the wall (8) is a known leg, so b² = c² − a² = 10² − 8² = 100 − 64 = 36, giving a base of √36 = 6 m. You square the hypotenuse, subtract the known leg squared, then take the square root to free the missing leg.',
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
        prompt: 'A triangle is right only if a² + b² = c² for its sides. These numbers are big and ugly on purpose — go ahead and use a calculator — so this really tests whether you can apply the theorem. Square the two shorter sides, add them, and check against the longest side squared. Then sort each set.',
        bins: [
          { id: 'right', label: 'Right triangle' },
          { id: 'not', label: 'Not a right triangle' },
        ],
        items: [
          { id: 's1', label: '20, 21, 29', correctBin: 'right' },
          { id: 's2', label: '14, 22, 26', correctBin: 'not' },
          { id: 's3', label: '16, 30, 34', correctBin: 'right' },
          { id: 's4', label: '18, 24, 31', correctBin: 'not' },
          { id: 's5', label: '33, 56, 65', correctBin: 'right' },
          { id: 's6', label: '20, 30, 36', correctBin: 'not' },
        ],
        feedback: {
          correct: 'Great testing! Square the two shorter sides, add them, and check against the square of the longest side — a calculator makes the big numbers painless.',
          hints: [
            'Take the longest number as c. Does (shorter)² + (shorter)² equal c²? Use a calculator for the squares.',
            'Example: 20, 21, 29 → 400 + 441 = 841 = 29². That is a right triangle.',
          ],
          explanation:
            'It is a right triangle exactly when the two smaller sides squared add up to the largest squared. 20,21,29 (400+441=841=29² ✓), 16,30,34 (256+900=1156=34² ✓), and 33,56,65 (1089+3136=4225=65² ✓) pass. The others fall just short: 14,22,26 (196+484=680≠676), 18,24,31 (324+576=900≠961), and 20,30,36 (400+900=1300≠1296) — close, but not right triangles.',
        },
      },
      {
        id: 'l4-wrap',
        type: 'concept',
        prompt: 'What you can do now',
        body: 'One rule did all of it. You grew squares and watched a² + b² always equal c², leaned a ladder to recover a leg, freed a missing leg by subtracting, sized up a TV by its diagonal, retraced a walk as the crow flies, and tested which side-lengths make a true right triangle. Forwards it finds the long side; backwards it finds a leg — and it only ever works because of the square corner. One last job before you go: the workshop.',
        figure: { kind: 'rightTriangle', a: 3, b: 4 },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l4-brace',
        type: 'braceIt',
        prompt: 'Capstone — Brace It! Each wobbly frame needs one diagonal brace to lock it square. The frame’s two sides are stamped on it, but the brace length is up to you to work out. Cut each board to the right length and fit it to steady every frame.',
        frames: [
          { w: 3, h: 4 },
          { w: 6, h: 8 },
          { w: 5, h: 12 },
          { w: 8, h: 15 },
        ],
        unit: 'ft',
        feedback: {
          correct: 'Every frame locked square! A diagonal brace turns a wobbly rectangle into two rigid right triangles — and its length is always the hypotenuse, c = √(w² + h²).',
          hints: [
            'The brace is the diagonal of the frame — the hypotenuse of a right triangle with legs equal to the two sides.',
            'Square the two sides, add them, take the square root: a 3×4 frame needs a √(9+16) = 5 ft brace.',
            'The frame is not drawn to scale, so you can’t measure it — you have to compute the brace.',
          ],
          explanation:
            'A rectangular frame racks because its corners can flex. One diagonal brace splits it into two right triangles that can’t change shape, locking it square. That brace spans corner to corner, so its length is the hypotenuse: c = √(w² + h²). For example a 5×12 frame needs √(25+144) = 13 ft.',
        },
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
        body: 'Say you are redoing a room. To buy carpet, you care about the space inside the floor — that is its area. To buy baseboard trim, you care about the distance around the edge — that is its perimeter. Same room, two completely different measurements. You already have a feel for both — so before any formulas, let us just measure one by hand.',
        figure: { kind: 'areaVsPerimeter', w: 5, h: 3 },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l5-tile',
        type: 'gridShape',
        prompt: 'Start with the space inside — no formula yet. Cover this kitchen floor with 1×1 tiles: tap every square, then count how many it took.',
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
        prompt: 'What you just measured was area',
        body: 'What you just did has a name. By covering the floor with unit squares — 1×1 tiles, no gaps, no overlaps — and counting them, you measured its area: the amount of space inside. Because we are covering a flat space, area is counted in square units (square feet, cm², and so on). And notice the tiles fell into 3 rows of 5, so you never have to count one at a time — just multiply: 5 across × 3 up = 15. For any rectangle, Area = width × height.',
        figure: { kind: 'areaProduct', w: 5, h: 3 },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l5-area-q',
        type: 'areaBuild',
        prompt: 'Now use that shortcut. An area rug is 7 wide and 4 tall — roll it out to build its area, no counting one square at a time.',
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
        id: 'l5-fence',
        type: 'gridShape',
        prompt: 'You measured the space inside. Now measure the edge around it — still no formula. Fence this garden: tap each panel around the outside, then count how many panels it took.',
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
        prompt: 'What you just walked was perimeter',
        body: 'What you just walked around has a name: the perimeter — the total length of the boundary, like the fence around a yard or the trim around a picture. Because it is a length, perimeter is measured in plain units, not squared. You added all four sides to reach 16, but a rectangle has two equal widths and two equal heights, so add one of each and double it: 2 × (5 + 3) = 16. Area multiplies; perimeter adds.',
        figure: { kind: 'perimeterSides', w: 5, h: 3 },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l5-pen',
        type: 'penShape',
        prompt: 'Your dog needs room to run. You have exactly 16 m of fence — the same as your neighbor’s skinny 6 × 2 pen. Drag a corner to reshape your pen (the fence length never changes) and give the dog the most room you can.',
        perimeter: 16,
        startWidth: 6,
        rival: { width: 6, height: 2, label: 'Neighbor' },
        unit: 'm',
        feedback: {
          correct: 'A 4 × 4 square! Same 16 m of fence, but now 16 m² of room — beating the neighbor’s 12 m². For a fixed perimeter, the squarer the rectangle, the more area it holds.',
          hints: [
            'The fence (perimeter) is stuck at 16 m — only the shape changes. Watch the area as you reshape.',
            'Long-and-thin wastes space. Try making the sides more even.',
            'A 4 × 4 square uses the same 16 m of fence but holds the most room: 16 m².',
          ],
          explanation:
            'Perimeter and area are independent. With 16 m of fence the width and height must add to 8, and area = width × height is largest when they are equal — a 4 × 4 square gives 16 m², while the 6 × 2 pen gives only 12 m².',
        },
      },
      {
        id: 'l5-lshape',
        type: 'decomposeArea',
        prompt: 'Rooms are not always rectangles — and width × height alone will not crack this L. Drag the divider to split it into two rectangles you already know how to measure, then count each one, add them, and enter the total area.',
        cols: 4,
        rows: 4,
        cells: [
          [0, 0], [1, 0], [2, 0], [3, 0],
          [0, 1], [1, 1], [2, 1], [3, 1],
          [0, 2], [1, 2],
          [0, 3], [1, 3],
        ],
        total: 12,
        feedback: {
          correct: 'Two rectangles, added up: 8 + 4 = 12 square units.',
          hints: [
            'Drag the divider so each side becomes a full rectangle.',
            'Split it into a 4×2 and a 2×2, then add their areas.',
          ],
          explanation:
            'Breaking a complex shape into rectangles you already know how to measure is the key trick: a 4×2 (8) plus a 2×2 (4) makes 12 square units. (This L splits both ways — a vertical or a horizontal cut both work.)',
        },
      },
      {
        id: 'l5-triangle-q',
        type: 'triangleArea',
        prompt: 'One more shape to crack: a triangular sail. You cannot tile it neatly — so box it inside a rectangle and figure out what fraction of that rectangle it fills. Build the sail’s area.',
        base: 10,
        height: 6,
        target: 30,
        context: 'sail',
        unit: ' sq units',
        feedback: {
          correct: 'You boxed the sail in — and it filled exactly half. ½ × 10 × 6 = 30 square units.',
          hints: [
            'Drag the corner so the rectangle just hugs the triangle: 10 wide, 6 tall.',
            'The triangle fills half the rectangle: ½ × 10 × 6.',
          ],
          explanation:
            'A 10 × 6 rectangle has area 60; the triangle is exactly half of it, so ½ × 10 × 6 = 30 square units.',
        },
      },
      {
        id: 'l5-triangle-concept',
        type: 'concept',
        prompt: 'A triangle is half a rectangle',
        body: 'That is what you just found: the sail filled exactly half of the rectangle that boxed it in. Slice any rectangle along its diagonal and you get two identical triangles, so a triangle always covers half its bounding rectangle. That gives the rule: Area of a triangle = ½ × base × height, where the height is measured straight up from the base. For the sail, ½ × 10 × 6 = 30.',
        figure: { kind: 'rightTriangle', a: 4, b: 3 },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l5-wrap',
        type: 'concept',
        prompt: 'Putting it together',
        body: 'Three tools, all discovered by hand: area is the space inside in square units (rectangle = width × height, triangle = ½ × base × height), and perimeter is the distance around in plain units (rectangle = 2 × (width + height)). Two shapes can share a perimeter yet not an area — so always ask which one the problem is really after. One last challenge: a rapid-fire round to make decomposition automatic.',
        figure: { kind: 'areaFormulas' },
        feedback: { correct: '', hints: [], explanation: '' },
      },
      {
        id: 'l5-split-sprint',
        type: 'splitSprint',
        prompt: 'Split Sprint! L-shaped slabs roll down the belt one by one. For each, drag the cutter (flip it ⟷ or ↕) to slice the slab into two clean rectangles, then tap Split before it rolls off. Clear the belt!',
        secondsPerShape: 8,
        passRatio: 0.6,
        shapes: [
          // Small corner L
          {
            cols: 3,
            rows: 3,
            cells: [
              [0, 0], [1, 0], [2, 0],
              [0, 1],
              [0, 2],
            ],
          },
          // Wide-footed L
          {
            cols: 4,
            rows: 3,
            cells: [
              [0, 0], [1, 0], [2, 0], [3, 0],
              [0, 1],
              [0, 2],
            ],
          },
          // Notch in the top-right
          {
            cols: 3,
            rows: 3,
            cells: [
              [0, 0], [1, 0], [2, 0],
              [0, 1], [1, 1], [2, 1],
              [0, 2], [1, 2],
            ],
          },
          // Chunky L (splits either way)
          {
            cols: 4,
            rows: 4,
            cells: [
              [0, 0], [1, 0], [2, 0], [3, 0],
              [0, 1], [1, 1], [2, 1], [3, 1],
              [0, 2], [1, 2],
              [0, 3], [1, 3],
            ],
          },
          // Staircase — only one orientation works
          {
            cols: 4,
            rows: 2,
            cells: [
              [0, 0], [1, 0], [2, 0],
              [1, 1], [2, 1], [3, 1],
            ],
          },
          // Tall L with a top cap
          {
            cols: 3,
            rows: 4,
            cells: [
              [2, 0],
              [2, 1],
              [2, 2],
              [0, 3], [1, 3], [2, 3],
            ],
          },
        ],
        feedback: {
          correct: 'Belt cleared! You sliced every slab into two rectangles — decomposition on reflex.',
          hints: [
            'Aim the cutter at the slab’s inside corner — that is where it breaks into two rectangles.',
            'If a vertical cut leaves an L on one side, flip the cutter to ↕ (or ⟷) and try the other direction.',
            'The Split button only lights up when both pieces are full rectangles. Drag until it glows, then tap it.',
          ],
          explanation:
            'Any L-shape (or staircase) is just two rectangles stuck together. One straight cut through the inside corner separates them, and their areas add up to the whole — for example a 4×2 piece (8) plus a 2×2 piece (4) makes 12. Some slabs only break apart one way, so flip the cutter if the first direction leaves a non-rectangle.',
        },
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
          'Rotations, for real this time. Spin the Ferris wheel through three turns in a row — first a quarter-turn (90° counterclockwise), then a half-turn (180°), then a three-quarter-turn (270°). Submit each one. The first shows a dashed target to guide you; after that you are on your own.',
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
        targets: [90, 180, 270],
        toleranceDegrees: 8,
        snapDegrees: 5,
        feedback: {
          correct: 'Nailed all three — a quarter-turn (90°), a half-turn (180°), and a three-quarter-turn (270°) about the same hub.',
          hints: [
            'Quarter = 90°, half = 180°, three-quarter = 270° — all counterclockwise from the car’s start.',
            'Drag the car around the hub, then press “Submit rotation” for each turn.',
          ],
          explanation:
            'Every point turns the same angle about a fixed center, keeping its distance from the center unchanged. A 90° turn about the origin sends (x, y) → (−y, x); 180° sends it to (−x, −y); 270° to (y, −x).',
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
        id: 'l6-rapid',
        type: 'symmetryRapid',
        prompt: 'Rapid fire! Shapes flash by one at a time — tap how many lines of symmetry each has before the timer runs out. Keep your streak alive.',
        secondsPerShape: 6,
        rounds: 8,
        feedback: {
          correct: 'Lightning round done — you can spot lines of symmetry on sight now.',
          hints: [
            'A line of symmetry is a fold that makes the two halves match exactly.',
            'A regular shape with n sides has n lines; a rectangle has 2, an isosceles triangle 1, a scalene triangle or parallelogram 0.',
          ],
          explanation:
            'A line of symmetry maps a shape onto itself by folding. Regular polygons have as many lines as sides (triangle 3, square 4, pentagon 5, hexagon 6); a rectangle has 2, an isosceles triangle 1, and a scalene triangle or parallelogram has none.',
        },
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
