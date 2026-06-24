import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { isFirebaseConfigured } from './lib/firebase'
import { AuthProvider } from './auth/AuthContext'
import { ProgressProvider } from './progress/ProgressContext'
import { SetupScreen } from './pages/SetupScreen'
import { ErrorBoundary } from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {isFirebaseConfigured ? (
        <AuthProvider>
          <ProgressProvider>
            <App />
          </ProgressProvider>
        </AuthProvider>
      ) : (
        <SetupScreen />
      )}
    </ErrorBoundary>
  </StrictMode>,
)
