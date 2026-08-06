import { useEffect, useState } from 'react'
import { Search, Trash2 } from 'lucide-react'
import api from '../../lib/api'
import { formatDate } from '../../lib/format'
import { PageLoader, EmptyState, MobileList, DesktopTable, DataCard } from '../../components/ui'

/**
 * Tabel daftar user berdasarkan role.
 * role: 'user' (Pengguna/pelanggan) | 'admin' (Pengelola).
 * allowDelete: tampilkan checkbox + hapus permanen (bulk).
 */
export default function UsersTable({ role, title, subtitle, showBookings = true, allowDelete = false }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(() => new Set())
  const [deleting, setDeleting] = useState(false)

  const load = (q = '') => {
    setLoading(true)
    setSelected(new Set())
    api
      .get('/admin/users', { params: { role, search: q, per_page: 100 } })
      .then((res) => setUsers(res.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const allChecked = users.length > 0 && selected.size === users.length
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(users.map((u) => u.id)))

  const bulkDelete = async () => {
    const ids = [...selected]
    if (ids.length === 0) return
    if (!window.confirm(`Hapus permanen ${ids.length} pengguna beserta seluruh data pesanannya? Tindakan ini tidak dapat dibatalkan.`)) return
    setDeleting(true)
    try {
      await api.post('/admin/users/bulk-delete', { ids })
      setUsers((us) => us.filter((u) => !selected.has(u.id)))
      setSelected(new Set())
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal menghapus pengguna.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {allowDelete && selected.size > 0 && (
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

      <div className="mb-4 flex max-w-sm items-center gap-2 rounded-xl border border-gray-200 bg-white px-3">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(search)}
          placeholder="Cari nama atau email…"
          className="w-full bg-transparent py-2.5 text-sm outline-none"
        />
      </div>

      {loading ? (
        <PageLoader />
      ) : users.length === 0 ? (
        <EmptyState title="Belum ada data" />
      ) : (
        <>
          {/* Mobile: kartu */}
          <MobileList>
            {allowDelete && (
              <label className="flex items-center gap-2 px-1 text-xs font-medium text-gray-500">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                Pilih semua ({users.length})
              </label>
            )}
            {users.map((u) => (
              <DataCard key={u.id} active={selected.has(u.id)}>
                <div className="flex items-center gap-3">
                  {allowDelete && (
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      onChange={() => toggleOne(u.id)}
                      className="h-4 w-4 flex-shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  )}
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="h-11 w-11 flex-shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                      {u.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-gray-900">{u.name}</div>
                    <div className="truncate text-xs text-gray-500">{u.email}</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-gray-50 pt-3">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">No. HP</div>
                    <a href={u.phone ? `tel:${u.phone}` : undefined} className="truncate text-sm text-gray-800">
                      {u.phone || '-'}
                    </a>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Bergabung</div>
                    <div className="text-sm text-gray-800">{formatDate(u.created_at)}</div>
                  </div>
                  {showBookings && (
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wide text-gray-400">Pesanan</div>
                      <div className="text-sm font-semibold text-gray-900">{u.bookings_count}</div>
                    </div>
                  )}
                </div>
              </DataCard>
            ))}
          </MobileList>

          {/* Desktop: tabel */}
          <DesktopTable>
            <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
              <tr>
                {allowDelete && (
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      title="Pilih semua"
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                )}
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">No. HP</th>
                {showBookings && <th className="px-4 py-3">Pesanan</th>}
                <th className="px-4 py-3">Bergabung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className={selected.has(u.id) ? 'bg-brand-50/60' : 'hover:bg-gray-50'}>
                  {allowDelete && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(u.id)}
                        onChange={() => toggleOne(u.id)}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                          {u.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">{u.phone || '-'}</td>
                  {showBookings && <td className="px-4 py-3 text-gray-600">{u.bookings_count}</td>}
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </DesktopTable>
        </>
      )}
    </div>
  )
}
