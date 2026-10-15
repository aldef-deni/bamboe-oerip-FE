import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { CheckCircle2, Plus, Search, Pencil, Trash2, Eye, EyeOff, MapPin, BedDouble, Users, Star, CalendarCheck, Building2, ExternalLink, AlertTriangle } from 'lucide-react'
import api from '../../lib/api'
import { rupiah } from '../../lib/format'
import { PageLoader, Spinner } from '../../components/ui'
import { useOwnerTheme, PageHeader, PropertyStatusPill, GoldButton, propertyStatus, titleCase } from './kit'

const CUSTOMER_URL = import.meta.env.VITE_CUSTOMER_URL || 'https://bamboeoerip.com'

const TABS = [
  { key: '', label: 'Semua' },
  { key: 'active', label: 'Tayang' },
  { key: 'pending', label: 'Ditinjau' },
  { key: 'rejected', label: 'Perlu Perbaikan' },
  { key: 'inactive', label: 'Disembunyikan' },
]

function matches(v, key) {
  if (!key) return true
  if (key === 'active') return v.is_active
  if (key === 'inactive') return !v.is_active && v.review_status === 'approved'
  return v.review_status === key
}

export default function OwnerProperties() {
  useOwnerTheme('Properti Saya')
  const [params, setParams] = useSearchParams()
  const tab = params.get('status') || ''
  const [villas, setVillas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(null)
  const location = useLocation()
  const [flash, setFlash] = useState(location.state?.flash || '')

  useEffect(() => {
    if (!flash) return
    window.history.replaceState({}, '') // jangan tampil lagi saat refresh
    const t = setTimeout(() => setFlash(''), 5000)
    return () => clearTimeout(t)
  }, [flash])

  useEffect(() => {
    api
      .get('/owner/villas')
      .then((res) => setVillas(res.data))
      .finally(() => setLoading(false))
  }, [])

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.key, villas.filter((v) => matches(v, t.key)).length])), [villas])
  const q = search.trim().toLowerCase()
  const shown = villas.filter((v) => matches(v, tab) && (!q || `${v.name} ${v.city}`.toLowerCase().includes(q)))

  const toggle = async (v) => {
    setBusy(v.id)
    try {
      const res = await api.post(`/owner/villas/${v.id}/toggle-active`)
      setVillas((vs) => vs.map((x) => (x.id === v.id ? { ...x, ...res.data } : x)))
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal mengubah status tayang.')
    } finally {
      setBusy(null)
    }
  }

  const remove = async (v) => {
    if (!confirm(`Hapus properti "${v.name}" secara permanen? Foto properti juga akan dihapus.`)) return
    setBusy(v.id)
    try {
      await api.delete(`/owner/villas/${v.id}`)
      setVillas((vs) => vs.filter((x) => x.id !== v.id))
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal menghapus properti.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Portofolio"
        title="Properti Saya"
        subtitle="Kelola listing akomodasi Anda. Properti baru akan ditinjau tim Bamboe Oerip sebelum tayang."
        actions={
          <GoldButton as={Link} to="/owner/properties/new">
            <Plus className="h-4 w-4" /> Tambah Properti
          </GoldButton>
        }
      />

      {flash && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-5 w-5" /> {flash}
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setParams(t.key ? { status: t.key } : {})}
              className={`flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === t.key ? 'bg-brand-800 text-white shadow-md shadow-brand-900/20' : 'bg-white text-gray-600 ring-1 ring-inset ring-sand-200 hover:bg-sand-100'
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 text-[11px] ${tab === t.key ? 'bg-gold-400 text-brand-900' : 'bg-sand-100 text-gray-500'}`}>{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-sand-200 bg-white px-3 lg:w-72">
          <Search className="h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama / kota…" className="w-full bg-transparent py-2.5 text-sm outline-none" />
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : villas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gold-300 bg-white px-6 py-16 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gold-400" />
          <h3 className="mt-4 font-display text-xl font-semibold text-brand-900">Belum ada properti</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">Tambahkan villa atau homestay pertama Anda untuk mulai menerima tamu.</p>
          <GoldButton as={Link} to="/owner/properties/new" className="mt-5">
            <Plus className="h-4 w-4" /> Tambah Properti
          </GoldButton>
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-12 text-center text-sm text-gray-400 ring-1 ring-sand-200">Tidak ada properti pada filter ini.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {shown.map((v) => (
            <PropertyCard key={v.id} v={v} busy={busy === v.id} onToggle={() => toggle(v)} onDelete={() => remove(v)} />
          ))}
        </div>
      )}
    </div>
  )
}

function PropertyCard({ v, busy, onToggle, onDelete }) {
  const status = propertyStatus(v)
  return (
    <article
      className="group flex flex-col overflow-hidden rounded-2xl border border-sand-200/70 bg-white transition hover:-translate-y-0.5"
      style={{ boxShadow: '0 1px 2px rgba(22,61,43,0.04), 0 16px 36px -22px rgba(22,61,43,0.35)' }}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-sand-100">
        {v.primary_image_url ? (
          <img src={v.primary_image_url} alt={v.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sand-200">
            <Building2 className="h-10 w-10" />
            <span className="text-xs font-medium text-gray-400">Belum ada foto</span>
          </div>
        )}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
        <PropertyStatusPill villa={v} className="absolute left-3 top-3 !bg-white/95 shadow-sm" />
        <span className="absolute bottom-3 left-4 rounded-md bg-black/30 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">{v.type}</span>
        <span className="absolute bottom-3 right-4 font-display text-lg font-semibold text-white">
          {rupiah(v.price_per_night)}
          <span className="font-sans text-xs font-normal text-white/80"> /malam</span>
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate font-display text-lg font-semibold text-brand-900">{v.name}</h3>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gold-600" />
          {[v.district, v.city].filter(Boolean).map(titleCase).join(', ') || '-'}
        </p>

        <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl bg-sand-50 px-3 py-2.5 text-center text-[11px] text-gray-500">
          <Metric icon={Users} value={v.max_guests} label="tamu" />
          <Metric icon={BedDouble} value={v.bedrooms} label="kamar" />
          <Metric icon={CalendarCheck} value={v.bookings_count} label="pesanan" />
          <Metric icon={Star} value={v.review_count > 0 ? Number(v.rating_avg).toFixed(1) : '—'} label="rating" />
        </div>

        {v.review_status === 'rejected' && v.review_note && (
          <div className="mt-3 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              <strong>Catatan admin:</strong> {v.review_note}
            </span>
          </div>
        )}
        {v.review_status === 'pending' && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">Sedang ditinjau. Properti tayang setelah disetujui admin.</p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-4">
          <Link
            to={`/owner/properties/${v.id}/edit`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-800 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-900"
          >
            <Pencil className="h-4 w-4" /> {v.review_status === 'rejected' ? 'Perbaiki' : 'Edit'}
          </Link>
          {v.review_status === 'approved' && (
            <button
              onClick={onToggle}
              disabled={busy}
              title={v.is_active ? 'Sembunyikan dari situs' : 'Tayangkan di situs'}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-800 ring-1 ring-inset ring-sand-200 transition hover:bg-sand-100 disabled:opacity-50"
            >
              {busy ? <Spinner className="h-4 w-4" /> : v.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
          {v.is_active && (
            <a
              href={`${CUSTOMER_URL}/villa/${v.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Lihat di situs"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-800 ring-1 ring-inset ring-sand-200 transition hover:bg-sand-100"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button
            onClick={onDelete}
            disabled={busy}
            title="Hapus properti"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-rose-600 ring-1 ring-inset ring-rose-100 transition hover:bg-rose-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <span className="sr-only">Status: {status.label}</span>
      </div>
    </article>
  )
}

function Metric({ icon: Icon, value, label }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1 text-sm font-semibold text-brand-900">
        <Icon className="h-3.5 w-3.5 text-gold-600" /> {value}
      </div>
      <div>{label}</div>
    </div>
  )
}
