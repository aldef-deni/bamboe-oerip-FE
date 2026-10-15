import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, CalendarCheck, Users, BedDouble, ArrowUpDown } from 'lucide-react'
import api from '../../lib/api'
import { rupiah } from '../../lib/format'
import { PageLoader } from '../../components/ui'
import DateRangePicker from '../../components/DateRangePicker'
import { useOwnerTheme, PageHeader, Panel, BookingStatusPill, BOOKING_STATUS, dmy } from './kit'

const STATUS_TABS = [{ key: '', label: 'Semua' }, ...Object.entries(BOOKING_STATUS).map(([key, v]) => ({ key, label: v.label }))]

export default function OwnerBookings() {
  useOwnerTheme('Pesanan')
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || ''
  const [villas, setVillas] = useState([])
  const [villaId, setVillaId] = useState('')
  const [range, setRange] = useState({ from: '', to: '' })
  const [sort, setSort] = useState('created_at')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/owner/villas').then((res) => setVillas(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setPage(1)
  }, [status, villaId, range.from, range.to, sort, query])

  useEffect(() => {
    setLoading(true)
    api
      .get('/owner/bookings', {
        params: {
          status: status || undefined,
          villa_id: villaId || undefined,
          from: range.from || undefined,
          to: range.to || undefined,
          search: query || undefined,
          sort,
          page,
          per_page: 15,
        },
      })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [status, villaId, range.from, range.to, sort, query, page])

  const rows = data?.data || []

  return (
    <div>
      <PageHeader eyebrow="Reservasi" title="Pesanan" subtitle="Semua pesanan tamu pada properti Anda. Pembayaran diverifikasi oleh tim Bamboe Oerip." />

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setParams(t.key ? { status: t.key } : {})}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              status === t.key ? 'bg-brand-800 text-white shadow-md shadow-brand-900/20' : 'bg-white text-gray-600 ring-1 ring-inset ring-sand-200 hover:bg-sand-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_220px_300px_auto]">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setQuery(search.trim())
          }}
          className="flex items-center gap-2 rounded-xl border border-sand-200 bg-white px-3"
        >
          <Search className="h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kode pesanan / nama tamu…" className="w-full bg-transparent py-2.5 text-sm outline-none" />
        </form>
        <select value={villaId} onChange={(e) => setVillaId(e.target.value)} className="rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm outline-none">
          <option value="">Semua properti</option>
          {villas.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <DateRangePicker
          checkIn={range.from}
          checkOut={range.to}
          onChange={({ check_in, check_out }) => setRange({ from: check_in, to: check_out })}
          minDate="2020-01-01"
          showNights={false}
          autoFillEnd={false}
          placeholder="Tanggal check-in (semua)"
        />
        <button
          onClick={() => setSort((s) => (s === 'created_at' ? 'check_in' : 'created_at'))}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-brand-800 ring-1 ring-inset ring-sand-200 hover:bg-sand-50"
        >
          <ArrowUpDown className="h-4 w-4" /> {sort === 'check_in' ? 'Urut: check-in' : 'Urut: terbaru'}
        </button>
      </div>

      {loading && !data ? (
        <PageLoader />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-sand-200">
          <CalendarCheck className="mx-auto h-10 w-10 text-gold-400" />
          <p className="mt-3 text-sm text-gray-500">Belum ada pesanan pada filter ini.</p>
        </div>
      ) : (
        <div className={loading ? 'opacity-60 transition' : 'transition'}>
          {/* Mobile */}
          <div className="space-y-3 md:hidden">
            {rows.map((b) => (
              <Link key={b.id} to={`/owner/bookings/${b.id}`} className="block rounded-2xl border border-sand-200/70 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-brand-900">{b.guest_name}</div>
                    <div className="font-mono text-[11px] text-gray-400">{b.booking_code}</div>
                  </div>
                  <BookingStatusPill status={b.status} />
                </div>
                <div className="mt-2 truncate text-xs text-gray-500">{b.villa?.name}</div>
                <div className="mt-3 flex items-center justify-between border-t border-sand-100 pt-3 text-xs text-gray-600">
                  <span>
                    {dmy(b.check_in)} → {dmy(b.check_out)}
                  </span>
                  <span className="font-semibold text-brand-900">{rupiah(b.subtotal)}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop */}
          <Panel bodyClass="p-0" className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-sand-50 text-[11px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Tamu</th>
                    <th className="px-5 py-3 font-semibold">Properti</th>
                    <th className="px-5 py-3 font-semibold">Menginap</th>
                    <th className="px-5 py-3 font-semibold">Nilai sewa</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {rows.map((b) => (
                    <tr key={b.id} className="group cursor-pointer transition hover:bg-sand-50/70">
                      <td className="px-5 py-3.5">
                        <Link to={`/owner/bookings/${b.id}`} className="block">
                          <div className="font-semibold text-brand-900 group-hover:underline">{b.guest_name}</div>
                          <div className="font-mono text-[11px] text-gray-400">{b.booking_code}</div>
                        </Link>
                      </td>
                      <td className="max-w-[220px] truncate px-5 py-3.5 text-gray-600">{b.villa?.name}</td>
                      <td className="px-5 py-3.5">
                        <div className="text-gray-800">
                          {dmy(b.check_in)} → {dmy(b.check_out)}
                        </div>
                        <div className="mt-0.5 flex gap-3 text-[11px] text-gray-400">
                          <span className="inline-flex items-center gap-1">
                            <BedDouble className="h-3 w-3" /> {b.nights} malam
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" /> {b.guests} tamu
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-brand-900">{rupiah(b.subtotal)}</td>
                      <td className="px-5 py-3.5">
                        <BookingStatusPill status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {data.last_page > 1 && (
            <div className="mt-5 flex items-center justify-between text-sm text-gray-500">
              <span>
                {data.from}–{data.to} dari {data.total} pesanan
              </span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg bg-white p-2 ring-1 ring-sand-200 disabled:opacity-40" aria-label="Sebelumnya">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)} className="rounded-lg bg-white p-2 ring-1 ring-sand-200 disabled:opacity-40" aria-label="Berikutnya">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
