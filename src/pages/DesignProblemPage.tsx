import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProvider } from '../ai/provider'
import { extractHtml, looksLikeHtmlDocument } from '../ai/widget/extractHtml'

const EXAMPLES = [
  'A triangular sail that is 10 wide and 6 tall',
  'A basketball with diameter 10 inches — show its volume',
  'A kitchen floor I want to tile, 12 by 9 ft',
  'A Ferris wheel turning, radius 8 m',
  'A 10 m ladder leaning against a wall',
]

type State =
  | { phase: 'idle' }
  | { phase: 'generating' }
  | { phase: 'ready'; html: string }
  | { phase: 'failed'; reason: string }

/**
 * Open-ended generator: the AI writes a bespoke, interactive HTML visualization
 * for any scenario; we render it inside a SANDBOXED iframe (scripts only, no
 * same-origin) so generated code can't reach the app, Firebase, cookies, or storage.
 */
export function DesignProblemPage() {
  const navigate = useNavigate()
  const [scenario, setScenario] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [state, setState] = useState<State>({ phase: 'idle' })

  // Live elapsed-time counter so a long generation never looks frozen.
  useEffect(() => {
    if (state.phase !== 'generating') return
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [state.phase])

  const generate = async (text: string) => {
    const s = text.trim()
    if (!s) return
    setScenario(s)
    setElapsed(0)
    setState({ phase: 'generating' })
    try {
      const provider = getProvider()
      if (!provider.generateWidget) {
        setState({ phase: 'failed', reason: 'This provider does not support open-ended generation.' })
        return
      }
      // Client-side timeout so the UI can't hang forever (the function has its own
      // server timeout too).
      const timeoutMs = 150_000
      const result = await Promise.race([
        provider.generateWidget({ scenario: s }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Timed out after ${timeoutMs / 1000}s. Try a faster model.`)),
            timeoutMs,
          ),
        ),
      ])
      const html = extractHtml(result.html)
      if (!looksLikeHtmlDocument(html)) {
        setState({
          phase: 'failed',
          reason: 'The model didn’t return a renderable interactive. Try again or rephrase the scenario.',
        })
        return
      }
      setState({ phase: 'ready', html })
    } catch (e) {
      setState({ phase: 'failed', reason: e instanceof Error ? e.message : 'Something went wrong.' })
    }
  }

  return (
    <div className="design-page">
      <button className="link-btn" onClick={() => navigate('/')}>
        ← Path
      </button>

      <header className="design-head">
        <h1>Design a Problem</h1>
        <p className="design-sub">
          Describe any real-world scenario and the AI invents a bespoke, interactive visualization on
          the fly. Runs sandboxed in your browser.
        </p>
      </header>

      {state.phase !== 'ready' && (
        <div className="design-form">
          <textarea
            className="design-input"
            placeholder="e.g. A spinning basketball with diameter 10"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            rows={3}
          />
          <div className="design-examples">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" className="chip" onClick={() => void generate(ex)}>
                {ex}
              </button>
            ))}
          </div>
          <button
            className="btn primary grow"
            disabled={state.phase === 'generating' || !scenario.trim()}
            onClick={() => void generate(scenario)}
          >
            {state.phase === 'generating' ? `Generating… ${elapsed}s` : 'Generate widget'}
          </button>
          {state.phase === 'failed' && (
            <>
              <div className="feedback incorrect">
                <strong>Couldn’t generate.</strong> {state.reason}
              </div>
              <button className="btn grow" disabled={!scenario.trim()} onClick={() => void generate(scenario)}>
                Try again
              </button>
            </>
          )}
        </div>
      )}

      {state.phase === 'ready' && (
        <div className="design-result studio-result-wide">
          <div className="design-meta">
            Generated for <strong>{scenario}</strong>
          </div>
          <iframe
            className="widget-frame"
            title="AI-generated interactive widget"
            sandbox="allow-scripts"
            srcDoc={state.html}
          />
          <div className="footer-row">
            <button className="btn primary grow" onClick={() => void generate(scenario)}>
              Regenerate
            </button>
            <button className="btn ghost grow" onClick={() => setState({ phase: 'idle' })}>
              New scenario
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
