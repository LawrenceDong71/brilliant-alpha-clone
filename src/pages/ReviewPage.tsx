import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../progress/ProgressContext'
import { CONCEPTS, conceptName } from '../content/concepts'
import { getProvider } from '../ai/provider'
import { extractHtml, looksLikeHtmlDocument } from '../ai/widget/extractHtml'
import type { ConceptId } from '../content/types'

/** Review covers ALL concepts, ordered weakest-first; capped for a short session. */
const SESSION_MAX = 6

/** Per-concept seed describing what to practice — the LLM invents the rest. */
const REVIEW_PROMPTS: Record<ConceptId, string> = {
  'points-lines': 'points, lines, segments, and rays (naming them, telling them apart, locating them)',
  angles: 'measuring and reasoning about angles (acute / right / obtuse and angle relationships)',
  triangles: 'triangle types and the angle sum — the three interior angles add to 180°',
  pythagorean: 'the Pythagorean theorem — finding a missing side of a right triangle (a² + b² = c²)',
  'area-perimeter': 'area and perimeter of rectangles and composite shapes',
  transformations: 'transformations — translations, reflections, rotations, and symmetry',
}

/**
 * Distinct creative "lenses" that reframe each review activity. Picking a
 * different one on repeat keeps reviews fresh (so the learner recalls the method,
 * not a memorized answer); each (concept, lens) pair is still cached and reused
 * across learners because the server keys it by exact match (see `exact` below).
 */
const LENSES = [
  'a space / astronomy setting (planets, satellites, rockets, orbits)',
  'a sports setting (courts, fields, tracks, equipment)',
  'a cooking / kitchen setting (pizzas, cakes, cutting boards, recipes)',
  'an architecture / construction setting (buildings, bridges, ramps, scaffolds)',
  'a nature / outdoors setting (gardens, mountains, rivers, trees)',
  'a video-game / arcade setting (levels, sprites, power-ups, maps)',
  'an art / design setting (mosaics, stained glass, tile patterns, murals)',
  'a travel / navigation setting (routes, landmarks, compasses, maps)',
]

/**
 * Ask the Invent Engine for a brand-new, creative interactive activity for a
 * concept, reframed through a randomly chosen lens so repeats differ. Full
 * creative latitude; explicitly must NOT reuse a textbook setup.
 */
async function loadWidget(concept: ConceptId): Promise<string | null> {
  const provider = getProvider()
  if (!provider.generateWidget) return null
  const lens = LENSES[Math.floor(Math.random() * LENSES.length)]
  const scenario =
    `Create a genuinely original, creative interactive mini-activity that helps a learner ` +
    `PRACTICE this geometry concept: ${REVIEW_PROMPTS[concept]}. Set the whole activity in ${lens} ` +
    `and choose fresh, non-obvious numbers. Invent a surprising scenario and a fresh visual — do NOT ` +
    `use a generic or textbook setup.` +
    `\n\nIT MUST ACTUALLY WORK — these rules override creativity:\n` +
    `- Keep it SIMPLE: exactly ONE interaction. Do NOT ask the learner to do several things at once ` +
    `(e.g. "make a segment, a ray, AND a line"). Choose one small, clear task.\n` +
    `- If the learner is told to DRAG something, you MUST render those draggable items as large, ` +
    `clearly visible filled circles (radius >= 12px) at sensible starting positions ON LOAD, each ` +
    `already wired to pointer events (pointerdown/pointermove/pointerup) so they drag right away. ` +
    `The same goes for any handle, slider, or button you mention.\n` +
    `- Write the on-screen instructions LAST, and describe ONLY elements you actually drew and wired. ` +
    `NEVER mention a point, handle, or button that isn't visible and interactive.\n` +
    `- Everything must be visible WITHOUT scrolling, and give clear on-screen feedback when the ` +
    `learner gets it right.\n` +
    `- Use ONLY inline Canvas2D or SVG with plain vanilla JavaScript — no three.js, modules, or any ` +
    `external/network resource — and it must run with NO JavaScript errors.\n` +
    `- Before finishing, re-read your own instructions: every interactive element you reference must ` +
    `exist in the code, be on-screen at load, and respond to input. If not, fix it or remove the mention.`
  try {
    // exact:true → the server keys this themed variant on its own (the semantic
    // cache would otherwise collapse all lenses for a concept into one widget).
    const res = await provider.generateWidget({ scenario, exact: true })
    const html = extractHtml(res.html)
    return looksLikeHtmlDocument(html) ? html : null
  } catch {
    return null
  }
}

export function ReviewPage() {
  const navigate = useNavigate()
  const { conceptMastery, recordReview } = useProgress()
  const [session, setSession] = useState<ConceptId[] | null>(null)
  const [index, setIndex] = useState(0)
  /** Generated widget HTML by session index (null = generation failed → skip). */
  const [items, setItems] = useState<Record<number, string | null>>({})
  const [gotItCount, setGotItCount] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const loadingRef = useRef<Set<number>>(new Set())

  // Build the session once: ALL concepts, weakest (lowest mastery) first.
  useEffect(() => {
    const ids = CONCEPTS.map((c) => c.id)
    ids.sort((a, b) => (conceptMastery[a]?.level ?? 0) - (conceptMastery[b]?.level ?? 0))
    setSession(ids.slice(0, SESSION_MAX))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Generate current + prefetch next (widget generation is slow).
  useEffect(() => {
    if (!session) return
    const load = (i: number) => {
      if (i < 0 || i >= session.length || i in items || loadingRef.current.has(i)) return
      loadingRef.current.add(i)
      void loadWidget(session[i]).then((html) => {
        setItems((prev) => ({ ...prev, [i]: html }))
        loadingRef.current.delete(i)
      })
    }
    load(index)
    load(index + 1)
  }, [session, index, items])

  // Skip an item whose generation failed.
  useEffect(() => {
    if (session && index < session.length && items[index] === null) setIndex((i) => i + 1)
  }, [session, index, items])

  const current = session && index < session.length ? items[index] : undefined

  // Elapsed counter while the current activity is still generating.
  useEffect(() => {
    setElapsed(0)
    if (current !== undefined || !session || index >= session.length) return
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [current, session, index])

  // Self-rating drives spacing + mastery (the activities are open-ended/ungraded).
  const rate = useCallback(
    (gotIt: boolean) => {
      const concept = session?.[index]
      if (concept) void recordReview(concept, { firstTry: gotIt, correct: gotIt })
      if (gotIt) setGotItCount((n) => n + 1)
      setIndex((i) => i + 1)
    },
    [session, index, recordReview],
  )

  // Toss a broken/unsatisfying activity and invent a new one for the same concept.
  const regenerate = useCallback(() => {
    setItems((prev) => {
      const cp = { ...prev }
      delete cp[index]
      return cp
    })
    loadingRef.current.delete(index)
  }, [index])

  // Move on without rating (e.g. a dud that didn't render) — no mastery change.
  const skip = useCallback(() => setIndex((i) => i + 1), [])

  const total = session?.length ?? 0

  return (
    <div className="design-page">
      <button className="link-btn" onClick={() => navigate('/')}>
        ← Path
      </button>

      <header className="design-head">
        <h1>Daily Review</h1>
        <p className="design-sub">
          A short, mixed review of every concept — weakest first — so you recall the idea, not a
          memorized answer. Tell us how you did to schedule your next review.
        </p>
      </header>

      {!session && <p className="design-note">Building your review…</p>}

      {session && session.length > 0 && index < session.length && (
        <div>
          <div className="design-meta">
            Item {index + 1} / {total} · <strong>{conceptName(session[index])}</strong>
          </div>
          {current ? (
            <div className="design-result studio-result-wide">
              <iframe
                className="widget-frame"
                title="Review activity"
                sandbox="allow-scripts"
                srcDoc={current}
              />
              <div className="review-rate">
                <p className="review-rate-q">How did that go?</p>
                <div className="footer-row">
                  <button className="btn primary grow" onClick={() => rate(true)}>
                    ✅ Got it
                  </button>
                  <button className="btn ghost grow" onClick={() => rate(false)}>
                    🔁 Need more practice
                  </button>
                </div>
                <p className="review-fallback">
                  Activity not working?{' '}
                  <button className="link-btn" onClick={regenerate}>
                    Regenerate
                  </button>{' '}
                  ·{' '}
                  <button className="link-btn" onClick={skip}>
                    Skip
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <p className="design-note">Loading… {elapsed}s</p>
          )}
        </div>
      )}

      {session && session.length > 0 && index >= session.length && (
        <div className="design-result">
          <h2>Review complete 🎯</h2>
          <p>
            You felt solid on <strong>{gotItCount}</strong> of <strong>{total}</strong>. Concepts you
            nailed move further out; ones you flagged for practice will come back sooner.
          </p>
          <button className="btn primary grow" onClick={() => navigate('/')}>
            Back to Path
          </button>
        </div>
      )}
    </div>
  )
}
