import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  Percent,
  CalendarClock,
  Star,
  Plus,
  ArrowRight,
  Clock,
  AlertTriangle,
  BedDouble,
  Users,
  Building2,
  ImagePlus,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import api from '../../lib/api'
import { rupiah } from '../../lib/format'
import { PageLoader } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import {
  useOwnerTheme,
  Panel,
  StatTile,
  BookingStatusPill,
  PropertyStatusPill,
  GoldButton,
  dmy,
  shortRupiah,
  monthLabel,
  greeting,
  ymdParts,
} from './kit'

export default function OwnerDashboard() {
  useOwnerTheme('Ringkasan')
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/owner/dashboard')
      .then((res) => setData(res.data))
      .catch((e) => setError(e.response?.data?.message || 'Gagal memuat ringkasan.'))
  }, [])

  if (error) return <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
  if (!data) return <PageLoader />

  const { stats, monthly, upcoming_checkins: upcoming, recent_bookings: recent, top_properties: top } = data
  const firstName = user?.name?.split(' ')[0]

  return (
    <div className="space-y-6">
      {/* ===== Hero ===== */}
      <section
        className="relative overflow-hidden rounded-3xl px-6 py-7 text-white sm:px-8 sm:py-8"
        style={{ background: 'radial-gradient(80% 120% at 100% 0%, #2a7a4f 0%, transparent 55%), linear-gradient(135deg, #143a26 0%, #0b2117 100%)' }}
      >
        <span className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,#e0c268_1px,transparent_0)] [background-size:22px_22px]" />
        <img src="/logo-sm.webp" alt="" className="pointer-events-none absolute -right-10 -top-6 hidden h-56 w-56 rotate-6 rounded-[2.5rem] object-cover opacity-[0.12] sm:block" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold-300">
              <Sparkles className="h-3.5 w-3.5" /> Extranet Owner
            </div>
            <h1 className="font-display text-3xl font-semibold leading-tight sm:text-[2.2rem]">
              {greeting()}, {firstName}
            </h1>
            <p className="mt-2 text-sm text-emerald-50/70">
              {stats.in_house > 0
                ? `${stats.in_house} pesanan sedang menginap hari ini · ${stats.upcoming} check-in mendatang.`
                : stats.upcoming > 0
                  ? `Ada ${stats.upcoming} check-in mendatang di properti Anda.`
                  : 'Berikut ringkasan performa properti Anda.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl bg-white/[0.07] px-5 py-3 ring-1 ring-inset ring-white/10 backdrop-blur">
              <div className="text-[11px] uppercase tracking-wider text-emerald-50/60">Total pendapatan</div>
              <div className="font-display text-xl font-semibold text-gold-200">{rupiah(stats.revenue_total)}</div>
            </div>
            <GoldButton as={Link} to="/owner/properties/new" className="self-stretch">
              <Plus className="h-4 w-4" /> Tambah Properti
            </GoldButton>
          </div>
        </div>
      </section>

      {/* ===== Pemberitahuan status properti ===== */}
      {stats.properties === 0 && <Onboarding />}
      {stats.rejected_properties > 0 && (
        <Link
          to="/owner/properties?status=rejected"
          className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 transition hover:shadow-md"
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>
            <strong>{stats.rejected_properties} properti</strong> perlu diperbaiki sesuai catatan admin sebelum dapat tayang.
          </span>
          <ArrowRight className="ml-auto h-4 w-4" />
        </Link>
      )}
      {stats.pending_properties > 0 && (
        <Link
          to="/owner/properties?status=pending"
          className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 transition hover:shadow-md"
        >
          <Clock className="h-5 w-5 flex-shrink-0" />
          <span>
            <strong>{stats.pending_properties} properti</strong> sedang ditinjau tim Bamboe Oerip. Anda akan mendapat notifikasi setelah disetujui.
          </span>
          <ArrowRight className="ml-auto h-4 w-4" />
        </Link>
      )}

      {/* ===== Statistik ===== */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile label="Pendapatan bulan ini" value={shortRupiah(stats.revenue_month)} hint="nilai sewa · berdasar check-in" icon={Wallet} tone="gold" />
        <StatTile label="Okupansi bulan ini" value={`${String(stats.occupancy_month).replace('.', ',')}%`} hint={`${stats.nights_month} malam terjual`} icon={Percent} tone="green" />
        <StatTile label="Check-in mendatang" value={stats.upcoming} hint={`${stats.awaiting_payment} menunggu pembayaran`} icon={CalendarClock} tone="sky" />
        <StatTile
          label="Rating tamu"
          value={stats.review_count > 0 ? String(Number(stats.rating_avg).toFixed(1)).replace('.', ',') : '—'}
          hint={`${stats.review_count} ulasan`}
          icon={Star}
          tone="violet"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Pendapatan 6 bulan"
          subtitle="Nilai sewa pesanan terbayar, dikelompokkan per bulan check-in"
          action={
            <span className="whitespace-nowrap rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700 ring-1 ring-inset ring-gold-200">
              {shortRupiah(monthly.reduce((s, m) => s + Number(m.revenue), 0))}
            </span>
          }
        >
          <RevenueChart data={monthly} />
        </Panel>

        <Panel
          title="Check-in mendatang"
          subtitle="Pesanan terkonfirmasi"
          bodyClass="p-2"
          action={
            <Link to="/owner/bookings?status=confirmed" className="text-xs font-semibold text-brand-700 hover:underline">
              Semua
            </Link>
          }
        >
          {upcoming.length === 0 ? (
            <Empty text="Belum ada check-in terjadwal." />
          ) : (
            <ul>
              {upcoming.map((b) => (
                <li key={b.id}>
                  <Link to={`/owner/bookings/${b.id}`} className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-sand-50">
                    <DateBadge iso={b.check_in} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-brand-900">{b.guest_name}</div>
                      <div className="truncate text-xs text-gray-500">{b.villa?.name}</div>
                      <div className="mt-0.5 flex items-center gap-3 text-[11px] text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <BedDouble className="h-3 w-3" /> {b.nights} malam
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" /> {b.guests} tamu
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel
          className="xl:col-span-3"
          title="Pesanan terbaru"
          bodyClass="p-2"
          action={
            <Link to="/owner/bookings" className="text-xs font-semibold text-brand-700 hover:underline">
              Lihat semua
            </Link>
          }
        >
          {recent.length === 0 ? (
            <Empty text="Belum ada pesanan masuk." />
          ) : (
            <ul className="divide-y divide-sand-100">
              {recent.map((b) => (
                <li key={b.id}>
                  <Link to={`/owner/bookings/${b.id}`} className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-sand-50">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-brand-900">{b.guest_name}</span>
                        <span className="font-mono text-[11px] text-gray-400">{b.booking_code}</span>
                      </div>
                      <div className="truncate text-xs text-gray-500">
                        {b.villa?.name} · {dmy(b.check_in)} – {dmy(b.check_out)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold text-brand-900">{rupiah(b.subtotal)}</span>
                      <BookingStatusPill status={b.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          className="xl:col-span-2"
          title="Properti teratas"
          bodyClass="p-2"
          action={
            <Link to="/owner/properties" className="text-xs font-semibold text-brand-700 hover:underline">
              Kelola
            </Link>
          }
        >
          {top.length === 0 ? (
            <Empty text="Belum ada properti." />
          ) : (
            <ul>
              {top.map((v, i) => (
                <li key={v.id}>
                  <Link to={`/owner/properties/${v.id}/edit`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-sand-50">
                    <span className="w-4 text-center font-display text-sm font-semibold text-gold-600">{i + 1}</span>
                    <div className="h-11 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-sand-100">
                      {v.primary_image_url ? (
                        <img src={v.primary_image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="m-auto mt-3 h-5 w-5 text-sand-200" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-brand-900">{v.name}</div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <PropertyStatusPill villa={v} className="!px-2 !py-0.5 !text-[10px]" />
                        <span className="text-[11px] text-gray-400">{v.paid_bookings} pesanan</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-brand-800">{shortRupiah(v.revenue)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

function Onboarding() {
  const steps = [
    { icon: Building2, title: 'Isi data properti', text: 'Nama, lokasi, harga, kapasitas & fasilitas.' },
    { icon: ImagePlus, title: 'Unggah foto terbaik', text: 'Foto terang & rapi meningkatkan pesanan.' },
    { icon: ShieldCheck, title: 'Ditinjau admin', text: 'Properti tayang setelah disetujui.' },
  ]
  return (
    <div className="rounded-3xl border border-gold-200 bg-gradient-to-br from-gold-50 via-white to-white p-6 sm:p-8">
      <h2 className="font-display text-2xl font-semibold text-brand-900">Mulai tayangkan properti pertama Anda</h2>
      <p className="mt-1 text-sm text-gray-600">Hanya butuh beberapa menit. Ikuti tiga langkah berikut:</p>
      <ol className="mt-6 grid gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-800 text-gold-200">
              <s.icon className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-semibold text-brand-900">
                {i + 1}. {s.title}
              </div>
              <div className="text-xs text-gray-500">{s.text}</div>
            </div>
          </li>
        ))}
      </ol>
      <GoldButton as={Link} to="/owner/properties/new" className="mt-6">
        <Plus className="h-4 w-4" /> Tambah Properti Sekarang
      </GoldButton>
    </div>
  )
}

function Empty({ text }) {
  return <p className="px-3 py-10 text-center text-sm text-gray-400">{text}</p>
}

function DateBadge({ iso }) {
  const [y, m, d] = ymdParts(iso) || ['', '', '']
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES']
  return (
    <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-brand-800 text-white">
      <span className="font-display text-lg font-semibold leading-none">{d}</span>
      <span className="mt-0.5 text-[9px] font-semibold tracking-wider text-gold-300">
        {months[Number(m) - 1]} {y?.slice(2)}
      </span>
    </div>
  )
}

/** Grafik area SVG (responsif) — emas di atas hijau tua. */
function RevenueChart({ data }) {
  const W = 640
  const H = 220
  const pad = { l: 36, r: 36, t: 26, b: 12 }
  const max = Math.max(...data.map((d) => Number(d.revenue)), 1)
  const step = (W - pad.l - pad.r) / Math.max(1, data.length - 1)
  const pts = data.map((d, i) => [pad.l + i * step, pad.t + (1 - Number(d.revenue) / max) * (H - pad.t - pad.b)])
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1][0]},${H - pad.b} L${pts[0][0]},${H - pad.b} Z`
  const empty = data.every((d) => Number(d.revenue) === 0)

  return (
    <div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full" preserveAspectRatio="none" role="img" aria-label="Grafik pendapatan 6 bulan">
          <defs>
            <linearGradient id="ownerArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <line key={g} x1={pad.l} x2={W - pad.r} y1={pad.t + g * (H - pad.t - pad.b)} y2={pad.t + g * (H - pad.t - pad.b)} stroke="#f2ebdf" strokeWidth="1" />
          ))}
          <path d={area} fill="url(#ownerArea)" />
          <path d={line} fill="none" stroke="#257449" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* titik & label HTML agar tidak ikut melar */}
        <div className="pointer-events-none absolute inset-0">
          {pts.map(([x, y], i) => (
            <div key={data[i].month} className="absolute" style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}>
              <span className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-gold-500 shadow" style={{ width: 11, height: 11 }} />
              {Number(data[i].revenue) > 0 && (
                <span className="absolute -translate-x-1/2 -translate-y-[170%] whitespace-nowrap text-[10px] font-bold text-brand-800">
                  {shortRupiah(data[i].revenue)}
                </span>
              )}
            </div>
          ))}
        </div>
        {empty && (
          <p className="absolute inset-x-0 top-1/3 text-center text-sm text-gray-400">Belum ada pendapatan dalam 6 bulan terakhir.</p>
        )}
      </div>
      <div className="relative mt-1 h-5">
        {data.map((d, i) => (
          <span
            key={d.month}
            className="absolute -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-gray-500"
            style={{ left: `${(pts[i][0] / W) * 100}%` }}
          >
            {monthLabel(d.month)}
          </span>
        ))}
      </div>
    </div>
  )
}
