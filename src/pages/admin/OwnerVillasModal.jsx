import { useEffect, useMemo, useState } from 'react'
import { X, Search, Home, AlertTriangle, Link2 } from 'lucide-react'
import api from '../../lib/api'
import { PageLoader, Button } from '../../components/ui'

/**
 * Dialog "Hubungkan Properti": centang properti eksisting yang dimiliki owner.
 * Daftar centang = daftar akhir properti owner (yang tidak dicentang dilepas).
 */
export default function OwnerVillasModal({ owner, onClose, onSaved }) {
  const [villas, setVillas] = useState([])
  const [selected, setSelected] = useState(() => new Set())
  const [initial, setInitial] = useState(() => new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | linked | free

  useEffect(() => {
    api
      .get(`/admin/owners/${owner.id}/villas`)
      .then((res) => {
        setVillas(res.data.villas)
        const mine = new Set(res.data.villas.filter((v) => v.owner_id === owner.id).map((v) => v.id))
        setSelected(mine)
        setInitial(new Set(mine))
      })
      .catch((e) => setError(e.response?.data?.message || 'Gagal memuat daftar properti.'))
      .finally(() => setLoading(false))
  }, [owner.id])

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const q = search.trim().toLowerCase()
  const shown = villas.filter((v) => {
    if (q && !`${v.name} ${v.city}`.toLowerCase().includes(q)) return false
    if (filter === 'linked') return selected.has(v.id)
    if (filter === 'free') return !v.owner_id
    return true
  })

  const changes = useMemo(() => {
    const added = villas.filter((v) => selected.has(v.id) && !initial.has(v.id))
    const removed = villas.filter((v) => !selected.has(v.id) && initial.has(v.id))
    const moved = added.filter((v) => v.owner_id && v.owner_id !== owner.id)
    return { added, removed, moved }
  }, [villas, selected, initial, owner.id])

  const dirty = changes.added.length > 0 || changes.removed.length > 0

  const save = async () => {
    if (changes.moved.length) {
      const list = changes.moved.map((v) => `• ${v.name} (milik ${v.owner_name})`).join('\n')
      if (!confirm(`Properti berikut akan DIPINDAHKAN dari owner lain ke ${owner.name}:\n\n${list}\n\nLanjutkan?`)) return
    }
    setSaving(true)
    setError('')
    try {
      const res = await api.put(`/admin/owners/${owner.id}/villas`, { villa_ids: [...selected] })
      onSaved(res.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal menyimpan. Coba lagi.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <Link2 className="h-5 w-5 text-brand-600" /> Hubungkan Properti
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Centang properti milik <strong className="text-gray-800">{owner.name}</strong>. Properti yang dicentang dapat dikelola owner dari Extranet.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 px-3">
            <Search className="h-4 w-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama / kota…" className="w-full bg-transparent py-2 text-sm outline-none" />
          </div>
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1 text-xs font-medium">
            {[
              ['all', 'Semua'],
              ['linked', 'Dicentang'],
              ['free', 'Tanpa owner'],
            ].map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)} className={`rounded-lg px-3 py-1.5 transition ${filter === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[240px] flex-1 overflow-y-auto px-3 py-2">
          {loading ? (
            <PageLoader />
          ) : shown.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">Tidak ada properti.</p>
          ) : (
            shown.map((v) => {
              const checked = selected.has(v.id)
              const otherOwner = v.owner_id && v.owner_id !== owner.id
              return (
                <label
                  key={v.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition ${checked ? 'bg-brand-50' : 'hover:bg-gray-50'}`}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggle(v.id)} className="h-4 w-4 flex-shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                  <div className="h-11 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-brand-50">
                    {v.primary_image_url ? (
                      <img src={v.primary_image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Home className="m-auto mt-3 h-5 w-5 text-brand-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-gray-900">{v.name}</div>
                    <div className="truncate text-xs text-gray-500">
                      {v.type} · {v.city}
                      {!v.is_active && ' · nonaktif'}
                    </div>
                  </div>
                  {v.owner_id === owner.id ? (
                    <span className="flex-shrink-0 rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">Milik owner ini</span>
                  ) : otherOwner ? (
                    <span className="flex-shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700" title="Dimiliki owner lain">
                      Milik {v.owner_name}
                    </span>
                  ) : (
                    <span className="flex-shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500">Tanpa owner</span>
                  )}
                </label>
              )
            })
          )}
        </div>

        <div className="border-t border-gray-100 px-6 py-4">
          {error && <div className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>}
          {changes.moved.length > 0 && (
            <div className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {changes.moved.length} properti saat ini milik owner lain dan akan dipindahkan ke {owner.name}.
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-gray-500">
              <strong className="text-gray-900">{selected.size}</strong> properti dipilih
              {dirty && (
                <span className="ml-1 text-xs">
                  ({changes.added.length > 0 && `+${changes.added.length} ditautkan`}
                  {changes.added.length > 0 && changes.removed.length > 0 && ', '}
                  {changes.removed.length > 0 && `−${changes.removed.length} dilepas`})
                </span>
              )}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Batal
              </Button>
              <Button onClick={save} loading={saving} disabled={!dirty || loading}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
