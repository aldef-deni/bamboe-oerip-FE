import { useState } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Home,
  CalendarCheck,
  Wallet,
  Tags,
  Tag,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  BarChart3,
  ShieldCheck,
  Coins,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../../components/NotificationBell'

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/villas', label: 'Villa', icon: Home },
  { to: '/admin/bookings', label: 'Pesanan', icon: CalendarCheck },
  { to: '/admin/payments', label: 'Pembayaran', icon: Wallet },
  { to: '/admin/reports', label: 'Laporan', icon: BarChart3 },
  { to: '/admin/promos', label: 'Promo', icon: Tag },
  { to: '/admin/amenities', label: 'Fasilitas', icon: Tags },
  { to: '/admin/users', label: 'Pengguna', icon: Users },
  { to: '/admin/loyalty', label: 'Loyalty', icon: Coins },
  { to: '/admin/pengelola', label: 'Pengelola', icon: ShieldCheck },
  { to: '/admin/settings', label: 'Pengaturan', icon: Settings },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
        : 'text-emerald-50/70 hover:bg-white/10 hover:text-white'
    }`

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar — hijau gelap premium */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform text-white transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'linear-gradient(185deg, #1e5c3c 0%, #143a26 55%, #0e2c1c 100%)' }}
      >
        {/* aksen emas tipis di kanan */}
        <span className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-gold-400/30 to-transparent" />

        <div className="flex h-20 items-center justify-between border-b border-white/10 px-4">
          <Link to="/admin" className="flex items-center gap-2">
            <img src="/logo-landsc.png" alt="Villa Box" className="h-16 w-auto max-w-[210px]" />
          </Link>
          <button className="text-white/80 md:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)} className={linkClass}>
              <item.icon className="h-4 w-4" /> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-white/10 p-3">
          <NavLink to="/admin/profile" onClick={() => setOpen(false)} className={linkClass}>
            <User className="h-4 w-4" /> Profil Saya
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-300 transition hover:bg-red-500/15 hover:text-red-200"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col bg-gradient-to-br from-gray-50 via-white to-emerald-50/40">
        <header className="relative flex h-20 items-center justify-between border-b border-gray-100 bg-white/70 px-4 backdrop-blur md:px-6">
          <button className="md:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo di tengah — hanya mobile (di desktop logo sudah ada di sidebar) */}
          <Link
            to="/admin"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden"
            aria-label="Villa Box"
          >
            <img src="/logo-landsc.png" alt="Villa Box" className="h-14 w-auto max-w-[190px] object-contain" />
          </Link>

          {/* Notifikasi + Profil */}
          <div className="ml-auto flex items-center gap-1 md:gap-3">
            <NotificationBell base="/admin/notifications" />
            <Link
              to="/admin/profile"
              className="hidden items-center gap-3 rounded-full py-1 pl-3 pr-1 transition hover:bg-gray-50 md:flex"
            >
              <span className="hidden text-sm text-gray-600 sm:inline">Hai, {user?.name}</span>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-brand-100" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
