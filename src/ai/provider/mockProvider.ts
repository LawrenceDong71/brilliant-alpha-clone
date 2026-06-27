import type { AiProvider, DesignProblemInput, WidgetInput, WidgetResult } from './types'

/**
 * Deterministic stand-in for the LLM. Used by the test suite and by keyless
 * local dev (when `VITE_AI_PROXY_URL` is unset). It classifies the scenario by
 * keywords and returns a VALID candidate so the verify->repair loop passes on
 * the first attempt. It is never used in the real user path.
 */
function integersIn(text: string, lo: number, hi: number): number[] {
  const found = text.match(/\d+/g) ?? []
  return found.map(Number).filter((n) => Number.isInteger(n) && n >= lo && n <= hi)
}

function areaProblem(scenario: string): unknown {
  const nums = integersIn(scenario, 2, 10)
  const width = nums[0] ?? 7
  const height = nums[1] ?? 4
  const target = width * height
  return {
    type: 'areaBuild',
    prompt: `Build the area for: ${scenario.trim() || 'a rectangle'} (${width} by ${height}).`,
    width,
    height,
    target,
    unit: ' sq units',
    context: 'rectangle',
    feedback: {
      correct: `Area = ${width} × ${height} = ${target} square units.`,
      hints: ['Area of a rectangle = width × height.', `Multiply ${width} × ${height}.`],
      explanation: `Area = width × height = ${width} × ${height} = ${target} square units.`,
    },
  }
}

function triangleProblem(scenario: string): unknown {
  const nums = integersIn(scenario, 2, 12)
  const base = nums[0] ?? 10
  const height = nums[1] ?? 6
  const target = (base * height) / 2
  return {
    type: 'triangleArea',
    prompt: `Find the area of the triangle for: ${scenario.trim() || 'a triangle'} (base ${base}, height ${height}).`,
    base,
    height,
    target,
    unit: ' sq units',
    context: 'triangle',
    feedback: {
      correct: `½ × ${base} × ${height} = ${target} square units.`,
      hints: ['A triangle fills half its bounding rectangle.', `Compute ½ × ${base} × ${height}.`],
      explanation: `Area of a triangle = ½ × base × height = ½ × ${base} × ${height} = ${target}.`,
    },
  }
}

function pythagProblem(scenario: string): unknown {
  // Fixed 6-8-10 triple keeps the problem clean and verifiable.
  return {
    type: 'pythagSolve',
    prompt: `Work out the missing length for: ${scenario.trim() || 'a right triangle'} (hypotenuse 10, one leg 8).`,
    hypotenuse: 10,
    knownLeg: 8,
    targetLeg: 6,
    context: 'right triangle',
    feedback: {
      correct: '10² − 8² = 36, and √36 = 6.',
      hints: ['Use b² = c² − a².', '100 − 64 = 36. What is √36?'],
      explanation: 'b² = c² − a² = 10² − 8² = 100 − 64 = 36, so the missing leg is √36 = 6.',
    },
  }
}

function angleProblem(scenario: string): unknown {
  return {
    type: 'angleLock',
    prompt: `Find the missing angle for: ${scenario.trim() || 'a triangle'}. Two corners are 90° and 35°.`,
    snapDegrees: 5,
    tolerance: 0,
    dials: [{ a: 90, b: 35, context: scenario.trim() || 'triangle' }],
    feedback: {
      correct: '180 − 90 − 35 = 55°.',
      hints: ['The three angles of a triangle add to 180°.', 'Compute 180 − 90 − 35.'],
      explanation: 'A triangle’s interior angles sum to 180°, so the missing one is 180 − 90 − 35 = 55°.',
    },
  }
}

function classify(scenario: string): unknown {
  const s = scenario.toLowerCase()
  if (/(ladder|diagonal|distance|hypoten|brace|cable|wire|screen|\btv\b|across)/.test(s))
    return pythagProblem(scenario)
  if (/(triangle|sail|roof|gable|slice|wedge|ramp)/.test(s)) return triangleProblem(scenario)
  if (/(angle|corner|tilt|degree|protractor|bevel)/.test(s)) return angleProblem(scenario)
  return areaProblem(scenario)
}

/**
 * Deterministic stand-in for the open-ended widget generator (AI-off / tests).
 * Returns a small but genuinely interactive, self-contained HTML document so the
 * studio still demonstrates something without a key.
 */
function mockWidget(scenario: string): string {
  const label = (scenario.trim() || 'your scenario').replace(/[<&]/g, ' ').slice(0, 80)
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;height:100%;font-family:system-ui,sans-serif;background:radial-gradient(circle at 50% 35%,#eef2fb,#d9deec);overflow:hidden}
  #c{display:block;width:100%;height:100%}
  .hud{position:fixed;left:12px;top:12px;background:#fff9;padding:8px 12px;border-radius:10px;font-size:13px;color:#333}
  </style></head><body>
  <canvas id="c"></canvas>
  <div class="hud"><b>${label}</b><br>drag the circle · radius <span id="r">60</span>px</div>
  <script>
  const cv=document.getElementById('c'),x=cv.getContext('2d');let W,H,p={x:200,y:200},rad=60,drag=false;
  function size(){W=cv.width=cv.clientWidth;H=cv.height=cv.clientHeight}
  addEventListener('resize',size);size();p={x:W/2,y:H/2};
  function draw(){x.clearRect(0,0,W,H);const g=x.createRadialGradient(p.x-rad*0.3,p.y-rad*0.3,rad*0.1,p.x,p.y,rad);
  g.addColorStop(0,'#7aa2ff');g.addColorStop(1,'#274690');x.fillStyle=g;x.beginPath();x.arc(p.x,p.y,rad,0,7);x.fill();
  document.getElementById('r').textContent=Math.round(rad);requestAnimationFrame(draw)}
  cv.addEventListener('pointerdown',e=>{drag=Math.hypot(e.offsetX-p.x,e.offsetY-p.y)<rad});
  cv.addEventListener('pointermove',e=>{if(drag){p.x=e.offsetX;p.y=e.offsetY}});
  addEventListener('pointerup',()=>drag=false);
  cv.addEventListener('wheel',e=>{rad=Math.max(20,Math.min(160,rad-e.deltaY*0.1));e.preventDefault()},{passive:false});
  draw();
  </script></body></html>`
}

export const mockProvider: AiProvider = {
  async designProblem(input: DesignProblemInput): Promise<unknown> {
    return classify(input.scenario)
  },
  async generateWidget(input: WidgetInput): Promise<WidgetResult> {
    return { html: mockWidget(input.scenario) }
  },
}
