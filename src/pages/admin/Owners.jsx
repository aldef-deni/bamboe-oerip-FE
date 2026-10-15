import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2, X, KeyRound, Building2, ExternalLink, Copy, Check, RefreshCw, Link2, CheckCircle2 } from 'lucide-react'
import api from '../../lib/api'
import { formatDate } from '../../lib/format'
import { PageLoader, Button, Input, Badge, EmptyState, MobileList, DesktopTable, DataCard } from '../../components/ui'
import OwnerVillasModal from './OwnerVillasModal'

const OWNER_URL = import.meta.env.VITE_OWNER_URL || 'https://owner.bamboeoerip.com'

const blank = { name: '', email: '', username: '', phone: '', password: '', password_confirmation: '', is_active: true }

function genPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const arr = new Uint32Array(10)
  crypto.getRandomValues(arr)
  return Array.from(arr, (n) => chars[n % chars.length]).join('')
}

/**
 * Akun owner properti — hanya superadmin. Owner login di owner.bamboeoerip.com
 * (tanpa form daftar), jadi semua akun owner dibuat dari sini.
 */
export default function AdminOwners() {
  const [owners, setOwners] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | { mode: 'create' | 'edit', owner? }
  const [created, setCreated] = useState(null) // kredensial owner baru untuk dibagikan
  const [linking, setLinking] = useState(null) // owner yang sedang dihubungkan ke properti
  const [flash, setFlash] = useState('')

  const onLinked = (owner, res) => {
    setLinking(null)
    setOwners((os) =>
      os.map((x) =>
        x.id === owner.id
          ? { ...x, villas_count: res.villas_count, active_villas_count: res.active_villas_count, pending_villas_count: res.pending_villas_count }
          : x
      )
    )
    // properti yang dipindah dari owner lain -> muat ulang agar hitungan owner lain ikut benar
    if (res.moved > 0) load(search)
    setFlash(res.message)
    setTimeout(() => setFlash(''), 5000)
  }

  const load = (q = '') => {
    setLoading(true)
    api
      .get('/admin/owners', { params: { search: q || undefined } })
      .then((res) => setOwners(res.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const remove = async (o) => {
    const msg =
      o.villas_count > 0
        ? `Hapus akun owner "${o.name}"? ${o.villas_count} properti miliknya TIDAK dihapus dan akan dikelola Bamboe Oerip.`
        : `Hapus akun owner "${o.name}"?`
    if (!confirm(msg)) return
    try {
      await api.delete(`/admin/owners/${o.id}`)
      setOwners((os) => os.filter((x) => x.id !== o.id))
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal menghapus owner.')
    }
  }

  const onSaved = (owner, mode, plainPassword) => {
    setModal(null)
    if (mode === 'create') {
      setOwners((os) => [owner, ...os])
      setCreated({ ...owner, password: plainPassword })
    } else {
      setOwners((os) => os.map((x) => (x.id === owner.id ? { ...x, ...owner } : x)))
      if (plainPassword) setCreated({ ...owner, password: plainPassword, reset: true })
    }
  }

  const statusBadge = (o) =>
    o.is_active ? <Badge className="bg-emerald-100 text-emerald-700">Aktif</Badge> : <Badge className="bg-gray-200 text-gray-600">Nonaktif</Badge>

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Owner Properti</h1>
          <p className="mt-1 text-sm text-gray-500">
            Akun pemilik properti untuk Extranet{' '}
            <a href={OWNER_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline">
              {OWNER_URL.replace(/^https?:\/\//, '')}
            </a>
            . Owner tidak bisa mendaftar sendiri.
          </p>
        </div>
        <Button onClick={() => setModal({ mode: 'create' })}>
          <Plus className="h-4 w-4" /> Daftarkan Owner
        </Button>
      </div>

      {created && <CredentialCard data={created} onClose={() => setCreated(null)} onLink={!created.reset ? () => setLinking(created) : null} />}

      {flash && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> {flash}
        </div>
      )}

      <div className="mb-4 flex max-w-sm items-center gap-2 rounded-xl border border-gray-200 bg-white px-3">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(search)}
          placeholder="Cari nama, email, username…"
          className="w-full bg-transparent py-2.5 text-sm outline-none"
        />
      </div>

      {loading ? (
        <PageLoader />
      ) : owners.length === 0 ? (
        <EmptyState icon={Building2} title="Belum ada owner" subtitle="Daftarkan pemilik properti agar dapat mengelola listing-nya sendiri." />
      ) : (
        <>
          <MobileList>
            {owners.map((o) => (
              <DataCard key={o.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-gray-900">{o.name}</div>
                    <div className="truncate text-xs text-gray-500">
                      @{o.username} · {o.email}
                    </div>
                  </div>
                  {statusBadge(o)}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3 text-xs text-gray-500">
                  <Link to={`/admin/villas?owner_id=${o.id}`} className="font-medium text-brand-700">
                    {o.villas_count} properti{o.pending_villas_count > 0 ? ` · ${o.pending_villas_count} ditinjau` : ''}
                  </Link>
                  <div className="flex gap-1">
                    <button onClick={() => setLinking(o)} title="Hubungkan properti" className="rounded-lg p-2 text-brand-600 hover:bg-brand-50">
                      <Link2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => setModal({ mode: 'edit', owner: o })} className="rounded-lg p-2 text-gray-500 hover:bg-brand-50">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(o)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </DataCard>
            ))}
          </MobileList>

          <DesktopTable>
            <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">No. HP</th>
                <th className="px-4 py-3">Properti</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Terdaftar</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {owners.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{o.name}</div>
                    <div className="text-xs text-gray-400">{o.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{o.username}</td>
                  <td className="px-4 py-3 text-gray-600">{o.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/villas?owner_id=${o.id}`} className="font-medium text-brand-700 hover:underline">
                      {o.villas_count} properti
                    </Link>
                    {o.pending_villas_count > 0 && <div className="text-[11px] text-amber-600">{o.pending_villas_count} menunggu tinjauan</div>}
                    <button onClick={() => setLinking(o)} className="mt-0.5 block text-[11px] font-semibold text-gray-500 hover:text-brand-700">
                      + Hubungkan properti
                    </button>
                  </td>
                  <td className="px-4 py-3">{statusBadge(o)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setLinking(o)} title="Hubungkan properti" className="rounded-lg p-2 text-brand-600 hover:bg-brand-50">
                        <Link2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => setModal({ mode: 'edit', owner: o })} title="Edit / reset password" className="rounded-lg p-2 text-gray-500 hover:bg-brand-50 hover:text-brand-700">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(o)} title="Hapus akun" className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600">
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

      {modal && <OwnerModal mode={modal.mode} owner={modal.owner} onClose={() => setModal(null)} onSaved={onSaved} />}
      {linking && <OwnerVillasModal owner={linking} onClose={() => setLinking(null)} onSaved={(res) => onLinked(linking, res)} />}
    </div>
  )
}

function OwnerModal({ mode, owner, onClose, onSaved }) {
  const editing = mode === 'edit'
  const [form, setForm] = useState(
    editing ? { ...blank, name: owner.name, email: owner.email, username: owner.username || '', phone: owner.phone || '', is_active: owner.is_active } : blank
  )
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const generate = () => {
    const p = genPassword()
    setForm((f) => ({ ...f, password: p, password_confirmation: p }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    const payload = { ...form, username: form.username.trim() }
    if (editing && !payload.password) {
      delete payload.password
      delete payload.password_confirmation
    }
    try {
      const res = editing ? await api.put(`/admin/owners/${owner.id}`, payload) : await api.post('/admin/owners', payload)
      onSaved(res.data, mode, form.password || null)
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: [err.response?.data?.message || 'Gagal menyimpan.'] })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Owner' : 'Daftarkan Owner Baru'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {errors.general && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errors.general[0]}</div>}

        <form onSubmit={submit} className="space-y-4">
          <Input label="Nama lengkap / nama usaha" required value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name?.[0]} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email?.[0]} />
            <Input label="No. HP / WhatsApp" value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone?.[0]} />
          </div>
          <Input
            label="Username (untuk login)"
            required
            value={form.username}
            onChange={(e) => set('username', e.target.value.replace(/\s/g, ''))}
            placeholder="mis. villa.asri"
            error={errors.username?.[0]}
          />

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <KeyRound className="h-4 w-4 text-brand-600" /> {editing ? 'Reset password (opsional)' : 'Password'}
              </span>
              <button type="button" onClick={generate} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
                <RefreshCw className="h-3.5 w-3.5" /> Buat otomatis
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Password"
                type="text"
                required={!editing}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder={editing ? 'Kosongkan bila tidak diubah' : 'Min. 8 karakter'}
                error={errors.password?.[0]}
              />
              <Input
                label="Ulangi password"
                type="text"
                required={!editing || !!form.password}
                autoComplete="new-password"
                value={form.password_confirmation}
                onChange={(e) => set('password_confirmation', e.target.value)}
              />
            </div>
            {editing && <p className="mt-2 text-xs text-gray-500">Mengganti password akan mengeluarkan owner dari semua perangkat.</p>}
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="h-4 w-4 rounded text-brand-600" />
            Akun aktif (bisa login ke extranet)
          </label>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
              Batal
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              {editing ? 'Simpan' : 'Daftarkan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/** Kartu kredensial setelah owner dibuat / password direset — untuk dibagikan ke owner. */
function CredentialCard({ data, onClose, onLink }) {
  const [copied, setCopied] = useState(false)
  const text = `Akun Extranet Owner Bamboe Oerip\nAlamat: ${OWNER_URL}\nUsername: ${data.username}\nPassword: ${data.password}\n\nSilakan ganti password setelah login (menu Profil Saya).`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert(text)
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-emerald-900">{data.reset ? 'Password owner diperbarui' : 'Akun owner berhasil dibuat'}</div>
          <p className="mt-0.5 text-sm text-emerald-800">Bagikan kredensial berikut ke {data.name}. Password tidak akan ditampilkan lagi.</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100">
          <X className="h-4 w-4" />
        </button>
      </div>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-white p-3 font-mono text-xs text-gray-800 ring-1 ring-emerald-100">{text}</pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={copy} variant="subtle">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Tersalin' : 'Salin kredensial'}
        </Button>
        {onLink && (
          <Button onClick={onLink}>
            <Link2 className="h-4 w-4" /> Hubungkan properti yang sudah ada
          </Button>
        )}
        <Button as="a" href={OWNER_URL} target="_blank" rel="noopener noreferrer" variant="ghost">
          <ExternalLink className="h-4 w-4" /> Buka Extranet
        </Button>
      </div>
    </div>
  )
}
