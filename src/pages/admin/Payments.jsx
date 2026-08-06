import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, X, Eye, Trash2 } from 'lucide-react'
import api from '../../lib/api'
import { rupiah, formatDateTime } from '../../lib/format'
import { PageLoader, Badge, EmptyState, Button, MobileList, DesktopTable, DataCard } from '../../components/ui'

const PAY_STATUS = {
  awaiting: { label: 'Menunggu Bayar', cls: 'bg-amber-100 text-amber-700' },
  submitted: { label: 'Perlu Verifikasi', cls: 'bg-blue-100 text-blue-700' },
  verified: { label: 'Terverifikasi', cls: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-700' },
}

export default function AdminPayments() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(null)
  const [selected, setSelected] = useState(() => new Set())
  const [deleting, setDeleting] = useState(false)
  const status = searchParams.get('status') || 'submitted'

  const load = () => {
    setLoading(true)
    setSelected(new Set())
    api
      .get('/admin/payments', { params: { status: status === 'all' ? '' : status, per_page: 50 } })
      .then((res) => setPayments(res.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [status])

  const verify = async (p) => {
    await api.post(`/admin/payments/${p.id}/verify`)
    load()
  }

  const reject = async (p) => {
    const note = prompt('Alasan penolakan (opsional):') ?? ''
    await api.post(`/admin/payments/${p.id}/reject`, { note })
    load()
  }

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const allChecked = payments.length > 0 && selected.size === payments.length
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(payments.map((p) => p.id)))

  const bulkDelete = async () => {
    const ids = [...selected]
    if (ids.length === 0) return
    if (!window.confirm(`Hapus permanen ${ids.length} data pembayaran? Tindakan ini tidak dapat dibatalkan.`)) return
    setDeleting(true)
    try {
      await api.post('/admin/payments/bulk-delete', { ids })
      setPayments((ps) => ps.filter((p) => !selected.has(p.id)))
      setSelected(new Set())
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal menghapus data pembayaran.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Verifikasi Pembayaran</h1>
        {selected.size > 0 && (
          <button
            onClick={bulkDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Menghapus…' : `Hapus (${selected.size})`}
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {['submitted', 'verified', 'rejected', 'all'].map((s) => (
          <button
            key={s}
            onClick={() => setSearchParams({ status: s })}
            className={`rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium ${
              status === s ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {s === 'all' ? 'Semua' : PAY_STATUS[s]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : payments.length === 0 ? (
        <EmptyState title="Tidak ada pembayaran" subtitle="Pembayaran akan muncul di sini." />
      ) : (
        <>
          {/* Mobile: kartu */}
          <MobileList>
            <label className="flex items-center gap-2 px-1 text-xs font-medium text-gray-500">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Pilih semua ({payments.length})
            </label>
            {payments.map((p) => (
              <DataCard key={p.id} active={selected.has(p.id)}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                    className="mt-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-gray-900">{p.booking?.villa?.name}</div>
                        <div className="font-mono text-[11px] text-gray-400">{p.booking?.booking_code}</div>
                      </div>
                      <Badge className={`flex-shrink-0 ${PAY_STATUS[p.status]?.cls}`}>{PAY_STATUS[p.status]?.label}</Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-wide text-gray-400">Jumlah</div>
                        <div className="font-semibold text-gray-900">{rupiah(p.amount)}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-wide text-gray-400">Pengirim</div>
                        <div className="truncate text-sm text-gray-800">{p.sender_name || '-'}</div>
                        <div className="truncate text-xs text-gray-400">{p.bank_name}</div>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-gray-400">{p.paid_at ? formatDateTime(p.paid_at) : '-'}</div>

                    <div className="mt-3 flex gap-2 border-t border-gray-50 pt-3">
                      {p.proof_url && (
                        <button
                          onClick={() => setPreview(p.proof_url)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700"
                        >
                          <Eye className="h-4 w-4" /> Bukti
                        </button>
                      )}
                      {p.status === 'submitted' && (
                        <>
                          <button
                            onClick={() => verify(p)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white"
                          >
                            <Check className="h-4 w-4" /> Verifikasi
                          </button>
                          <button
                            onClick={() => reject(p)}
                            className="flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600"
                          >
                            <X className="h-4 w-4" /> Tolak
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </DataCard>
            ))}
          </MobileList>

          {/* Desktop: tabel */}
          <DesktopTable>
            <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    title="Pilih semua"
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
                <th className="px-4 py-3">Pesanan</th>
                <th className="px-4 py-3">Jumlah</th>
                <th className="px-4 py-3">Pengirim</th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((p) => (
                <tr key={p.id} className={selected.has(p.id) ? 'bg-brand-50/60' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleOne(p.id)}
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-gray-700">{p.booking?.booking_code}</div>
                    <div className="text-xs text-gray-400">{p.booking?.villa?.name}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{rupiah(p.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">{p.sender_name || '-'}</div>
                    <div className="text-xs text-gray-400">{p.bank_name}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{p.paid_at ? formatDateTime(p.paid_at) : '-'}</td>
                  <td className="px-4 py-3">
                    <Badge className={PAY_STATUS[p.status]?.cls}>{PAY_STATUS[p.status]?.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {p.proof_url && (
                        <button onClick={() => setPreview(p.proof_url)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" title="Lihat bukti">
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      {p.status === 'submitted' && (
                        <>
                          <button onClick={() => verify(p)} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" title="Verifikasi">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => reject(p)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Tolak">
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DesktopTable>
        </>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreview(null)}>
          <div className="max-h-[85vh] max-w-lg overflow-auto rounded-2xl bg-white p-3" onClick={(e) => e.stopPropagation()}>
            <img src={preview} alt="Bukti transfer" className="w-full rounded-xl" />
            <Button variant="ghost" className="mt-2 w-full" onClick={() => setPreview(null)}>
              Tutup
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
