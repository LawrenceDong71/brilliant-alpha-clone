import { auth } from '../../lib/firebase'
import { AI_PROXY_URL } from '../config'
import type { AiProvider, DesignProblemInput, WidgetInput, WidgetResult } from './types'

/**
 * Real provider: calls the serverless proxy (Firebase Cloud Function), which
 * holds the OpenAI key and never exposes it to the browser. We attach the
 * Firebase Auth ID token so the function can authorize the user and rate-limit.
 */
export const proxyProvider: AiProvider = {
  async designProblem(input: DesignProblemInput): Promise<unknown> {
    if (!AI_PROXY_URL) throw new Error('AI proxy is not configured (VITE_AI_PROXY_URL).')
    const user = auth.currentUser
    if (!user) throw new Error('Must be signed in to use AI features.')
    const token = await user.getIdToken()

    const res = await fetch(`${AI_PROXY_URL}/designProblem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ scenario: input.scenario, repair: input.repair, creative: input.creative }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`AI proxy error (${res.status}): ${detail.slice(0, 200)}`)
    }
    return (await res.json()) as unknown
  },

  async generateWidget(input: WidgetInput): Promise<WidgetResult> {
    if (!AI_PROXY_URL) throw new Error('AI proxy is not configured (VITE_AI_PROXY_URL).')
    const user = auth.currentUser
    if (!user) throw new Error('Must be signed in to use AI features.')
    const token = await user.getIdToken()

    const res = await fetch(`${AI_PROXY_URL}/generateWidget`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ scenario: input.scenario, model: input.model, exact: input.exact }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`AI proxy error (${res.status}): ${detail.slice(0, 200)}`)
    }
    const data = (await res.json()) as { html?: unknown }
    const html = typeof data.html === 'string' ? data.html : ''
    if (!html) throw new Error('AI proxy returned no HTML.')
    return { html }
  },
}
