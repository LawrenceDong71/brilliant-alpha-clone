export function SetupScreen() {
  return (
    <div className="auth-page">
      <div className="auth-card setup">
        <div className="auth-brand">
          <span className="brand-mark big">△</span>
          <h1>GeoSpark</h1>
          <p className="auth-tag">Almost there — connect your Firebase project.</p>
        </div>
        <ol className="setup-steps">
          <li>Create a Firebase project at <code>console.firebase.google.com</code>.</li>
          <li>Add a Web App, then enable <strong>Authentication</strong> (Email/Password + Google) and <strong>Cloud Firestore</strong>.</li>
          <li>
            Create a file named <code>.env.local</code> in the project root with your config:
            <pre>{`VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...`}</pre>
          </li>
          <li>Restart the dev server (<code>npm run dev</code>).</li>
        </ol>
      </div>
    </div>
  )
}
