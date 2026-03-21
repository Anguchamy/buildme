import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore, applyTheme } from '@/store/themeStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import DashboardLayout from '@/components/layout/DashboardLayout'

// Public pages
const Landing = lazy(() => import('@/pages/Landing'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))

// Protected pages
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const GridPlanner = lazy(() => import('@/pages/GridPlanner'))
const ContentCalendar = lazy(() => import('@/pages/ContentCalendar'))
const PostComposer = lazy(() => import('@/pages/PostComposer'))
const MediaLibrary = lazy(() => import('@/pages/MediaLibrary'))
const Analytics = lazy(() => import('@/pages/Analytics'))
const Integrations = lazy(() => import('@/pages/Integrations'))
const Settings = lazy(() => import('@/pages/Settings'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/app/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="grid" element={<GridPlanner />} />
            <Route path="calendar" element={<ContentCalendar />} />
            <Route path="compose" element={<PostComposer />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
