import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search, Check, X, Building2 } from 'lucide-react'
import api from '../../lib/api'
import { rupiah } from '../../lib/format'
import { PageLoader, Button, Badge, EmptyState, MobileList, DesktopTable, DataCard } from '../../components/ui'

// Status tayang + tinjauan properti (properti ajuan owner perlu disetujui)
function StatusBadge({ v }) {
  if (v.review_status === 'pending') return <Badge className="flex-shrink-0 bg-amber-100 text-amber-700">Menunggu Tinjauan</Badge>
  if (v.review_status === 'rejected') return <Badge className="flex-shrink-0 bg-red-100 text-red-700">Ditolak</Badge>
  return v.is_active ? (
    <Badge className="flex-shrink-0 bg-emerald-100 text-emerald-700">Aktif</Badge>
  ) : (
    <Badge className="flex-shrink-0 bg-gray-200 text-gray-600">Nonaktif</Badge>
  )
}

export default function AdminVillas() {
  const [params, setParams] = useSearchParams()
  const review = params.get('review') || ''
  const ownerId = params.get('owner_id') || ''
  const [villas, setVillas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(null)

  const load = (q = search) => {
    setLoading(true)
    api
      .get('/admin/villas', { params: { search: q, per_page: 50, review: review || undefined, owner_id: ownerId || undefined } })
      .then((res) => setVillas(res.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review, ownerId])

  const replace = (updated) => setVillas((vs) => vs.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)))

  const approve = async (villa) => {
    if (!confirm(`Setujui & tayangkan "${villa.name}"?`)) return
    setBusy(villa.id)
    try {
      const res = await api.post(`/admin/villas/${villa.id}/approve`)
      if (review === 'pending') setVillas((vs) => vs.filter((x) => x.id !== villa.id))
      else replace(res.data)
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyetujui properti.')
    } finally {
      setBusy(null)
    }
  }

  const reject = async (villa) => {
    const note = prompt(`Alasan / catatan perbaikan untuk owner "${villa.name}":`)
    if (note === null) return
    if (!note.trim()) return alert('Catatan perbaikan wajib diisi.')
    setBusy(villa.id)
    try {
      const res = await api.post(`/admin/villas/${villa.id}/reject`, { note: note.trim() })
      if (review === 'pending') setVillas((vs) => vs.filter((x) => x.id !== villa.id))
      else replace(res.data)
    } catch (err) {
      alert(err.response?.data?.errors?.note?.[0] || err.response?.data?.message || 'Gagal menolak properti.')
    } finally {
      setBusy(null)
    }
  }

  const reviewActions = (v, compact) =>
    v.review_status === 'pending' ? (
      <>
        <button
          onClick={() => approve(v)}
          disabled={busy === v.id}
          title="Setujui & tayangkan"
          className={compact ? 'rounded-lg p-2 text-emerald-600 hover:bg-emerald-50' : 'flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700'}
        >
          <Check className="h-4 w-4" /> {!compact && 'Setujui'}
        </button>
        <button
          onClick={() => reject(v)}
          disabled={busy === v.id}
          title="Tolak dengan catatan"
          className={compact ? 'rounded-lg p-2 text-amber-600 hover:bg-amber-50' : 'flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700'}
        >
          <X className="h-4 w-4" /> {!compact && 'Tolak'}
        </button>
      </>
    ) : null

  const remove = async (villa) => {
    if (!confirm(`Hapus villa "${villa.name}"?`)) return
    try {
      await api.delete(`/admin/villas/${villa.id}`)
      setVillas((v) => v.filter((x) => x.id !== villa.id))
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus villa.')
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Villa</h1>
        <Button as={Link} to="/admin/villas/new">
          <Plus className="h-4 w-4" /> Tambah Villa
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {[
          { key: '', label: 'Semua villa' },
          { key: 'pending', label: 'Menunggu tinjauan' },
          { key: 'rejected', label: 'Ditolak' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => {
              const next = new URLSearchParams(params)
              if (t.key) next.set('review', t.key)
              else next.delete('review')
              setParams(next)
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              review === t.key ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
        {ownerId && (
          <button
            onClick={() => {
              const next = new URLSearchParams(params)
              next.delete('owner_id')
              setParams(next)
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 ring-1 ring-brand-200"
          >
            <Building2 className="h-3.5 w-3.5" /> Filter owner <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mb-4 flex max-w-sm items-center gap-2 rounded-xl border border-gray-200 bg-white px-3">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(search)}
          placeholder="Cari villa…"
          className="w-full bg-transparent py-2.5 text-sm outline-none"
        />
      </div>

      {loading ? (
        <PageLoader />
      ) : villas.length === 0 ? (
        <EmptyState title="Belum ada villa" subtitle="Tambahkan villa pertama Anda." />
      ) : (
        <>
          {/* Mobile: kartu */}
          <MobileList>
            {villas.map((v) => (
              <DataCard key={v.id}>
                <div className="flex gap-3">
                  <div className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-brand-50">
                    {v.primary_image_url ? (
                      <img src={v.primary_image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-brand-600">
                        VB
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-gray-900">{v.name}</div>
                        <div className="truncate text-xs text-gray-400">
                          {v.type} · {v.city}
                        </div>
                      </div>
                      <StatusBadge v={v} />
                    </div>
                    <div className="mt-2 text-sm font-semibold text-gray-900">
                      {rupiah(v.price_per_night)}
                      <span className="text-xs font-normal text-gray-400"> / malam</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {v.bookings_count} pesanan{v.owner ? ` · Owner: ${v.owner.name}` : ''}
                    </div>
                  </div>
                </div>

                {v.review_status === 'rejected' && v.review_note && (
                  <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">Catatan: {v.review_note}</p>
                )}
                <div className="mt-3 flex gap-2 border-t border-gray-50 pt-3">
                  {reviewActions(v, false)}
                  <Link
                    to={`/admin/villas/${v.id}/edit`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-50 py-2.5 text-sm font-semibold text-brand-700"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </Link>
                  <button
                    onClick={() => remove(v)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600"
                  >
                    <Trash2 className="h-4 w-4" /> Hapus
                  </button>
                </div>
              </DataCard>
            ))}
          </MobileList>

          {/* Desktop: tabel */}
          <DesktopTable>
            <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Villa</th>
                <th className="px-4 py-3">Kota</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Harga</th>
                <th className="px-4 py-3">Pesanan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {villas.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-brand-50">
                        {v.primary_image_url ? (
                          <img src={v.primary_image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-brand-600">
                            VB
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{v.name}</div>
                        <div className="text-xs text-gray-400">{v.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{v.city}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {v.owner ? (
                      <Link to={`/admin/villas?owner_id=${v.owner.id}`} className="hover:text-brand-700 hover:underline">
                        {v.owner.name}
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400">Bamboe Oerip</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{rupiah(v.price_per_night)}</td>
                  <td className="px-4 py-3 text-gray-600">{v.bookings_count}</td>
                  <td className="px-4 py-3">
                    <StatusBadge v={v} />
                    {v.review_status === 'rejected' && v.review_note && (
                      <div className="mt-1 max-w-[180px] truncate text-[11px] text-red-500" title={v.review_note}>
                        {v.review_note}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {reviewActions(v, true)}
                      <Link
                        to={`/admin/villas/${v.id}/edit`}
                        className="rounded-lg p-2 text-gray-500 hover:bg-brand-50 hover:text-brand-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => remove(v)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DesktopTable>
        </>
      )}
    </div>
  )
}
