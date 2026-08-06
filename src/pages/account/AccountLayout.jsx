import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Camera, User as UserIcon, CalendarCheck, Heart, Coins, Medal, Award, Crown, Gem } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const tabs = [
  { to: '/profile', label: 'Profil', icon: UserIcon, end: true },
  { to: '/profile/pesanan', label: 'Pesanan', icon: CalendarCheck },
  { to: '/profile/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/profile/loyalty', label: 'Loyalty', icon: Coins },
]

const TIER_ICONS = { medal: Medal, award: Award, crown: Crown, gem: Gem }
const TIER_BG = {
  bronze: '/loyalty/bronze.webp',
  silver: '/loyalty/silver.webp',
  gold: '/loyalty/gold.webp',
  platinum: '/loyalty/platinum.webp',
}

export default function AccountLayout() {
  const { user, updateUser } = useAuth()
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [tier, setTier] = useState(null)

  useEffect(() => {
    api
      .get('/loyalty/balance')
      .then((res) => setTier(res.data?.current_tier || null))
      .catch(() => setTier(null))
  }, [])

  const slug = tier?.slug || 'bronze'
  const TierIcon = TIER_ICONS[tier?.icon] || Crown

  const uploadAvatar = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    setUploading(true)
    const fd = new FormData()
    fd.append('_method', 'PUT')
    fd.append('avatar', f)
    try {
      const res = await api.post('/profile', fd)
      updateUser(res.data)
    } catch {
      // abaikan; error jarang terjadi untuk avatar
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const tabClass = ({ isActive }) =>
    `flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
      isActive ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'
    }`

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        {/* Cover — background sesuai tier loyalti user */}
        <div className="relative h-32 overflow-hidden bg-brand-800 md:h-36">
          <img src={TIER_BG[slug] || TIER_BG.bronze} alt="" className="absolute inset-0 h-full w-full object-cover" />
          {/* scrim agar avatar & badge kontras */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0) 100%)' }}
          />
          {/* badge tier */}
          {tier && (
            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-amber-300/50 bg-black/40 px-3 py-1 backdrop-blur-sm">
              <TierIcon className="h-3.5 w-3.5 text-amber-300" />
              <span className="text-xs font-semibold tracking-wide text-amber-100">{tier.name}</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
        </div>

        {/* Identitas + avatar */}
        <div className="px-6 pb-5">
          <div className="-mt-12 flex flex-col items-center gap-3 sm:flex-row sm:items-end sm:gap-5">
            <div className="relative">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-24 w-24 rounded-full object-cover shadow-lg ring-4 ring-white" />
              ) : (
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-3xl font-bold text-gold-200 shadow-lg ring-4 ring-white">
                  {user?.name?.charAt(0).toUpperCase() || <UserIcon className="h-8 w-8" />}
                </span>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0.5 right-0.5 rounded-full bg-brand-600 p-2 text-white shadow-md ring-2 ring-white transition hover:bg-brand-700 disabled:opacity-70"
                title="Ubah foto profil"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="text-center sm:pb-1 sm:text-left">
              <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
              {uploading && <p className="mt-1 text-xs text-brand-600">Mengunggah foto…</p>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-t border-gray-100 px-3">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={tabClass}>
              <t.icon className="h-4 w-4" /> {t.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  )
}
