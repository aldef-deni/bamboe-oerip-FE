import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Building2, CalendarCheck, LineChart, MessageCircle, Lock, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { Spinner } from '../../components/ui'
import { useOwnerTheme } from './kit'

function waLink(number) {
  let n = String(number || '').replace(/\D/g, '')
  if (!n) return null
  if (n.startsWith('0')) n = '62' + n.slice(1)
  else if (n.startsWith('8')) n = '62' + n
  return `https://wa.me/${n}?text=${encodeURIComponent('Halo admin Bamboe Oerip, saya ingin bergabung sebagai owner properti.')}`
}

const perks = [
  { icon: Building2, title: 'Kelola properti', text: 'Tambah & perbarui villa, foto, harga, dan fasilitas kapan saja.' },
  { icon: CalendarCheck, title: 'Pantau pesanan', text: 'Notifikasi real-time setiap ada tamu memesan & membayar.' },
  { icon: LineChart, title: 'Laporan pendapatan', text: 'Okupansi, malam terjual, dan pendapatan per properti.' },
]

export default function OwnerLogin() {
  useOwnerTheme('Masuk')
  const { user, loading: authLoading, ownerLogin } = useAuth()
  const settings = useSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ login: '', password: '' })
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!authLoading && user?.role === 'owner') return <Navigate to="/owner" replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    // Koneksi putus sesaat (tanpa respons server) -> ulangi sekali otomatis
    const attempt = async (retry = true) => {
      try {
        return await ownerLogin(form.login.trim(), form.password)
      } catch (err) {
        if (retry && err.isAxiosError && !err.response) {
          await new Promise((r) => setTimeout(r, 900))
          return attempt(false)
        }
        throw err
      }
    }

    try {
      await attempt()
      navigate(location.state?.from || '/owner', { replace: true })
    } catch (err) {
      console.error('Login extranet gagal:', err)
      const status = err.response?.status
      let msg
      if (status === 429) msg = 'Terlalu banyak percobaan masuk. Tunggu 1 menit lalu coba lagi.'
      else if (err.response)
        msg =
          err.response.data?.errors?.login?.[0] ||
          err.response.data?.message ||
          `Login gagal (kode ${status}). Coba lagi beberapa saat lagi.`
      else if (err.isAxiosError)
        msg = `Tidak dapat terhubung ke server Bamboe Oerip (${err.code || 'NETWORK'}). Periksa koneksi internet; bila memakai VPN atau ekstensi pemblokir iklan, nonaktifkan sementara lalu coba lagi.`
      else msg = `Terjadi kesalahan pada aplikasi: ${err.message}. Muat ulang halaman lalu coba lagi.`
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const contact = waLink(settings?.whatsapp)

  return (
    <div className="grid min-h-screen bg-sand-50 font-sans lg:grid-cols-[1.05fr_1fr]">
      {/* ===== Panel brand (kiri) ===== */}
      <aside
        className="relative hidden overflow-hidden px-12 py-12 text-white lg:flex lg:flex-col"
        style={{ background: 'radial-gradient(90% 60% at 10% 0%, #2a7a4f 0%, transparent 60%), linear-gradient(160deg, #143a26 0%, #0b2117 60%, #07150e 100%)' }}
      >
        <span className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,#e0c268_1px,transparent_0)] [background-size:26px_26px]" />
        <span className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full border border-gold-400/15" />
        <span className="pointer-events-none absolute -bottom-24 -right-16 h-[20rem] w-[20rem] rounded-full border border-gold-400/10" />
        <span className="pointer-events-none absolute right-0 inset-y-0 w-px bg-gradient-to-b from-transparent via-gold-400/50 to-transparent" />

        <img src="/logo-landsc-sm.webp" alt="Bamboe Oerip" className="relative w-[340px] max-w-full" />

        <div className="relative mt-auto max-w-lg">
          <div className="mb-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-300">
            <span className="h-px w-10 bg-gold-400" /> Extranet Owner
          </div>
          <h2 className="font-display text-[2.6rem] font-semibold leading-[1.15] text-white">
            Kelola properti Anda bersama <span className="text-gold-300">Bamboe Oerip</span>.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-emerald-50/70">
            Satu dasbor untuk mengelola listing, memantau pesanan tamu, dan melihat performa pendapatan properti Anda.
          </p>

          <ul className="mt-9 space-y-5">
            {perks.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gold-400/10 text-gold-300 ring-1 ring-inset ring-gold-300/25">
                  <p.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-semibold text-white">{p.title}</div>
                  <div className="text-sm text-emerald-50/60">{p.text}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-12 text-xs text-emerald-50/40">© {new Date().getFullYear()} Bamboe Oerip · Homestay dan Properti</p>
      </aside>

      {/* ===== Form (kanan) ===== */}
      <main className="relative flex items-center justify-center px-5 py-10 sm:px-10">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-brand-900/[0.06] to-transparent lg:hidden" />

        <div className="relative w-full max-w-[420px]">
          {/* Logo mobile */}
          <div className="mb-8 flex justify-center lg:hidden">
            <div className="rounded-2xl bg-brand-900 px-6 py-3 shadow-xl shadow-brand-900/20">
              <img src="/logo-landsc-sm.webp" alt="Bamboe Oerip" className="h-16 w-auto" />
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-600">Selamat datang kembali</div>
            <h1 className="font-display text-[2rem] font-semibold leading-tight text-brand-900">Masuk ke Extranet</h1>
            <p className="mt-2 text-sm text-gray-500">Gunakan username atau email akun owner yang diberikan admin Bamboe Oerip.</p>
          </div>

          {error && (
            <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-brand-900">Username atau email</span>
              <span className="relative block">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  autoFocus
                  autoComplete="username"
                  value={form.login}
                  onChange={(e) => setForm({ ...form, login: e.target.value })}
                  placeholder="mis. owner.villa atau nama@email.com"
                  className="w-full rounded-xl border border-sand-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gold-400 focus:ring-4 focus:ring-gold-100"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-brand-900">Password</span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-sand-200 bg-white py-3 pl-11 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gold-400 focus:ring-4 focus:ring-gold-100"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 transition hover:bg-sand-100 hover:text-brand-800"
                  aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-700 to-brand-900 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_-12px_rgba(22,61,43,0.7)] ring-1 ring-inset ring-gold-300/20 transition hover:from-brand-600 hover:to-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Spinner className="h-4 w-4" /> : <LogIn className="h-4 w-4 text-gold-300" />}
              {loading ? 'Memeriksa…' : 'Masuk'}
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-gold-200/70 bg-gradient-to-br from-gold-50 to-white p-4 text-sm">
            <div className="font-semibold text-brand-900">Belum punya akun owner?</div>
            <p className="mt-1 text-gray-600">
              Pendaftaran owner dilakukan oleh admin Bamboe Oerip. Lupa password juga dapat direset oleh admin.
            </p>
            {contact && (
              <a
                href={contact}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 font-semibold text-brand-700 hover:text-brand-900"
              >
                <MessageCircle className="h-4 w-4" /> Hubungi admin via WhatsApp
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
