import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Sparkles, Search } from 'lucide-react'
import api from '../../lib/api'
import { PageLoader, Button, Input } from '../../components/ui'

// Deteksi apakah string ikon berupa emoji (untuk ditampilkan langsung)
const isEmoji = (s) => s && /\p{Extended_Pictographic}/u.test(s)

function AmenityIcon({ icon, className = 'h-6 w-6' }) {
  if (isEmoji(icon)) return <span className="text-2xl leading-none">{icon}</span>
  return <Sparkles className={className} />
}

export default function AdminAmenities() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | {} | item
  const [form, setForm] = useState({ name: '', icon: '' })
  const [saving, setSaving] = useState(false)
  const [q, setQ] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/admin/amenities').then((res) => setItems(res.data)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openNew = () => {
    setForm({ name: '', icon: '' })
    setEditing({})
  }
  const openEdit = (item) => {
    setForm({ name: item.name, icon: item.icon || '' })
    setEditing(item)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing.id) await api.put(`/admin/amenities/${editing.id}`, form)
      else await api.post('/admin/amenities', form)
      setEditing(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item) => {
    if (!confirm(`Hapus fasilitas "${item.name}"?`)) return
    await api.delete(`/admin/amenities/${item.id}`)
    setItems((it) => it.filter((x) => x.id !== item.id))
  }

  if (loading) return <PageLoader />

  const filtered = items.filter((a) => a.name.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Fasilitas</h1>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{items.length}</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">Kelola daftar fasilitas yang bisa dipilih pada setiap villa.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Tambah Fasilitas
        </Button>
      </div>

      {/* Pencarian */}
      {items.length > 0 && (
        <div className="mb-5 flex max-w-sm items-center gap-2 rounded-xl border border-gray-200 bg-white px-3">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari fasilitas…"
            className="w-full bg-transparent py-2.5 text-sm outline-none"
          />
        </div>
      )}

      {/* Grid kartu */}
      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Sparkles className="h-7 w-7" />
          </div>
          <p className="font-semibold text-gray-700">Belum ada fasilitas</p>
          <p className="mt-1 text-sm text-gray-400">Tambahkan fasilitas seperti WiFi, Kolam Renang, AC, dll.</p>
          <Button onClick={openNew} className="mt-5">
            <Plus className="h-4 w-4" /> Tambah Fasilitas
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">Tidak ada fasilitas yang cocok dengan “{q}”.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
            >
              {/* Aksi */}
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100 max-sm:opacity-100">
                <button
                  onClick={() => openEdit(a)}
                  title="Edit"
                  className="rounded-lg bg-white/90 p-1.5 text-gray-500 shadow-sm ring-1 ring-gray-100 hover:text-brand-700"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => remove(a)}
                  title="Hapus"
                  className="rounded-lg bg-white/90 p-1.5 text-gray-500 shadow-sm ring-1 ring-gray-100 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-inner">
                <AmenityIcon icon={a.icon} />
              </div>
              <div className="mt-3 truncate text-sm font-semibold text-gray-800" title={a.name}>
                {a.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal tambah/edit */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editing.id ? 'Edit' : 'Tambah'} Fasilitas</h2>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Preview */}
            <div className="mb-5 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-brand-50 to-gold-50/40 p-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <AmenityIcon icon={form.icon} />
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold text-gray-800">{form.name || 'Nama fasilitas'}</div>
                <div className="text-xs text-gray-400">Pratinjau tampilan</div>
              </div>
            </div>

            <div className="space-y-3">
              <Input label="Nama" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="cth: WiFi, Kolam Renang" />
              <Input
                label="Ikon emoji (opsional)"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="cth: 📶  🏊  ❄️"
              />
            </div>
            <Button type="submit" className="mt-5 w-full" loading={saving}>
              Simpan
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
