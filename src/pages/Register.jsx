import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input } from '../components/ui'
import GoogleLoginButton from '../components/GoogleLoginButton'

export default function Register() {
  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: [err.response?.data?.message || 'Pendaftaran gagal.'] })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async (credential) => {
    setErrors({})
    try {
      await loginWithGoogle(credential)
      navigate('/', { replace: true })
    } catch (err) {
      setErrors({ general: [err.response?.data?.message || 'Pendaftaran dengan Google gagal. Coba lagi.'] })
    }
  }

  const fieldClass = 'border-brand-400! bg-brand-50/40 focus:bg-white'

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <div className="rounded-3xl border border-brand-100 bg-white p-8 shadow-xl shadow-brand-900/5 ring-1 ring-brand-50">
        <img src="/logo-landsc.png" alt="Villa Box" className="mx-auto mb-6 h-16 w-auto max-w-[240px]" />
        <h1 className="mb-1 text-center text-xl font-bold text-gray-900">Buat akun baru</h1>
        <p className="mb-6 text-center text-sm text-gray-500">Daftar gratis dan mulai booking villa</p>

        {errors.general && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errors.general[0]}</div>}

        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Nama lengkap"
            required
            className={fieldClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name?.[0]}
          />
          <Input
            label="Email"
            type="email"
            required
            className={fieldClass}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email?.[0]}
          />
          <Input
            label="No. HP / WhatsApp"
            className={fieldClass}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            error={errors.phone?.[0]}
          />
          <Input
            label="Password"
            type="password"
            required
            className={fieldClass}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password?.[0]}
          />
          <Input
            label="Konfirmasi password"
            type="password"
            required
            className={fieldClass}
            value={form.password_confirmation}
            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
          />
          <Button type="submit" className="w-full" loading={loading}>
            Daftar
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">atau</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <GoogleLoginButton onCredential={handleGoogle} text="signup_with" />

        <p className="mt-6 text-center text-sm text-gray-600">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}
