import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, Receipt, Tag, FileText, FileSpreadsheet } from 'lucide-react'
import api from '../../lib/api'
import { rupiah, formatDate, formatDateTime, STATUS_LABELS, STATUS_COLORS } from '../../lib/format'
import { PageLoader, Badge, EmptyState, MobileList, DesktopTable, DataCard } from '../../components/ui'
import DateRangePicker from '../../components/DateRangePicker'
import { exportReportPdf, exportReportExcel } from '../../lib/reportExport'

export default function AdminReports() {
  const [range, setRange] = useState({ from: '', to: '' })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({})
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    setLoading(true)
    api
      .get('/admin/reports', { params: { from: range.from || undefined, to: range.to || undefined } })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [range.from, range.to])

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => setSettings(res.data || {}))
      .catch(() => setSettings({}))
  }, [])

  const handleExport = async (type) => {
    if (!data || !(data.transactions?.length)) return
    setExporting(type)
    try {
      if (type === 'pdf') await exportReportPdf(data, range, settings)
      else exportReportExcel(data, range, settings)
    } catch (e) {
      alert('Gagal membuat file export. Coba lagi.')
      console.error(e)
    } finally {
      setExporting('')
    }
  }

  const s = data?.summary
  const tx = data?.transactions || []

  const cards = s
    ? [
        { label: 'Jumlah Transaksi', value: s.count, icon: Receipt, sub: 'pesanan dibayar' },
        { label: 'Nilai Transaksi', value: rupiah(s.total), icon: Wallet, sub: 'total dibayar customer' },
        {
          label: 'Keuntungan (Biaya Layanan)',
          value: rupiah(s.service_fee),
          icon: TrendingUp,
          highlight: true,
          sub: 'pendapatan bersih platform',
        },
        { label: 'Total Diskon Promo', value: rupiah(s.discount), icon: Tag, sub: 'potongan diberikan' },
      ]
    : []

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
          <p className="mt-1 text-sm text-gray-500">Detail transaksi & pendapatan dari pesanan yang dibayar.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
          <div className="w-full sm:w-80">
            <label className="mb-1 block text-xs font-medium text-gray-500">Rentang tanggal</label>
            <DateRangePicker
              checkIn={range.from}
              checkOut={range.to}
              onChange={({ check_in, check_out }) => setRange({ from: check_in, to: check_out })}
              minDate="2020-01-01"
              showNights={false}
              autoFillEnd={false}
              placeholder="Semua tanggal — pilih rentang"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('pdf')}
              disabled={!tx.length || exporting === 'pdf'}
              title="Export PDF"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              <FileText className="h-4 w-4" />
              {exporting === 'pdf' ? 'Membuat…' : 'PDF'}
            </button>
            <button
              onClick={() => handleExport('xlsx')}
              disabled={!tx.length || exporting === 'xlsx'}
              title="Export Excel"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {exporting === 'xlsx' ? 'Membuat…' : 'Excel'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <>
          {/* Ringkasan */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {cards.map((c) => (
              <div
                key={c.label}
                className={`rounded-2xl border p-4 sm:p-5 ${
                  c.highlight ? 'border-brand-200 bg-gradient-to-br from-brand-50 to-gold-50/50' : 'border-gray-100 bg-white'
                }`}
              >
                <div
                  className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${
                    c.highlight ? 'bg-brand-600 text-gold-200' : 'bg-brand-50 text-brand-600'
                  }`}
                >
                  <c.icon className="h-5 w-5" />
                </div>
                <div className={`font-bold text-gray-900 ${String(c.value).length > 10 ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'}`}>
                  {c.value}
                </div>
                <div className="text-xs font-medium text-gray-600 sm:text-sm">{c.label}</div>
                <div className="mt-0.5 text-[11px] text-gray-400 sm:text-xs">{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Tabel transaksi */}
          <div className="mt-6">
            <h2 className="mb-3 font-semibold text-gray-900">Detail Transaksi ({tx.length})</h2>
            {tx.length === 0 ? (
              <EmptyState icon={Receipt} title="Belum ada transaksi" subtitle="Tidak ada pesanan dibayar pada rentang ini." />
            ) : (
              <>
                {/* Mobile: kartu */}
                <MobileList>
                  {tx.map((t) => (
                    <DataCard key={t.id}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-gray-900">{t.villa}</div>
                          <div className="font-mono text-[11px] text-gray-400">{t.booking_code}</div>
                        </div>
                        <Badge className={`flex-shrink-0 ${STATUS_COLORS[t.status]}`}>{STATUS_LABELS[t.status]}</Badge>
                      </div>

                      <div className="mt-2 text-xs text-gray-500">
                        {t.customer || t.guest_name} · {formatDate(t.check_in)}–{formatDate(t.check_out)}
                      </div>

                      <dl className="mt-3 space-y-1.5 border-t border-gray-50 pt-3 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Subtotal</dt>
                          <dd className="text-gray-700">{rupiah(t.subtotal)}</dd>
                        </div>
                        {Number(t.discount) > 0 && (
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Diskon</dt>
                            <dd className="text-gray-500">−{rupiah(t.discount)}</dd>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Biaya layanan</dt>
                          <dd className="font-medium text-brand-700">{rupiah(t.service_fee)}</dd>
                        </div>
                        <div className="flex justify-between border-t border-gray-50 pt-1.5">
                          <dt className="font-semibold text-gray-800">Total</dt>
                          <dd className="font-semibold text-gray-900">{rupiah(t.total)}</dd>
                        </div>
                      </dl>

                      <div className="mt-2 text-[11px] text-gray-400">{formatDateTime(t.created_at)}</div>
                    </DataCard>
                  ))}

                  {s && (
                    <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-gold-50/50 p-4">
                      <div className="mb-2 text-sm font-semibold text-gray-900">Total keseluruhan</div>
                      <dl className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Subtotal</dt>
                          <dd className="text-gray-800">{rupiah(s.subtotal)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Diskon</dt>
                          <dd className="text-gray-800">−{rupiah(s.discount)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Keuntungan (biaya layanan)</dt>
                          <dd className="font-semibold text-brand-700">{rupiah(s.service_fee)}</dd>
                        </div>
                        <div className="flex justify-between border-t border-brand-200/60 pt-1.5">
                          <dt className="font-semibold text-gray-900">Nilai transaksi</dt>
                          <dd className="font-bold text-gray-900">{rupiah(s.total)}</dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </MobileList>

                {/* Desktop: tabel */}
                <DesktopTable>
                  <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Kode / Tanggal</th>
                      <th className="px-4 py-3">Villa</th>
                      <th className="px-4 py-3">Pelanggan</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                      <th className="px-4 py-3 text-right">Diskon</th>
                      <th className="px-4 py-3 text-right">Biaya Layanan</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tx.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs text-gray-700">{t.booking_code}</div>
                          <div className="text-[11px] text-gray-400">{formatDateTime(t.created_at)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-800">{t.villa}</div>
                          <div className="text-xs text-gray-400">
                            {formatDate(t.check_in)}–{formatDate(t.check_out)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{t.customer || t.guest_name}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{rupiah(t.subtotal)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {Number(t.discount) > 0 ? `−${rupiah(t.discount)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-brand-700">{rupiah(t.service_fee)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{rupiah(t.total)}</td>
                        <td className="px-4 py-3">
                          <Badge className={STATUS_COLORS[t.status]}>{STATUS_LABELS[t.status]}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {s && (
                    <tfoot className="border-t border-gray-100 bg-gray-50 text-sm font-semibold text-gray-800">
                      <tr>
                        <td className="px-4 py-3" colSpan={3}>
                          Total
                        </td>
                        <td className="px-4 py-3 text-right">{rupiah(s.subtotal)}</td>
                        <td className="px-4 py-3 text-right">−{rupiah(s.discount)}</td>
                        <td className="px-4 py-3 text-right text-brand-700">{rupiah(s.service_fee)}</td>
                        <td className="px-4 py-3 text-right">{rupiah(s.total)}</td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  )}
                </DesktopTable>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
