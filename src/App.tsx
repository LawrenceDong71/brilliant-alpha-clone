import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './components/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { LessonPage } from './pages/LessonPage'
import { DonePage } from './pages/DonePage'
import { ProfilePage } from './pages/ProfilePage'
import { DesignProblemPage } from './pages/DesignProblemPage'
import { GeneratedLessonPage } from './pages/GeneratedLessonPage'
import { ReviewPage } from './pages/ReviewPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/design" element={<DesignProblemPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/learn/:topicId" element={<GeneratedLessonPage />} />
            <Route path="/lesson/:lessonId" element={<LessonPage />} />
            <Route path="/done/:lessonId" element={<DonePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
