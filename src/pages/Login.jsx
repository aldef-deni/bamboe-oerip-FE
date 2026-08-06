import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input } from '../components/ui'
import GoogleLoginButton from '../components/GoogleLoginButton'

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      const dest = location.state?.from || (user.role === 'admin' ? '/admin' : '/')
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Periksa email dan password.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async (credential) => {
    setError('')
    try {
      await loginWithGoogle(credential)
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login dengan Google gagal. Coba lagi.')
    }
  }

  const fieldClass = 'border-brand-400! bg-brand-50/40 focus:bg-white'

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="rounded-3xl border border-brand-100 bg-white p-8 shadow-xl shadow-brand-900/5 ring-1 ring-brand-50">
        <img src="/logo-landsc.png" alt="Villa Box" className="mx-auto mb-6 h-16 w-auto max-w-[240px]" />
        <h1 className="mb-1 text-center text-xl font-bold text-gray-900">Selamat datang kembali</h1>
        <p className="mb-6 text-center text-sm text-gray-500">Masuk untuk melanjutkan pemesanan</p>

        {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            required
            className={fieldClass}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="nama@email.com"
          />
          <Input
            label="Password"
            type="password"
            required
            className={fieldClass}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
          <Button type="submit" className="w-full" loading={loading}>
            Masuk
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">atau</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <GoogleLoginButton onCredential={handleGoogle} text="signin_with" />

        <p className="mt-6 text-center text-sm text-gray-600">
          Belum punya akun?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  )
}
