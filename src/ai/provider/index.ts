import { isAiConfigured } from '../config'
import { mockProvider } from './mockProvider'
import { proxyProvider } from './proxyProvider'
import type { AiProvider } from './types'

export type { AiProvider, DesignProblemInput } from './types'
export { mockProvider } from './mockProvider'

/**
 * The real proxy provider when AI is configured; otherwise the deterministic
 * mock so keyless local dev still works (AI-off fallback per the PRD).
 */
export function getProvider(): AiProvider {
  return isAiConfigured ? proxyProvider : mockProvider
}
