import { useState } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, CalendarCheck, Star, BarChart3, User, LogOut, Menu, X, Plus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../../components/NotificationBell'
import { OWNER_LOGIN_PATH } from '../../components/ProtectedRoute'
import { useOwnerTheme } from './kit'

const nav = [
  { to: '/owner', label: 'Ringkasan', icon: LayoutDashboard, end: true },
  { to: '/owner/properties', label: 'Properti Saya', icon: Building2 },
  { to: '/owner/bookings', label: 'Pesanan', icon: CalendarCheck },
  { to: '/owner/reviews', label: 'Ulasan Tamu', icon: Star },
  { to: '/owner/reports', label: 'Laporan Pendapatan', icon: BarChart3 },
]

export default function OwnerLayout() {
  useOwnerTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate(OWNER_LOGIN_PATH, { replace: true })
  }

  const linkClass = ({ isActive }) =>
    `group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-gradient-to-r from-gold-400/20 to-gold-400/5 text-gold-100 ring-1 ring-inset ring-gold-300/25'
        : 'text-emerald-50/65 hover:bg-white/[0.06] hover:text-white'
    }`

  const initial = user?.name?.charAt(0).toUpperCase()

  return (
    <div className="flex min-h-screen bg-sand-50 font-sans">
      {/* ===== Sidebar ===== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col text-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'radial-gradient(120% 60% at 0% 0%, #1e5c3c 0%, transparent 60%), linear-gradient(180deg, #123524 0%, #0b2117 55%, #08170f 100%)' }}
      >
        {/* motif halus + garis emas */}
        <span className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle_at_1px_1px,#e0c268_1px,transparent_0)] [background-size:22px_22px]" />
        <span className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-gold-400/40 to-transparent" />

        <div className="relative flex h-24 items-center justify-between px-5">
          <Link to="/owner" className="block" onClick={() => setOpen(false)}>
            <img src="/logo-landsc-sm.webp" alt="Bamboe Oerip" className="h-[68px] w-auto max-w-[220px] object-contain" />
          </Link>
          <button className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="Tutup menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mx-5 mb-4 flex items-center gap-2">
          <span className="h-px flex-1 bg-gradient-to-r from-gold-400/60 to-transparent" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-300/90">Extranet Owner</span>
          <span className="h-px flex-1 bg-gradient-to-l from-gold-400/60 to-transparent" />
        </div>

        <nav className="relative flex-1 space-y-1 overflow-y-auto px-3">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)} className={linkClass}>
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-gold-400" />}
                  <item.icon className={`h-[18px] w-[18px] ${isActive ? 'text-gold-300' : 'text-emerald-100/50 group-hover:text-white'}`} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}

          <Link
            to="/owner/properties/new"
            onClick={() => setOpen(false)}
            className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-dashed border-gold-300/40 px-3 py-2.5 text-sm font-semibold text-gold-200 transition hover:border-gold-300/80 hover:bg-gold-400/10"
          >
            <Plus className="h-4 w-4" /> Tambah Properti
          </Link>
        </nav>

        <div className="relative border-t border-white/10 p-3">
          <NavLink to="/owner/profile" onClick={() => setOpen(false)} className={linkClass}>
            <User className="h-[18px] w-[18px]" /> Profil Saya
          </NavLink>
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-rose-200/80 transition hover:bg-rose-500/10 hover:text-rose-100"
          >
            <LogOut className="h-[18px] w-[18px]" /> Keluar
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-brand-900/50 backdrop-blur-[2px] lg:hidden" onClick={() => setOpen(false)} />}

      {/* ===== Konten ===== */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[68px] items-center gap-3 border-b border-sand-200/70 bg-white/80 px-4 backdrop-blur-md sm:px-6">
          <button className="rounded-lg p-1.5 text-brand-800 hover:bg-sand-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu">
            <Menu className="h-6 w-6" />
          </button>

          <Link to="/owner" className="lg:hidden" aria-label="Bamboe Oerip">
            <img src="/logo-sm.webp" alt="" className="h-10 w-10 rounded-lg object-cover" />
          </Link>

          <div className="hidden min-w-0 lg:block">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600">Bamboe Oerip</div>
            <div className="truncate text-sm text-gray-500">Kelola properti & pantau pesanan Anda</div>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
            <NotificationBell base="/owner/notifications" />
            <Link to="/owner/profile" className="flex items-center gap-3 rounded-full py-1 pl-1 pr-1 transition hover:bg-sand-100 sm:pl-3">
              <span className="hidden text-right sm:block">
                <span className="block max-w-[160px] truncate text-sm font-semibold text-brand-900">{user?.name}</span>
                <span className="block text-[11px] text-gold-600">Owner Properti</span>
              </span>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-gold-300/70" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 font-display text-base font-semibold text-gold-100 ring-2 ring-gold-300/70">
                  {initial}
                </span>
              )}
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-sand-200/70 px-6 py-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Bamboe Oerip · Homestay dan Properti — Extranet Owner
        </footer>
      </div>
    </div>
  )
}
