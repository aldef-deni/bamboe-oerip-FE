import { Navigate, useLocation, Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { PageLoader, Button } from './ui'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return children
}

export function AdminRoute({ children }) {
  const { user, loading, logout } = useAuth()

  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />

  // Logged in tapi bukan admin → tampilkan pesan (hindari redirect loop di build admin)
  if (user.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h1 className="text-xl font-bold text-gray-900">Akses ditolak</h1>
        <p className="max-w-sm text-sm text-gray-500">
          Akun <strong>{user.email}</strong> bukan admin. Masuk dengan akun pengelola untuk mengakses dashboard.
        </p>
        <Button variant="outline" onClick={logout}>
          Keluar &amp; ganti akun
        </Button>
      </div>
    )
  }

  return children
}

// Build 'owner' memakai /login; build gabungan (dev) memakai /owner/login
export const OWNER_LOGIN_PATH = import.meta.env.VITE_APP_TARGET === 'owner' ? '/login' : '/owner/login'

export function OwnerRoute({ children }) {
  const { user, loading, logout } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader />
  if (!user) return <Navigate to={OWNER_LOGIN_PATH} state={{ from: location.pathname }} replace />

  if (user.role !== 'owner') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-sand-50 px-4 text-center">
        <ShieldAlert className="h-12 w-12 text-gold-600" />
        <h1 className="text-xl font-bold text-gray-900">Khusus Owner Properti</h1>
        <p className="max-w-sm text-sm text-gray-500">
          Akun <strong>{user.email}</strong> bukan akun owner. Masuk dengan akun owner yang diberikan oleh admin Bamboe Oerip.
        </p>
        <Button variant="outline" onClick={logout}>
          Keluar &amp; ganti akun
        </Button>
      </div>
    )
  }

  return children
}
