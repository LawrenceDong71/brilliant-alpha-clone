/**
 * Provider abstraction so the generate->verify->repair loop is identical
 * whether we're hitting real OpenAI (through the Cloud Function proxy) or the
 * deterministic mock used by tests and keyless local dev. Swapping providers
 * (OpenAI <-> Anthropic <-> mock) never touches the loop, verifier, or UI.
 */
export interface DesignProblemInput {
  /** The learner's real-world scenario, e.g. "tiling my 12 by 9 ft kitchen". */
  scenario: string
  /**
   * Present only on a repair pass: the prior (rejected) candidate plus the
   * verifier failures, so the model can fix exactly what was wrong.
   */
  repair?: {
    previous: unknown
    failures: string[]
  }
  /**
   * Phase 3 (FR-R3c): spaced-review variant — ask the model for a fresh, creative
   * problem (varied numbers/scenarios) and bypass the cache for novelty.
   */
  creative?: boolean
}

/** Input for the open-ended widget generator. */
export interface WidgetInput {
  scenario: string
  /** Optional per-request model id from the UI picker (server allowlists it). */
  model?: string
  /**
   * When true, the server caches this scenario by exact match only (no semantic
   * dedupe). Daily Review uses it so near-identical themed variants stay distinct.
   */
  exact?: boolean
}

/** Output of the open-ended widget generator. */
export interface WidgetResult {
  /** The generated self-contained interactive HTML document. */
  html: string
}

export interface AiProvider {
  /**
   * Returns RAW, UNVALIDATED JSON for a candidate step. The caller parses and
   * verifies it — the provider is never trusted to be correct.
   */
  designProblem(input: DesignProblemInput): Promise<unknown>

  /**
   * Returns a self-contained interactive HTML document for the scenario. Optional
   * because not every provider supports it, and it is separate from the verified
   * §2.5 Design-a-Problem loop. The output must be rendered in a sandboxed iframe.
   */
  generateWidget?(input: WidgetInput): Promise<WidgetResult>
}
