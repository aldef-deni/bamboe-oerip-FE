import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, CalendarCheck, Wallet, Home, UserPlus, Coins, Bell as BellIcon } from 'lucide-react'
import api from '../lib/api'

const TYPE_ICON = {
  booking: CalendarCheck,
  payment: Wallet,
  villa: Home,
  customer: UserPlus,
  loyalty: Coins,
}
const TYPE_TONE = {
  booking: 'bg-blue-50 text-blue-600',
  payment: 'bg-emerald-50 text-emerald-600',
  villa: 'bg-amber-50 text-amber-600',
  customer: 'bg-violet-50 text-violet-600',
  loyalty: 'bg-yellow-50 text-yellow-600',
}

function timeAgo(iso) {
  const d = new Date(iso)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'baru saja'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days} hari lalu`
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

/**
 * Lonceng notifikasi. base = '/notifications' (customer) atau '/admin/notifications' (admin).
 */
export default function NotificationBell({ base = '/notifications', dark = false }) {
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const timer = useRef(null)

  const fetchData = async () => {
    try {
      const res = await api.get(base)
      setItems(res.data.items || [])
      setUnread(res.data.unread || 0)
    } catch {
      /* abaikan */
    }
  }

  useEffect(() => {
    fetchData()
    timer.current = setInterval(fetchData, 45000)
    return () => clearInterval(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base])

  const openPanel = () => {
    setOpen((v) => !v)
    if (!open) fetchData()
  }

  const markAll = async () => {
    setItems((its) => its.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
    setUnread(0)
    try {
      await api.post(`${base}/read-all`)
    } catch {
      fetchData()
    }
  }

  const clickItem = async (n) => {
    if (!n.read_at) {
      setItems((its) => its.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)))
      setUnread((u) => Math.max(0, u - 1))
      api.post(`${base}/${n.id}/read`).catch(() => {})
    }
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <div className="relative">
      <button
        onClick={openPanel}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition ${
          dark ? 'text-white/90 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
        }`}
        title="Notifikasi"
        aria-label="Notifikasi"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-bold text-gray-900">Notifikasi</h3>
              {unread > 0 && (
                <button onClick={markAll} className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
                  <CheckCheck className="h-3.5 w-3.5" /> Tandai semua dibaca
                </button>
              )}
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <BellIcon className="h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-400">Belum ada notifikasi</p>
                </div>
              ) : (
                items.map((n) => {
                  const Icon = TYPE_ICON[n.type] || BellIcon
                  return (
                    <button
                      key={n.id}
                      onClick={() => clickItem(n)}
                      className={`flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 ${
                        n.read_at ? '' : 'bg-brand-50/40'
                      }`}
                    >
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${TYPE_TONE[n.type] || 'bg-gray-100 text-gray-500'}`}>
                        <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-sm ${n.read_at ? 'font-medium text-gray-800' : 'font-bold text-gray-900'}`}>{n.title}</span>
                          {!n.read_at && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand-500" />}
                        </div>
                        {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{n.body}</p>}
                        <div className="mt-1 text-[11px] text-gray-400">{timeAgo(n.created_at)}</div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
