import { useEffect, useState } from 'react'
import { Wallet, Receipt, BedDouble, TrendingUp, FileSpreadsheet } from 'lucide-react'
import api from '../../lib/api'
import { rupiah } from '../../lib/format'
import { PageLoader } from '../../components/ui'
import DateRangePicker from '../../components/DateRangePicker'
import { useOwnerTheme, PageHeader, Panel, StatTile, BookingStatusPill, BOOKING_STATUS, dmy, shortRupiah } from './kit'

export default function OwnerReports() {
  useOwnerTheme('Laporan Pendapatan')
  const [villas, setVillas] = useState([])
  const [villaId, setVillaId] = useState('')
  const [range, setRange] = useState({ from: '', to: '' })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    api.get('/owner/villas').then((res) => setVillas(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    api
      .get('/owner/reports', { params: { from: range.from || undefined, to: range.to || undefined, villa_id: villaId || undefined } })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [range.from, range.to, villaId])

  const exportExcel = async () => {
    if (!data?.transactions?.length) return
    setExporting(true)
    try {
      const XLSX = await import('xlsx')
      const period = range.from ? `${dmy(range.from)} - ${dmy(range.to || range.from)}` : 'Semua periode'
      const rows = data.transactions.map((t, i) => ({
        No: i + 1,
        'Kode Pesanan': t.booking_code,
        Properti: t.villa,
        Tamu: t.guest_name,
        'Jml Tamu': t.guests,
        'Check-in': dmy(t.check_in),
        'Check-out': dmy(t.check_out),
        Malam: t.nights,
        'Harga/Malam': t.price_per_night,
        'Nilai Sewa': t.revenue,
        Status: BOOKING_STATUS[t.status]?.label || t.status,
      }))
      const ws = XLSX.utils.aoa_to_sheet([
        ['Laporan Pendapatan Owner — Bamboe Oerip'],
        [`Periode check-in: ${period}`],
        [`Total nilai sewa: ${rupiah(data.summary.revenue)} · ${data.summary.count} pesanan · ${data.summary.nights} malam`],
        [],
      ])
      XLSX.utils.sheet_add_json(ws, rows, { origin: 'A5' })
      ws['!cols'] = [6, 16, 28, 22, 9, 12, 12, 8, 14, 14, 16].map((w) => ({ wch: w }))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Pendapatan')
      const stamp = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `laporan-pendapatan-bamboe-oerip-${stamp}.xlsx`)
    } catch (e) {
      console.error(e)
      alert('Gagal membuat file Excel.')
    } finally {
      setExporting(false)
    }
  }

  if (!data) return <PageLoader />
  const s = data.summary
  const maxRev = Math.max(...data.per_property.map((p) => p.revenue), 1)

  return (
    <div>
      <PageHeader
        eyebrow="Keuangan"
        title="Laporan Pendapatan"
        subtitle="Nilai sewa dari pesanan terbayar (terkonfirmasi & selesai), berdasarkan tanggal check-in."
        actions={
          <button
            onClick={exportExcel}
            disabled={exporting || !data.transactions.length}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 ring-1 ring-inset ring-sand-200 transition hover:bg-sand-50 disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> {exporting ? 'Menyiapkan…' : 'Unduh Excel'}
          </button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-[300px_240px]">
        <DateRangePicker
          checkIn={range.from}
          checkOut={range.to}
          onChange={({ check_in, check_out }) => setRange({ from: check_in, to: check_out })}
          minDate="2020-01-01"
          showNights={false}
          autoFillEnd={false}
          placeholder="Semua tanggal — pilih rentang"
        />
        <select value={villaId} onChange={(e) => setVillaId(e.target.value)} className="rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm outline-none">
          <option value="">Semua properti</option>
          {villas.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      <div className={loading ? 'opacity-60 transition' : 'transition'}>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatTile label="Total nilai sewa" value={shortRupiah(s.revenue)} hint={rupiah(s.revenue)} icon={Wallet} tone="gold" />
          <StatTile label="Pesanan terbayar" value={s.count} hint={`${s.guests} tamu`} icon={Receipt} tone="green" />
          <StatTile label="Malam terjual" value={s.nights} hint="room night" icon={BedDouble} tone="sky" />
          <StatTile label="Rata-rata / malam" value={shortRupiah(s.adr)} hint="ADR" icon={TrendingUp} tone="violet" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <Panel title="Per properti">
            {data.per_property.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Belum ada data.</p>
            ) : (
              <ul className="space-y-4">
                {data.per_property.map((p) => (
                  <li key={p.villa_id}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-brand-900">{p.villa}</span>
                      <span className="font-semibold text-brand-900">{shortRupiah(p.revenue)}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-800" style={{ width: `${(p.revenue / maxRev) * 100}%` }} />
                    </div>
                    <div className="mt-1 text-[11px] text-gray-400">
                      {p.bookings} pesanan · {p.nights} malam
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Rincian transaksi" subtitle={data.transactions.length >= 500 ? 'Menampilkan 500 transaksi terbaru' : `${data.transactions.length} transaksi`} bodyClass="p-0">
            {data.transactions.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">Belum ada pesanan terbayar pada periode ini.</p>
            ) : (
              <div className="max-h-[560px] overflow-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="sticky top-0 bg-sand-50 text-[11px] uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Pesanan</th>
                      <th className="px-5 py-3 font-semibold">Menginap</th>
                      <th className="px-5 py-3 text-right font-semibold">Nilai sewa</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100">
                    {data.transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-sand-50/60">
                        <td className="px-5 py-3">
                          <div className="font-medium text-brand-900">{t.guest_name}</div>
                          <div className="text-[11px] text-gray-400">
                            <span className="font-mono">{t.booking_code}</span> · {t.villa}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {dmy(t.check_in)} → {dmy(t.check_out)}
                          <div className="text-[11px] text-gray-400">
                            {t.nights} malam × {rupiah(t.price_per_night)}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-brand-900">{rupiah(t.revenue)}</td>
                        <td className="px-5 py-3">
                          <BookingStatusPill status={t.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
