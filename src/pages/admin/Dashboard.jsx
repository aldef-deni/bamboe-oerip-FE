import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Home, Users, CalendarCheck, Wallet, Clock, Building2 } from 'lucide-react'
import api from '../../lib/api'
import { rupiah, formatDate, STATUS_LABELS, STATUS_COLORS } from '../../lib/format'
import { PageLoader, Badge } from '../../components/ui'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const { stats, monthly = [], recent_bookings = [] } = data

  const cards = [
    { label: 'Total Villa', value: stats.villas, icon: Home, hint: `${stats.active_villas} aktif`, grad: ['#34995f', '#1e7a45'] },
    { label: 'Pengguna', value: stats.users, icon: Users, grad: ['#6366f1', '#4338ca'] },
    { label: 'Total Pesanan', value: stats.bookings, icon: CalendarCheck, grad: ['#f59e0b', '#d97706'] },
  ]

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mb-6 text-sm text-gray-500">Ringkasan performa Villa Box hari ini.</p>

      {stats.pending_verification > 0 && (
        <Link
          to="/admin/payments?status=submitted"
          className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/60 px-5 py-4 text-sm text-amber-800 shadow-sm transition hover:shadow-md"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/30">
            <Clock className="h-5 w-5" />
          </span>
          <span>
            <strong>{stats.pending_verification}</strong> pembayaran menunggu verifikasi. Klik untuk memproses.
          </span>
        </Link>
      )}

      {stats.pending_villa_review > 0 && (
        <Link
          to="/admin/villas?review=pending"
          className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100/60 px-5 py-4 text-sm text-emerald-800 shadow-sm transition hover:shadow-md"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/30">
            <Building2 className="h-5 w-5" />
          </span>
          <span>
            <strong>{stats.pending_villa_review}</strong> properti dari owner menunggu tinjauan. Klik untuk meninjau.
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="relative overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-b from-white to-gray-50 p-4 sm:p-5"
            style={{ boxShadow: '0 12px 28px -14px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.9)' }}
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent" />
            <div className="relative">
              <div
                className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl text-white"
                style={{ background: `linear-gradient(135deg, ${c.grad[0]}, ${c.grad[1]})`, boxShadow: `0 8px 18px -6px ${c.grad[1]}88` }}
              >
                <c.icon className="h-5 w-5" />
              </div>
              <div className="text-xl font-bold text-gray-900 sm:text-2xl">{c.value}</div>
              <div className="text-xs text-gray-500 sm:text-sm">{c.label}</div>
              {c.hint && <div className="mt-1 text-[11px] font-medium text-brand-600 sm:text-xs">{c.hint}</div>}
            </div>
          </div>
        ))}

        {/* Pendapatan — kartu highlight gradient hijau */}
        <div
          className="relative overflow-hidden rounded-2xl p-4 text-white sm:p-5"
          style={{ background: 'linear-gradient(140deg, #257449 0%, #1a4a32 100%)', boxShadow: '0 16px 34px -14px rgba(30,92,60,0.7)' }}
        >
          <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gold-400/20 blur-2xl" />
          <div className="relative">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <Wallet className="h-5 w-5 text-gold-200" />
            </div>
            <div className="text-base font-bold sm:text-xl">{rupiah(stats.revenue)}</div>
            <div className="text-xs text-emerald-100/80 sm:text-sm">Pendapatan</div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Revenue chart */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Pendapatan 6 Bulan Terakhir</h2>
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
              Total {shortRupiah(monthly.reduce((s, m) => s + Number(m.revenue), 0))}
            </span>
          </div>
          {monthly.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">Belum ada data pendapatan.</p>
          ) : (
            <RevenueChart data={monthly} />
          )}
        </div>

        {/* Recent bookings */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Pesanan Terbaru</h2>
            <Link to="/admin/bookings" className="text-sm font-medium text-brand-700 hover:underline">
              Lihat semua
            </Link>
          </div>
          <div className="space-y-1">
            {recent_bookings.length === 0 && <p className="text-sm text-gray-400">Belum ada pesanan.</p>}
            {recent_bookings.map((b) => (
              <div key={b.id} className="-mx-2 flex items-center justify-between rounded-xl px-2 py-2.5 transition hover:bg-gray-50">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <CalendarCheck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-800">{b.villa?.name}</div>
                    <div className="truncate text-xs text-gray-500">
                      {b.user?.name} · {formatDate(b.created_at)}
                    </div>
                  </div>
                </div>
                <div className="ml-2 text-right">
                  <div className="text-sm font-semibold text-gray-900">{rupiah(b.total)}</div>
                  <Badge className={STATUS_COLORS[b.status]}>{STATUS_LABELS[b.status]}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==== Chart pendapatan (bar premium, SVG-like dengan tinggi piksel eksplisit) ====
const ID_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function monthLabel(ym) {
  // "2026-07" -> "Jul '26"
  const [y, m] = (ym || '').split('-')
  const idx = Number(m) - 1
  return `${ID_MONTHS[idx] || m} '${(y || '').slice(2)}`
}

function shortRupiah(n) {
  const v = Number(n || 0)
  if (v >= 1e9) return `Rp${(v / 1e9).toFixed(1).replace('.', ',')} M`
  if (v >= 1e6) return `Rp${(v / 1e6).toFixed(1).replace('.', ',')} jt`
  if (v >= 1e3) return `Rp${Math.round(v / 1e3)} rb`
  return `Rp${v}`
}

function RevenueChart({ data }) {
  const H = 176 // tinggi area bar (px)
  const max = Math.max(...data.map((d) => Number(d.revenue)), 1)
  const grid = [1, 0.75, 0.5, 0.25, 0]

  return (
    <div>
      <div className="relative" style={{ height: H }}>
        {/* gridlines + label sumbu-Y */}
        <div className="absolute inset-0">
          {grid.map((g) => (
            <div key={g} className="absolute left-0 right-0 flex items-center gap-2" style={{ top: (1 - g) * H - 6 }}>
              <span className="w-12 flex-shrink-0 text-right text-[9px] tabular-nums text-gray-300">{shortRupiah(max * g)}</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
          ))}
        </div>

        {/* bar */}
        <div className="absolute bottom-0 left-14 right-0 flex items-end justify-around gap-3" style={{ height: H }}>
          {data.map((d) => {
            const h = Math.max(10, (Number(d.revenue) / max) * (H - 8))
            return (
              <div key={d.month} className="flex flex-1 flex-col items-center justify-end" style={{ maxWidth: 64 }}>
                <span className="mb-1 whitespace-nowrap text-[10px] font-bold text-brand-700">{shortRupiah(d.revenue)}</span>
                <div
                  className="w-full rounded-t-lg"
                  style={{
                    height: h,
                    maxWidth: 48,
                    background: 'linear-gradient(180deg, #4bb377 0%, #257449 55%, #1a4a32 100%)',
                    boxShadow: '0 -3px 12px rgba(37,116,73,0.28)',
                  }}
                  title={`${monthLabel(d.month)}: Rp${Number(d.revenue).toLocaleString('id-ID')} · ${d.bookings} pesanan`}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* label bulan */}
      <div className="ml-14 mt-2 flex justify-around gap-3">
        {data.map((d) => (
          <span key={d.month} className="flex-1 text-center text-[11px] font-medium text-gray-500" style={{ maxWidth: 64 }}>
            {monthLabel(d.month)}
          </span>
        ))}
      </div>
    </div>
  )
}
