import { useRef, useState } from 'react'
import { Camera, Trash2, User as UserIcon, ShieldCheck, IdCard, KeyRound, Check, Mail } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Input } from '../../components/ui'

export default function AdminProfile() {
  const { user, updateUser } = useAuth()
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    phone: user?.phone || '',
    password: '',
    password_confirmation: '',
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const preview = avatarFile
    ? URL.createObjectURL(avatarFile)
    : !removeAvatar && user?.avatar_url
      ? user.avatar_url
      : null

  const pickFile = (e) => {
    const f = e.target.files[0]
    if (f) {
      setAvatarFile(f)
      setRemoveAvatar(false)
    }
  }

  const clearPhoto = () => {
    setAvatarFile(null)
    setRemoveAvatar(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = async (e) => {
    e.preventDefault()
    setErrors({})
    setMessage('')
    setLoading(true)

    const fd = new FormData()
    fd.append('_method', 'PUT')
    fd.append('name', form.name)
    fd.append('username', form.username)
    fd.append('phone', form.phone || '')
    if (form.password) {
      fd.append('password', form.password)
      fd.append('password_confirmation', form.password_confirmation)
    }
    if (avatarFile) fd.append('avatar', avatarFile)
    if (removeAvatar) fd.append('remove_avatar', '1')

    try {
      const res = await api.post('/profile', fd)
      updateUser(res.data)
      setForm((f) => ({ ...f, password: '', password_confirmation: '' }))
      setAvatarFile(null)
      setRemoveAvatar(false)
      setMessage('Profil berhasil diperbarui.')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: [err.response?.data?.message || 'Gagal menyimpan.'] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <h1 className="mb-5 text-2xl font-bold text-gray-900">Profil Saya</h1>

      {message && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" /> {message}
        </div>
      )}
      {errors.general && <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{errors.general[0]}</div>}

      <form onSubmit={submit} className="space-y-5">
        {/* Hero profil */}
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div
            className="h-24"
            style={{ background: 'linear-gradient(120deg, #1e5c3c 0%, #257449 55%, #143a26 100%)' }}
          />
          <div className="px-6 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="relative -mt-12 shrink-0">
                  {preview ? (
                    <img
                      src={preview}
                      alt=""
                      className="h-24 w-24 rounded-2xl bg-white object-cover shadow-lg ring-1 ring-black/5"
                    />
                  ) : (
                    <span className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-3xl font-bold text-white shadow-lg ring-1 ring-black/5">
                      {user?.name?.charAt(0).toUpperCase() || <UserIcon className="h-8 w-8" />}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    title="Ubah foto"
                    className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-700 shadow-md ring-1 ring-gray-100 transition hover:bg-brand-50"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
                </div>

                <div className="pb-1">
                  <h2 className="text-xl font-bold leading-tight text-gray-900">{user?.name}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
                      <ShieldCheck className="h-3.5 w-3.5" /> Administrator
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Mail className="h-3.5 w-3.5 text-gray-400" /> {user?.email}
                    </span>
                  </div>
                </div>
              </div>

              {preview && (
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="inline-flex items-center gap-1.5 self-start rounded-xl border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 sm:self-end"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Hapus foto
                </button>
              )}
            </div>
            <p className="mt-4 text-xs text-gray-400">Format JPG/PNG, maksimal 2MB.</p>
          </div>
        </div>

        {/* Data akun */}
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/50 px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <IdCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Data Akun</h2>
              <p className="text-xs text-gray-400">Informasi identitas akun Anda.</p>
            </div>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <Input label="Nama lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name?.[0]} />
            <Input label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} error={errors.username?.[0]} />
            <Input label="No. HP / WhatsApp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone?.[0]} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Email</span>
              <input
                value={user?.email || ''}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
              />
            </label>
          </div>
        </div>

        {/* Ganti password */}
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/50 px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Ganti Password</h2>
              <p className="text-xs text-gray-400">Kosongkan jika tidak ingin mengubah password.</p>
            </div>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
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

        {/* Bar simpan mengambang */}
        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white/90 px-5 py-3 shadow-lg backdrop-blur">
          <span className="hidden text-xs text-gray-400 sm:block">Pastikan data sudah benar sebelum menyimpan.</span>
          <Button type="submit" loading={loading} className="w-full sm:w-auto">
            <Check className="h-4 w-4" /> Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  )
}
