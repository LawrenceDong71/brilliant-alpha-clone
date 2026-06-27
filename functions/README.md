# AI proxy (Cloud Functions)

A thin serverless proxy that holds the OpenAI key and turns a scenario into a
candidate geometry `Step`. The client verifies every candidate with `mathjs`
(the generate → verify → repair loop lives in `src/ai/`), so a wrong or
unsolvable problem never reaches the learner.

## Run it locally (real OpenAI, no deploy)

1. Put your **rotated** OpenAI key in `functions/.secret.local` (gitignored):

   ```
   OPENAI_API_KEY=sk-...your-key...
   ```

2. Start the Functions emulator (from the repo root):

   ```bash
   firebase emulators:start --only functions
   ```

3. Point the web app at the emulator by adding this to the repo-root `.env.local`,
   then restart `npm run dev`:

   ```
   VITE_AI_PROXY_URL=http://127.0.0.1:5001/brilliant-alpha-clone-58c31/us-central1
   ```

When `VITE_AI_PROXY_URL` is unset, the app uses a built-in deterministic generator
(no key, no emulator needed) so you can still click through the flows.

## Deploy to production

Requires the **Blaze** plan (Cloud Functions + outbound network access).

```bash
firebase functions:secrets:set OPENAI_API_KEY   # store the key in Secret Manager
npm --prefix functions run deploy
```

Then set `VITE_AI_PROXY_URL` to the deployed base URL
(`https://us-central1-brilliant-alpha-clone-58c31.cloudfunctions.net`) in your
hosting environment and rebuild the client.

## Notes

- Endpoint: `POST /designProblem` with `Authorization: Bearer <Firebase ID token>`
  and body `{ "scenario": string, "repair"?: {...} }`.
- Model is overridable via the `OPENAI_MODEL` env var (default `gpt-4o-mini`).
