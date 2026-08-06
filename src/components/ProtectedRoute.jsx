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
