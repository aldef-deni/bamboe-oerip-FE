import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import { rupiah, formatDate, formatDateTime, STATUS_LABELS, STATUS_COLORS } from '../../lib/format'
import { PageLoader, EmptyState, MobileList, DesktopTable, DataCard } from '../../components/ui'

const STATUSES = ['pending', 'awaiting_verification', 'confirmed', 'completed', 'cancelled', 'rejected']

export default function AdminBookings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(() => new Set())
  const [deleting, setDeleting] = useState(false)
  const [proof, setProof] = useState(null)
  const status = searchParams.get('status') || ''

  const load = () => {
    setLoading(true)
    setSelected(new Set())
    api
      .get('/admin/bookings', { params: { status, per_page: 50 } })
      .then((res) => setBookings(res.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [status])

  const changeStatus = async (booking, newStatus) => {
    const res = await api.put(`/admin/bookings/${booking.id}/status`, { status: newStatus })
    setBookings((bs) => bs.map((b) => (b.id === booking.id ? { ...b, status: res.data.status } : b)))
  }

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allChecked = bookings.length > 0 && selected.size === bookings.length

  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(bookings.map((b) => b.id)))
  }

  const bulkDelete = async () => {
    const ids = [...selected]
    if (ids.length === 0) return
    if (!window.confirm(`Hapus permanen ${ids.length} pesanan? Tindakan ini tidak dapat dibatalkan.`)) return

    setDeleting(true)
    try {
      await api.post('/admin/bookings/bulk-delete', { ids })
      setBookings((bs) => bs.filter((b) => !selected.has(b.id)))
      setSelected(new Set())
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal menghapus pesanan.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Pesanan</h1>
        {selected.size > 0 && (
          <button
            onClick={bulkDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
          >
            <TrashIcon />
            {deleting ? 'Menghapus…' : `Hapus (${selected.size})`}
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip active={!status} onClick={() => setSearchParams({})}>
          Semua
        </FilterChip>
        {STATUSES.map((s) => (
          <FilterChip key={s} active={status === s} onClick={() => setSearchParams({ status: s })}>
            {STATUS_LABELS[s]}
          </FilterChip>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : bookings.length === 0 ? (
        <EmptyState title="Tidak ada pesanan" />
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
              Pilih semua ({bookings.length})
            </label>

            {bookings.map((b) => (
              <DataCard key={b.id} active={selected.has(b.id)}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(b.id)}
                    onChange={() => toggleOne(b.id)}
                    className="mt-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-gray-900">{b.villa?.name}</div>
                        <div className="font-mono text-[11px] text-gray-400">{b.booking_code}</div>
                        <div className="text-[11px] text-gray-400">{formatDateTime(b.created_at)}</div>
                      </div>
                      {b.payment?.proof_url ? (
                        <button
                          onClick={() => setProof(b)}
                          title="Lihat bukti transfer"
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"
                        >
                          <EyeIcon />
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-wide text-gray-400">Tamu</div>
                        <div className="truncate text-gray-800">{b.guest_name}</div>
                        <div className="truncate text-xs text-gray-400">{b.guest_phone}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-wide text-gray-400">Total</div>
                        <div className="font-semibold text-gray-900">{rupiah(b.total)}</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-[11px] uppercase tracking-wide text-gray-400">Tanggal</div>
                      <div className="text-sm text-gray-700">
                        {formatDate(b.check_in)} – {formatDate(b.check_out)}
                      </div>
                    </div>

                    <select
                      value={b.status}
                      onChange={(e) => changeStatus(b, e.target.value)}
                      className={`mt-3 w-full rounded-lg border-0 px-3 py-2.5 text-sm font-medium ${STATUS_COLORS[b.status]}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
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
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Villa</th>
                <th className="px-4 py-3">Tamu</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map((b) => (
                <tr key={b.id} className={selected.has(b.id) ? 'bg-brand-50/60' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(b.id)}
                      onChange={() => toggleOne(b.id)}
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-gray-700">{b.booking_code}</div>
                    <div className="mt-0.5 text-[11px] text-gray-400">{formatDateTime(b.created_at)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{b.villa?.name}</div>
                    <div className="text-xs text-gray-400">{b.villa?.city}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">{b.guest_name}</div>
                    <div className="text-xs text-gray-400">{b.guest_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(b.check_in)} – {formatDate(b.check_out)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{rupiah(b.total)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={b.status}
                      onChange={(e) => changeStatus(b, e.target.value)}
                      className={`rounded-lg border-0 px-2 py-1 text-xs font-medium ${STATUS_COLORS[b.status]}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {b.payment?.proof_url ? (
                      <button
                        onClick={() => setProof(b)}
                        title="Lihat bukti transfer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-600 transition hover:bg-brand-50"
                      >
                        <EyeIcon />
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </DesktopTable>
        </>
      )}

      {proof && <ProofModal booking={proof} onClose={() => setProof(null)} />}
    </div>
  )
}

function ProofModal({ booking, onClose }) {
  const p = booking.payment

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="font-semibold text-gray-900">Bukti Transfer</h3>
            <p className="font-mono text-xs text-gray-400">{booking.booking_code}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <dl className="mb-4 grid grid-cols-2 gap-3">
            <Info label="Bank pengirim" value={p?.bank_name} />
            <Info label="Nama pengirim" value={p?.sender_name} />
            <Info label="Jumlah" value={rupiah(p?.amount ?? booking.total)} />
            <Info label="Waktu bayar" value={p?.paid_at ? formatDate(p.paid_at) : null} />
          </dl>

          <a href={p.proof_url} target="_blank" rel="noreferrer">
            <img
              src={p.proof_url}
              alt="Bukti transfer"
              className="w-full rounded-xl border border-gray-100 object-contain"
            />
          </a>

          <a
            href={p.proof_url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline"
          >
            Buka gambar di tab baru ↗
          </a>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-800">{value || '—'}</dd>
    </div>
  )
}

function FilterChip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
      } border border-gray-200`}
    >
      {children}
    </button>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}
