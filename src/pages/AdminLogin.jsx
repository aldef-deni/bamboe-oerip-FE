import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button, Input } from '../components/ui'

export default function AdminLogin() {
  const { adminLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await adminLogin(form.username, form.password)
      navigate(location.state?.from || '/admin', { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.errors?.username?.[0] ||
          err.response?.data?.message ||
          'Login gagal. Periksa username dan password.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-4 py-10">
      {/* dekorasi */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand-400/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-emerald-300/30 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-white/50 bg-white/95 p-8 shadow-2xl backdrop-blur sm:p-10">
          <img
            src="/logo-landsc.png"
            alt="Villa Box"
            className="mx-auto mb-5 h-auto w-60 max-w-[82%]"
          />
          <p className="mb-1.5 text-center text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
            Panel Pengelola
          </p>
          <h1 className="mb-8 text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.7rem]">
            Selamat Datang Pengelola
          </h1>

          {error && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Username"
              required
              autoFocus
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Masukkan username"
            />
            <Input
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
            <Button type="submit" className="w-full !py-3" loading={loading}>
              {!loading && <LogIn className="h-4 w-4" />} Masuk
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/70">
          © {new Date().getFullYear()} Villa Box — Sistem Pengelolaan Akomodasi
        </p>
      </div>
    </div>
  )
}
