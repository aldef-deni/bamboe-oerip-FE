import { useState } from 'react'
import { IdCard, Lock } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Input } from '../../components/ui'

export default function ProfileTab() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    password: '',
    password_confirmation: '',
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErrors({})
    setMessage('')
    setLoading(true)
    const payload = { name: form.name, phone: form.phone }
    if (form.password) {
      payload.password = form.password
      payload.password_confirmation = form.password_confirmation
    }
    try {
      const res = await api.put('/profile', payload)
      updateUser(res.data)
      setForm((f) => ({ ...f, password: '', password_confirmation: '' }))
      setMessage('Profil berhasil diperbarui.')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: [err.response?.data?.message || 'Gagal menyimpan.'] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {message && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
      {errors.general && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errors.general[0]}</div>}

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
          <IdCard className="h-5 w-5 text-gold-500" /> Data Akun
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nama lengkap"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name?.[0]}
          />
          <Input
            label="No. HP / WhatsApp"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            error={errors.phone?.[0]}
          />
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-gray-700">Email</span>
            <input
              value={user?.email || ''}
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 font-semibold text-gray-900">
          <Lock className="h-5 w-5 text-gold-500" /> Ganti Password
        </h2>
        <p className="mb-4 text-xs text-gray-400">Kosongkan jika tidak ingin mengubah password.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Password baru"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password?.[0]}
          />
          <Input
            label="Konfirmasi password"
            type="password"
            value={form.password_confirmation}
            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          Simpan Perubahan
        </Button>
      </div>
    </form>
  )
}
