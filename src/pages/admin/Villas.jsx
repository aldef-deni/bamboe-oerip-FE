import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import api from '../../lib/api'
import { rupiah } from '../../lib/format'
import { PageLoader, Button, Badge, EmptyState, MobileList, DesktopTable, DataCard } from '../../components/ui'

export default function AdminVillas() {
  const [villas, setVillas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = (q = '') => {
    setLoading(true)
    api
      .get('/admin/villas', { params: { search: q, per_page: 50 } })
      .then((res) => setVillas(res.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

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
                      {v.is_active ? (
                        <Badge className="flex-shrink-0 bg-emerald-100 text-emerald-700">Aktif</Badge>
                      ) : (
                        <Badge className="flex-shrink-0 bg-gray-200 text-gray-600">Nonaktif</Badge>
                      )}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-gray-900">
                      {rupiah(v.price_per_night)}
                      <span className="text-xs font-normal text-gray-400"> / malam</span>
                    </div>
                    <div className="text-xs text-gray-400">{v.bookings_count} pesanan</div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2 border-t border-gray-50 pt-3">
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
                  <td className="px-4 py-3 font-medium text-gray-800">{rupiah(v.price_per_night)}</td>
                  <td className="px-4 py-3 text-gray-600">{v.bookings_count}</td>
                  <td className="px-4 py-3">
                    {v.is_active ? (
                      <Badge className="bg-emerald-100 text-emerald-700">Aktif</Badge>
                    ) : (
                      <Badge className="bg-gray-200 text-gray-600">Nonaktif</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
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
