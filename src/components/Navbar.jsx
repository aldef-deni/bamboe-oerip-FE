import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Heart, User, LogOut, Menu, X, LayoutDashboard, CalendarCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'

// URL dashboard admin: eksternal (kelola.bamboeoerip.com) di build customer,
// atau internal '/admin' saat pengembangan gabungan.
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || '/admin'
const ADMIN_EXTERNAL = ADMIN_URL.startsWith('http')

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  // Saat halaman di-scroll, header berubah jadi hijau soft transparan (glass)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navLink = ({ isActive }) =>
    `text-sm font-medium transition ${isActive ? 'text-brand-700' : 'text-gray-600 hover:text-brand-700'}`

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300 ${
        scrolled
          ? 'border-brand-600/20 bg-brand-600/20 shadow-sm'
          : 'border-gray-100 bg-white/90'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo-landsc.png" alt="Villa Box" className="h-16 w-auto max-w-[220px]" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" className={navLink} end>
            Beranda
          </NavLink>
          <NavLink to="/villas" className={navLink}>
            Cari Villa
          </NavLink>
          <NavLink to="/promo" className={navLink}>
            Promo
          </NavLink>
          <NavLink to="/tentang-bamboe-oerip" className={navLink}>
            Tentang Bamboe Oerip
          </NavLink>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user && <NotificationBell />}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenu((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-gray-200 py-1.5 pl-1.5 pr-3 hover:shadow-sm"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-200" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="text-sm font-medium text-gray-700">{user.name.split(' ')[0]}</span>
              </button>
              {menu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-gray-100 bg-white py-2 shadow-lg">
                    {isAdmin &&
                      (ADMIN_EXTERNAL ? (
                        <a
                          href={ADMIN_URL}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LayoutDashboard className="h-4 w-4" /> Dashboard Admin
                        </a>
                      ) : (
                        <Link
                          to={ADMIN_URL}
                          onClick={() => setMenu(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LayoutDashboard className="h-4 w-4" /> Dashboard Admin
                        </Link>
                      ))}
                    <Link
                      to="/profile/pesanan"
                      onClick={() => setMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <CalendarCheck className="h-4 w-4" /> Pesanan Saya
                    </Link>
                    <Link
                      to="/profile/wishlist"
                      onClick={() => setMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Heart className="h-4 w-4" /> Wishlist
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="h-4 w-4" /> Profil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" /> Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-brand-700">
                Masuk
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Daftar
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          {user && <NotificationBell />}
          <button onClick={() => setOpen((v) => !v)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            <Link to="/" onClick={() => setOpen(false)} className="block py-2 text-sm text-gray-700">
              Beranda
            </Link>
            <Link to="/villas" onClick={() => setOpen(false)} className="block py-2 text-sm text-gray-700">
              Cari Villa
            </Link>
            <Link to="/promo" onClick={() => setOpen(false)} className="block py-2 text-sm text-gray-700">
              Promo
            </Link>
            <Link to="/tentang-bamboe-oerip" onClick={() => setOpen(false)} className="block py-2 text-sm text-gray-700">
              Tentang Bamboe Oerip
            </Link>
            {user ? (
              <>
                {isAdmin &&
                  (ADMIN_EXTERNAL ? (
                    <a href={ADMIN_URL} className="block py-2 text-sm text-gray-700">
                      Dashboard Admin
                    </a>
                  ) : (
                    <Link to={ADMIN_URL} onClick={() => setOpen(false)} className="block py-2 text-sm text-gray-700">
                      Dashboard Admin
                    </Link>
                  ))}
                <Link to="/profile/pesanan" onClick={() => setOpen(false)} className="block py-2 text-sm text-gray-700">
                  Pesanan Saya
                </Link>
                <Link to="/profile/wishlist" onClick={() => setOpen(false)} className="block py-2 text-sm text-gray-700">
                  Wishlist
                </Link>
                <Link to="/profile" onClick={() => setOpen(false)} className="block py-2 text-sm text-gray-700">
                  Profil
                </Link>
                <button onClick={handleLogout} className="block py-2 text-sm text-red-600">
                  Keluar
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2 text-center text-sm font-medium"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl bg-brand-600 py-2 text-center text-sm font-semibold text-white"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
