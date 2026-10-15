import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Star,
  Trash2,
  ImagePlus,
  MapPin,
  Search,
  Check,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  Building2,
  Wallet,
  Sparkles,
  Images,
  Loader2,
} from 'lucide-react'
import api from '../../lib/api'
import { rupiah } from '../../lib/format'
import { compressImage } from '../../lib/imageCompress'
import { PageLoader, Spinner } from '../../components/ui'
import RegionSelect from '../../components/RegionSelect'
import MapPicker from '../../components/MapPicker'
import { useOwnerTheme, PageHeader, GoldButton, PropertyStatusPill } from './kit'

const TYPES = ['Villa', 'Homestay', 'Cabin', 'Bungalow', 'Guest House', 'Apartment', 'Pod']
const MIN_DESC = 30

const empty = {
  name: '',
  type: 'Villa',
  description: '',
  province: '',
  city: '',
  district: '',
  village: '',
  address: '',
  latitude: '',
  longitude: '',
  price_per_night: '',
  max_guests: 2,
  bedrooms: 1,
  bathrooms: 1,
  size_sqm: '',
  is_active: true,
}

const inputCls =
  'w-full rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gold-400 focus:ring-4 focus:ring-gold-100'

function Field({ label, hint, error, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-brand-900">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-gray-400">{hint}</span> : null}
    </label>
  )
}

function Section({ id, icon: Icon, title, subtitle, children }) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-sand-200/70 bg-white p-5 sm:p-6"
      style={{ boxShadow: '0 1px 2px rgba(22,61,43,0.04), 0 12px 32px -20px rgba(22,61,43,0.2)' }}
    >
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-800 text-gold-200">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-brand-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

export default function OwnerPropertyForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  useOwnerTheme(editing ? 'Edit Properti' : 'Tambah Properti')
  const navigate = useNavigate()

  const [form, setForm] = useState(empty)
  const [villa, setVilla] = useState(null)
  const [amenities, setAmenities] = useState([])
  const [selected, setSelected] = useState([])
  const [existing, setExisting] = useState([])
  const [photos, setPhotos] = useState([]) // { key, file, url, status: 'ready'|'uploading'|'done'|'error', error }
  const [primaryKey, setPrimaryKey] = useState(null)
  const [preparing, setPreparing] = useState(0)
  const [loading, setLoading] = useState(editing)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState('')
  const [errors, setErrors] = useState({})
  const [geocoding, setGeocoding] = useState(false)
  const topRef = useRef(null)

  useEffect(() => {
    api.get('/amenities').then((res) => setAmenities(res.data)).catch(() => setAmenities([]))
  }, [])

  useEffect(() => {
    if (!editing) return
    api
      .get(`/owner/villas/${id}`)
      .then((res) => {
        const v = res.data
        setVilla(v)
        setForm({
          name: v.name || '',
          type: v.type || 'Villa',
          description: v.description || '',
          province: v.province || '',
          city: v.city || '',
          district: v.district || '',
          village: v.village || '',
          address: v.address || '',
          latitude: v.latitude ?? '',
          longitude: v.longitude ?? '',
          price_per_night: v.price_per_night ? String(Math.round(Number(v.price_per_night))) : '',
          max_guests: v.max_guests,
          bedrooms: v.bedrooms,
          bathrooms: v.bathrooms,
          size_sqm: v.size_sqm ?? '',
          is_active: v.is_active,
        })
        setSelected((v.amenities || []).map((a) => a.id))
        setExisting(v.images || [])
      })
      .catch((e) => setLoadError(e.response?.status === 404 ? 'Properti tidak ditemukan.' : 'Gagal memuat data properti.'))
      .finally(() => setLoading(false))
  }, [id, editing])

  // Bersihkan object URL saat unmount
  const photosRef = useRef(photos)
  photosRef.current = photos
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const checklist = useMemo(
    () => [
      { id: 'dasar', label: 'Informasi dasar', ok: form.name.trim().length >= 3 && form.description.trim().length >= MIN_DESC },
      { id: 'lokasi', label: 'Lokasi', ok: Boolean(form.city && form.address.trim()) },
      { id: 'harga', label: 'Harga & kapasitas', ok: Number(form.price_per_night) > 0 && Number(form.max_guests) >= 1 },
      { id: 'fasilitas', label: 'Fasilitas', ok: selected.length > 0 },
      { id: 'foto', label: 'Foto (min. 3)', ok: existing.length + photos.filter((p) => p.status !== 'done').length >= 3 },
    ],
    [form, selected, existing, photos]
  )
  const doneCount = checklist.filter((c) => c.ok).length

  // ===== Foto =====
  const addFiles = async (fileList) => {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'))
    if (!files.length) return
    setPreparing((n) => n + files.length)
    for (const file of files) {
      const out = await compressImage(file)
      const key = `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`
      setPhotos((ps) => [...ps, { key, file: out, url: URL.createObjectURL(out), status: 'ready', error: '' }])
      setPreparing((n) => n - 1)
    }
  }

  const removeNew = (key) => {
    setPhotos((ps) => {
      const p = ps.find((x) => x.key === key)
      if (p) URL.revokeObjectURL(p.url)
      return ps.filter((x) => x.key !== key)
    })
    if (primaryKey === key) setPrimaryKey(null)
  }

  const deleteExisting = async (img) => {
    if (!confirm('Hapus foto ini?')) return
    try {
      await api.delete(`/owner/villas/${id}/images/${img.id}`)
      const rest = existing.filter((x) => x.id !== img.id)
      // server otomatis menunjuk foto utama baru bila foto utama dihapus
      if (img.is_primary && rest.length) rest[0] = { ...rest[0], is_primary: true }
      setExisting(rest)
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal menghapus foto.')
    }
  }

  const makeExistingPrimary = async (img) => {
    try {
      await api.post(`/owner/villas/${id}/images/${img.id}/primary`)
      setExisting((imgs) => imgs.map((x) => ({ ...x, is_primary: x.id === img.id })))
      setPrimaryKey(null)
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal mengatur foto utama.')
    }
  }

  // Foto utama efektif untuk foto baru: pilihan owner, atau foto pertama bila belum ada foto sama sekali
  const pendingPhotos = photos.filter((p) => p.status !== 'done')
  const effectivePrimary = primaryKey || (existing.length === 0 ? pendingPhotos[0]?.key : null)

  // ===== Lokasi =====
  const geocode = async () => {
    const q = [form.address, form.village, form.district, form.city, form.province, 'Indonesia'].filter(Boolean).join(', ')
    if (q === 'Indonesia') return alert('Pilih wilayah / isi alamat terlebih dahulu.')
    setGeocoding(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=id&q=${encodeURIComponent(q)}`, {
        headers: { 'Accept-Language': 'id' },
      })
      const data = await res.json()
      if (data?.[0]) {
        setForm((f) => ({ ...f, latitude: Number(data[0].lat).toFixed(7), longitude: Number(data[0].lon).toFixed(7) }))
      } else {
        alert('Lokasi tidak ditemukan. Geser marker di peta secara manual.')
      }
    } catch {
      alert('Gagal mencari lokasi. Periksa koneksi internet.')
    } finally {
      setGeocoding(false)
    }
  }

  // ===== Validasi sisi klien (pesan ramah sebelum ke server) =====
  const validate = () => {
    const e = {}
    if (form.name.trim().length < 3) e.name = ['Nama properti minimal 3 karakter.']
    if (form.description.trim().length < MIN_DESC) e.description = [`Deskripsi minimal ${MIN_DESC} karakter agar tamu tertarik.`]
    if (!form.province) e.province = ['Pilih provinsi.']
    if (!form.city) e.city = ['Pilih kota/kabupaten.']
    if (!form.address.trim()) e.address = ['Alamat lengkap wajib diisi.']
    if (!(Number(form.price_per_night) > 0)) e.price_per_night = ['Harga per malam harus lebih dari 0.']
    if (!(Number(form.max_guests) >= 1)) e.max_guests = ['Minimal 1 tamu.']
    if (Number(form.bedrooms) < 0 || form.bedrooms === '') e.bedrooms = ['Isi jumlah kamar tidur.']
    if (Number(form.bathrooms) < 0 || form.bathrooms === '') e.bathrooms = ['Isi jumlah kamar mandi.']
    if (existing.length + pendingPhotos.length < 1) e.photos = ['Unggah minimal 1 foto properti (disarankan 3 atau lebih).']
    return e
  }

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const uploadPhotos = async (villaId, list) => {
    const failed = []
    for (let i = 0; i < list.length; i++) {
      const p = list[i]
      setProgress(`Mengunggah foto ${i + 1} dari ${list.length}…`)
      setPhotos((ps) => ps.map((x) => (x.key === p.key ? { ...x, status: 'uploading', error: '' } : x)))
      const fd = new FormData()
      fd.append('image', p.file, p.file.name)
      if (p.key === effectivePrimary) fd.append('primary', '1')

      let ok = false
      let message = ''
      for (let attempt = 0; attempt < 2 && !ok; attempt++) {
        try {
          const res = await api.post(`/owner/villas/${villaId}/images`, fd)
          ok = true
          setExisting((imgs) => {
            const next = res.data.is_primary ? imgs.map((x) => ({ ...x, is_primary: false })) : imgs
            return [...next, res.data]
          })
        } catch (err) {
          message =
            err.response?.status === 413
              ? 'File terlalu besar untuk server.'
              : err.response?.data?.errors?.image?.[0] || err.response?.data?.message || 'Koneksi terputus.'
          if (err.response && err.response.status < 500 && err.response.status !== 429) break // error validasi: jangan ulang
        }
      }
      setPhotos((ps) => ps.map((x) => (x.key === p.key ? { ...x, status: ok ? 'done' : 'error', error: ok ? '' : message } : x)))
      if (!ok) failed.push(p)
    }
    return failed
  }

  const submit = async (e) => {
    e.preventDefault()
    if (saving) return
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length) {
      scrollTop()
      return
    }
    if (preparing > 0) return alert('Tunggu sebentar, foto masih dioptimalkan.')

    setSaving(true)
    setProgress('Menyimpan data properti…')
    const fd = new FormData()
    Object.entries(form).forEach(([k, val]) => {
      if (k === 'is_active') return
      fd.append(k, val ?? '')
    })
    fd.append('amenities', selected.join(','))
    if (editing && villa?.review_status === 'approved') fd.append('is_active', form.is_active ? '1' : '0')
    if (editing) fd.append('_method', 'PUT')

    let saved
    try {
      const res = await api.post(editing ? `/owner/villas/${id}` : '/owner/villas', fd)
      saved = res.data
    } catch (err) {
      const status = err.response?.status
      setErrors(
        err.response?.data?.errors || {
          general: [
            !err.response
              ? 'Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.'
              : status === 413
                ? 'Data terlalu besar untuk dikirim.'
                : err.response?.data?.message || 'Gagal menyimpan properti.',
          ],
        }
      )
      setSaving(false)
      setProgress('')
      scrollTop()
      return
    }

    // Foto diunggah satu per satu setelah data tersimpan
    const toUpload = photos.filter((p) => p.status !== 'done')
    const failed = toUpload.length ? await uploadPhotos(saved.id, toUpload) : []

    setSaving(false)
    setProgress('')

    if (failed.length) {
      setErrors({ photos: [`${failed.length} foto gagal diunggah. Data properti sudah tersimpan — klik Simpan lagi untuk mencoba ulang foto yang gagal.`] })
      if (!editing) navigate(`/owner/properties/${saved.id}/edit`, { replace: true })
      setVilla(saved)
      return
    }

    navigate('/owner/properties', {
      replace: true,
      state: { flash: editing ? 'Perubahan properti tersimpan.' : 'Properti dikirim untuk ditinjau.' },
    })
  }

  if (loading) return <PageLoader />
  if (loadError)
    return (
      <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-sand-200">
        <p className="text-sm text-gray-600">{loadError}</p>
        <Link to="/owner/properties" className="mt-3 inline-block text-sm font-semibold text-brand-700">
          Kembali ke daftar properti
        </Link>
      </div>
    )

  const descLen = form.description.trim().length
  const generalError = errors.general?.[0]
  const fieldErr = (k) => errors[k]?.[0]

  return (
    <div ref={topRef} className="scroll-mt-24 pb-28 lg:pb-0">
      <Link to="/owner/properties" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-800">
        <ArrowLeft className="h-4 w-4" /> Properti Saya
      </Link>

      <PageHeader
        eyebrow={editing ? 'Edit listing' : 'Listing baru'}
        title={editing ? form.name || 'Edit Properti' : 'Tambah Properti'}
        subtitle={
          editing
            ? 'Perbarui informasi properti Anda. Perubahan pada properti yang sudah tayang langsung berlaku di situs.'
            : 'Lengkapi data berikut. Properti akan ditinjau tim Bamboe Oerip (biasanya 1×24 jam) sebelum tayang.'
        }
        actions={villa && <PropertyStatusPill villa={villa} />}
      />

      {villa?.review_status === 'rejected' && (
        <div className="mb-5 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <div className="font-semibold">Properti perlu diperbaiki</div>
            <p className="mt-0.5">{villa.review_note || 'Lihat catatan dari admin.'}</p>
            <p className="mt-1 text-xs text-rose-700/80">Setelah diperbaiki, klik “Ajukan Ulang” — properti akan ditinjau kembali.</p>
          </div>
        </div>
      )}
      {villa?.review_status === 'pending' && (
        <div className="mb-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Clock className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>Properti sedang ditinjau. Anda tetap bisa melengkapi data dan foto selama proses tinjauan.</p>
        </div>
      )}

      {generalError && <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{generalError}</div>}
      {Object.keys(errors).filter((k) => k !== 'general').length > 0 && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Periksa kembali isian yang ditandai merah di bawah.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <form id="property-form" onSubmit={submit} className="min-w-0 space-y-6" noValidate>
          {/* ===== Dasar ===== */}
          <Section id="dasar" icon={Building2} title="Informasi Dasar" subtitle="Nama & deskripsi yang menarik meningkatkan minat tamu.">
            <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
              <Field label="Nama properti" required error={fieldErr('name')}>
                <input className={inputCls} value={form.name} maxLength={255} onChange={(e) => set('name', e.target.value)} placeholder="mis. Villa Bambu Asri Ubud" />
              </Field>
              <Field label="Tipe properti" error={fieldErr('type')}>
                <select className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value)}>
                  {[...new Set([...TYPES, form.type])].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-4">
              <Field
                label="Deskripsi"
                required
                error={fieldErr('description')}
                hint={`${descLen} karakter${descLen < MIN_DESC ? ` — minimal ${MIN_DESC}` : ''}. Ceritakan suasana, view, akses, dan keunggulan properti.`}
              >
                <textarea
                  rows={5}
                  className={inputCls}
                  value={form.description}
                  maxLength={10000}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Villa dengan view sawah, kolam renang pribadi, 10 menit dari pusat kota…"
                />
              </Field>
            </div>
          </Section>

          {/* ===== Lokasi ===== */}
          <Section id="lokasi" icon={MapPin} title="Lokasi" subtitle="Pilih wilayah bertingkat, lalu tandai titik lokasi pada peta.">
            <RegionSelect
              value={{ province: form.province, city: form.city, district: form.district, village: form.village }}
              onChange={(partial) => setForm((f) => ({ ...f, ...partial }))}
            />
            {(fieldErr('province') || fieldErr('city')) && <p className="mt-1.5 text-xs text-rose-600">{fieldErr('province') || fieldErr('city')}</p>}
            <div className="mt-4">
              <Field label="Alamat lengkap" required error={fieldErr('address')} hint="Nama jalan, nomor, dan patokan. Ditampilkan ke tamu setelah memesan.">
                <textarea rows={2} className={inputCls} value={form.address} maxLength={2000} onChange={(e) => set('address', e.target.value)} />
              </Field>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-brand-900">Titik peta</span>
                <button
                  type="button"
                  onClick={geocode}
                  disabled={geocoding}
                  className="inline-flex items-center gap-2 rounded-lg bg-sand-100 px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:bg-sand-200 disabled:opacity-60"
                >
                  {geocoding ? <Spinner className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />} Cari dari alamat
                </button>
              </div>
              <div className="overflow-hidden rounded-xl ring-1 ring-sand-200">
                <MapPicker lat={form.latitude} lng={form.longitude} onChange={({ lat, lng }) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))} />
              </div>
              <p className="mt-1.5 text-xs text-gray-400">Klik peta atau geser marker. Koordinat terisi otomatis.</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Latitude" error={fieldErr('latitude')}>
                  <input className={inputCls} inputMode="decimal" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder="-8.5069" />
                </Field>
                <Field label="Longitude" error={fieldErr('longitude')}>
                  <input className={inputCls} inputMode="decimal" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="115.2625" />
                </Field>
              </div>
            </div>
          </Section>

          {/* ===== Harga ===== */}
          <Section id="harga" icon={Wallet} title="Harga & Kapasitas" subtitle="Harga per malam yang Anda terima (di luar biaya layanan & pajak platform).">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Harga per malam (Rp)"
                required
                error={fieldErr('price_per_night')}
                hint={Number(form.price_per_night) > 0 ? `= ${rupiah(form.price_per_night)} / malam` : 'Tanpa titik atau koma, mis. 1500000'}
              >
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={form.price_per_night}
                  onChange={(e) => set('price_per_night', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="1500000"
                />
              </Field>
              <Field label="Luas bangunan (m²)" error={fieldErr('size_sqm')}>
                <input className={inputCls} inputMode="numeric" value={form.size_sqm} onChange={(e) => set('size_sqm', e.target.value.replace(/\D/g, '').slice(0, 7))} placeholder="opsional" />
              </Field>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stepper label="Maks. tamu" value={form.max_guests} min={1} onChange={(v) => set('max_guests', v)} error={fieldErr('max_guests')} />
              <Stepper label="Kamar tidur" value={form.bedrooms} min={0} onChange={(v) => set('bedrooms', v)} error={fieldErr('bedrooms')} />
              <Stepper label="Kamar mandi" value={form.bathrooms} min={0} onChange={(v) => set('bathrooms', v)} error={fieldErr('bathrooms')} />
            </div>
          </Section>

          {/* ===== Fasilitas ===== */}
          <Section id="fasilitas" icon={Sparkles} title="Fasilitas" subtitle="Pilih semua fasilitas yang tersedia untuk tamu.">
            {amenities.length === 0 ? (
              <p className="text-sm text-gray-400">Daftar fasilitas belum tersedia.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {amenities.map((a) => {
                  const on = selected.includes(a.id)
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelected((s) => (on ? s.filter((x) => x !== a.id) : [...s, a.id]))}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                        on ? 'bg-brand-800 text-white shadow-sm' : 'bg-white text-gray-600 ring-1 ring-inset ring-sand-200 hover:bg-sand-50'
                      }`}
                    >
                      {on && <Check className="h-3.5 w-3.5 text-gold-300" />}
                      {a.name}
                    </button>
                  )
                })}
              </div>
            )}
          </Section>

          {/* ===== Foto ===== */}
          <Section id="foto" icon={Images} title="Foto Properti" subtitle="Minimal 3 foto disarankan. Foto otomatis dioptimalkan sebelum diunggah.">
            {fieldErr('photos') && <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{fieldErr('photos')}</p>}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {existing.map((img) => (
                <Thumb
                  key={`e${img.id}`}
                  src={img.url}
                  primary={img.is_primary}
                  onPrimary={!img.is_primary ? () => makeExistingPrimary(img) : null}
                  onRemove={() => deleteExisting(img)}
                />
              ))}
              {pendingPhotos.map((p) => (
                <Thumb
                  key={p.key}
                  src={p.url}
                  primary={p.key === effectivePrimary}
                  isNew
                  status={p.status}
                  error={p.error}
                  onPrimary={p.key !== effectivePrimary && !saving ? () => setPrimaryKey(p.key) : null}
                  onRemove={!saving ? () => removeNew(p.key) : null}
                />
              ))}
              {Array.from({ length: preparing }).map((_, i) => (
                <div key={`prep${i}`} className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl bg-sand-50 text-xs text-gray-400 ring-1 ring-sand-200">
                  <Loader2 className="h-5 w-5 animate-spin text-gold-500" /> Mengoptimalkan…
                </div>
              ))}
              <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gold-300/70 bg-gold-50/40 text-center text-xs font-medium text-brand-800 transition hover:border-gold-400 hover:bg-gold-50">
                <ImagePlus className="h-6 w-6 text-gold-600" />
                Tambah foto
                <span className="text-[10px] font-normal text-gray-400">JPG · PNG · WEBP</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  disabled={saving}
                  onChange={(e) => {
                    addFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-xs text-gray-400">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              Ketuk ikon bintang untuk menjadikan foto utama (tampil pertama di pencarian). Gunakan foto landscape yang terang.
            </p>
          </Section>

          {/* ===== Tayang ===== */}
          {villa?.review_status === 'approved' && (
            <section className="flex items-center justify-between gap-4 rounded-2xl border border-sand-200/70 bg-white p-5">
              <div>
                <div className="text-sm font-semibold text-brand-900">Tayangkan di situs Bamboe Oerip</div>
                <div className="text-xs text-gray-500">Matikan untuk sementara menyembunyikan properti dari pencarian tamu.</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.is_active}
                onClick={() => set('is_active', !form.is_active)}
                className={`relative h-7 w-12 flex-shrink-0 rounded-full transition ${form.is_active ? 'bg-brand-700' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${form.is_active ? 'left-6' : 'left-1'}`} />
              </button>
            </section>
          )}
        </form>

        {/* ===== Sidebar progres (desktop) ===== */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-sand-200/70 bg-white p-5">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600">Kelengkapan</div>
              <div className="font-display text-2xl font-semibold text-brand-900">
                {doneCount}/{checklist.length}
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sand-100">
                <div className="h-full rounded-full bg-gradient-to-r from-gold-400 to-brand-600 transition-all" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
              </div>
              <ul className="mt-4 space-y-2">
                {checklist.map((c) => (
                  <li key={c.id}>
                    <a href={`#${c.id}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-800">
                      {c.ok ? <CheckCircle2 className="h-4 w-4 text-brand-600" /> : <span className="h-4 w-4 rounded-full border-2 border-sand-200" />}
                      {c.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <SubmitButton saving={saving} progress={progress} editing={editing} villa={villa} className="w-full" />
            <Link to="/owner/properties" className="block text-center text-sm text-gray-500 hover:text-brand-800">
              Batal
            </Link>
          </div>
        </aside>
      </div>

      {/* ===== Aksi bawah (mobile) ===== */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-sand-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        {progress && <div className="mb-2 text-center text-xs text-gray-500">{progress}</div>}
        <div className="flex gap-3">
          <Link to="/owner/properties" className="flex items-center justify-center rounded-xl px-4 text-sm font-medium text-gray-600 ring-1 ring-inset ring-sand-200">
            Batal
          </Link>
          <SubmitButton saving={saving} editing={editing} villa={villa} className="flex-1" />
        </div>
      </div>
    </div>
  )
}

function SubmitButton({ saving, progress, editing, villa, className = '' }) {
  const label = !editing ? 'Kirim untuk Ditinjau' : villa?.review_status === 'rejected' ? 'Ajukan Ulang' : 'Simpan Perubahan'
  return (
    <div className={className}>
      <GoldButton type="submit" form="property-form" disabled={saving} className="w-full !py-3">
        {saving ? <Spinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
        {saving ? 'Menyimpan…' : label}
      </GoldButton>
      {progress && <p className="mt-2 hidden text-center text-xs text-gray-500 lg:block">{progress}</p>}
    </div>
  )
}

function Stepper({ label, value, min = 0, onChange, error }) {
  const n = Number(value) || 0
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-brand-900">{label}</span>
      <div className={`flex items-center overflow-hidden rounded-xl border bg-white ${error ? 'border-rose-300' : 'border-sand-200'}`}>
        <button type="button" onClick={() => onChange(Math.max(min, n - 1))} className="px-3 py-2.5 text-lg leading-none text-brand-800 hover:bg-sand-50" aria-label={`Kurangi ${label}`}>
          −
        </button>
        <input
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onBlur={() => onChange(Math.max(min, Number(value) || min))}
          className="w-full min-w-0 bg-transparent text-center text-sm font-semibold text-brand-900 outline-none"
        />
        <button type="button" onClick={() => onChange(n + 1)} className="px-3 py-2.5 text-lg leading-none text-brand-800 hover:bg-sand-50" aria-label={`Tambah ${label}`}>
          +
        </button>
      </div>
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </div>
  )
}

function Thumb({ src, primary, isNew, status, error, onPrimary, onRemove }) {
  return (
    <div className={`group relative aspect-[4/3] overflow-hidden rounded-xl bg-sand-100 ring-2 ${primary ? 'ring-gold-400' : 'ring-transparent'}`}>
      <img src={src} alt="" className="h-full w-full object-cover" />
      {primary && (
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-gold-400 px-1.5 py-0.5 text-[10px] font-bold text-brand-900">
          <Star className="h-3 w-3 fill-brand-900" /> Utama
        </span>
      )}
      {isNew && status === 'ready' && <span className="absolute right-2 top-2 rounded-md bg-brand-800/80 px-1.5 py-0.5 text-[10px] font-medium text-white">Baru</span>}
      {status === 'uploading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-brand-900/50">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-x-0 bottom-0 bg-rose-600/90 px-2 py-1 text-[10px] text-white" title={error}>
          Gagal: {error}
        </div>
      )}
      {(onPrimary || onRemove) && status !== 'uploading' && (
        <div className="absolute right-2 bottom-2 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
          {onPrimary && (
            <button type="button" onClick={onPrimary} title="Jadikan foto utama" className="rounded-lg bg-white/90 p-1.5 text-gold-600 shadow hover:bg-white">
              <Star className="h-3.5 w-3.5" />
            </button>
          )}
          {onRemove && (
            <button type="button" onClick={onRemove} title="Hapus foto" className="rounded-lg bg-white/90 p-1.5 text-rose-600 shadow hover:bg-white">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
