/**
 * AI feature configuration + on/off gating, mirroring `isFirebaseConfigured`
 * in `src/lib/firebase.ts`. The LLM key never lives here (or anywhere in the
 * client); we only know the proxy URL. When it's unset, AI is off and callers
 * fall back to deterministic behavior.
 */
export const AI_PROXY_URL: string | undefined = import.meta.env.VITE_AI_PROXY_URL

export const isAiConfigured = Boolean(AI_PROXY_URL)

/**
 * Max generate -> verify -> repair attempts before we give up and fall back.
 * (PHASE2-AI-PRD.md §2.5: the loop only "completes" when verification is green;
 * on exhaustion we never ship failing content.)
 */
export const MAX_REPAIRS = 3
