import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'

// Layout
import Layout from './components/layout/Layout'

// Public Pages
import HomePage from './pages/HomePage'
import ContestsPage from './pages/ContestsPage'
import ContestDetailPage from './pages/ContestDetailPage'
import EntryDetailPage from './pages/EntryDetailPage'
import WinnersPage from './pages/WinnersPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

// User Pages
import DashboardPage from './pages/user/DashboardPage'
import SubmitEntryPage from './pages/user/SubmitEntryPage'
import MyEntriesPage from './pages/user/MyEntriesPage'
import SettingsPage from './pages/user/SettingsPage'
import NotificationsPage from './pages/user/NotificationsPage'

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminContestsPage from './pages/admin/AdminContestsPage'
import AdminEntriesPage from './pages/admin/AdminEntriesPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'

// Route Guards
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'

// Components
import Toast from './components/ui/Toast'

function App() {
  const { initialize, isLoading } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-dark-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="contests" element={<ContestsPage />} />
          <Route path="contest/:id" element={<ContestDetailPage />} />
          <Route path="entry/:id" element={<EntryDetailPage />} />
          <Route path="winners" element={<WinnersPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="profile/:username" element={<ProfilePage />} />

          {/* Auth Routes */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected User Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="submit/:contestId" element={<SubmitEntryPage />} />
            <Route path="my-entries" element={<MyEntriesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/contests" element={<AdminContestsPage />} />
            <Route path="admin/entries" element={<AdminEntriesPage />} />
            <Route path="admin/users" element={<AdminUsersPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>

      {/* Global Toast */}
      <Toast />
    </>
  )
}

export default App
