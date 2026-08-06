import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Star, Trash2, Upload, MapPin, Search, X } from 'lucide-react'
import api from '../../lib/api'
import { PageLoader, Button, Input, Textarea } from '../../components/ui'
import RegionSelect from '../../components/RegionSelect'
import MapPicker from '../../components/MapPicker'

const empty = {
  name: '',
  type: 'Villa',
  province: '',
  city: '',
  district: '',
  village: '',
  address: '',
  description: '',
  price_per_night: '',
  weekend_price: '',
  max_guests: 2,
  bedrooms: 1,
  bathrooms: 1,
  size_sqm: '',
  latitude: '',
  longitude: '',
  is_active: true,
  is_featured: false,
}

export default function VillaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)

  const [form, setForm] = useState(empty)
  const [amenities, setAmenities] = useState([])
  const [selected, setSelected] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    api.get('/amenities').then((res) => setAmenities(res.data))
  }, [])

  useEffect(() => {
    if (!editing) return
    api
      .get(`/admin/villas/${id}`)
      .then((res) => {
        const v = res.data
        setForm({
          name: v.name,
          type: v.type || 'Villa',
          province: v.province || '',
          city: v.city || '',
          district: v.district || '',
          village: v.village || '',
          address: v.address || '',
          description: v.description || '',
          price_per_night: v.price_per_night,
          weekend_price: v.weekend_price || '',
          max_guests: v.max_guests,
          bedrooms: v.bedrooms,
          bathrooms: v.bathrooms,
          size_sqm: v.size_sqm || '',
          latitude: v.latitude || '',
          longitude: v.longitude || '',
          is_active: v.is_active,
          is_featured: v.is_featured,
        })
        setSelected(v.amenities.map((a) => a.id))
        setExistingImages(v.images || [])
      })
      .finally(() => setLoading(false))
  }, [id, editing])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const [geocoding, setGeocoding] = useState(false)
  const geocode = async () => {
    const q = [form.address, form.village, form.district, form.city, form.province, 'Indonesia']
      .filter(Boolean)
      .join(', ')
    if (q === 'Indonesia') return alert('Isi wilayah / alamat terlebih dahulu.')
    setGeocoding(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=id&q=${encodeURIComponent(q)}`,
        { headers: { 'Accept-Language': 'id' } }
      )
      const data = await res.json()
      if (data && data[0]) {
        setForm((f) => ({
          ...f,
          latitude: Number(data[0].lat).toFixed(7),
          longitude: Number(data[0].lon).toFixed(7),
        }))
      } else {
        alert('Lokasi tidak ditemukan. Lengkapi alamat atau geser marker peta secara manual.')
      }
    } catch {
      alert('Gagal mencari lokasi. Periksa koneksi internet.')
    } finally {
      setGeocoding(false)
    }
  }

  // Foto baru yang dipilih + preview + pilihan foto utama
  const [newPreviews, setNewPreviews] = useState([])
  const [primaryIndex, setPrimaryIndex] = useState(null) // index foto baru yg dijadikan utama (null = default)
  useEffect(() => {
    const urls = newImages.map((f) => URL.createObjectURL(f))
    setNewPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [newImages])

  // Tambah (append) file baru tanpa menghapus yang sudah dipilih; hindari duplikat
  const addFiles = (fileList) => {
    const incoming = [...fileList]
    setNewImages((prev) => {
      const seen = new Set(prev.map((f) => f.name + f.size))
      const merged = [...prev]
      incoming.forEach((f) => {
        if (!seen.has(f.name + f.size)) merged.push(f)
      })
      return merged
    })
  }

  const removeNewImage = (idx) => {
    setNewImages((imgs) => imgs.filter((_, i) => i !== idx))
    setPrimaryIndex((p) => {
      if (p === null) return null
      if (idx === p) return null
      if (idx < p) return p - 1
      return p
    })
  }

  // Foto utama efektif: pilihan admin, atau default foto pertama (untuk villa baru)
  const effectivePrimary = primaryIndex !== null ? primaryIndex : existingImages.length === 0 ? 0 : -1

  const toggleAmenity = (aid) =>
    setSelected((s) => (s.includes(aid) ? s.filter((x) => x !== aid) : [...s, aid]))

  const deleteImage = async (img) => {
    if (!confirm('Hapus foto ini?')) return
    await api.delete(`/admin/villas/${id}/images/${img.id}`)
    setExistingImages((imgs) => imgs.filter((x) => x.id !== img.id))
  }

  const setPrimary = async (img) => {
    await api.post(`/admin/villas/${id}/images/${img.id}/primary`)
    setExistingImages((imgs) => imgs.map((x) => ({ ...x, is_primary: x.id === img.id })))
  }

  const submit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (typeof v === 'boolean') fd.append(k, v ? '1' : '0')
      else fd.append(k, v ?? '')
    })
    fd.append('amenities', selected.join(','))
    newImages.forEach((file) => fd.append('images[]', file))
    if (primaryIndex !== null) fd.append('primary_index', String(primaryIndex))

    try {
      if (editing) {
        await api.post(`/admin/villas/${id}`, fd)
      } else {
        await api.post('/admin/villas', fd)
      }
      navigate('/admin/villas')
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: [err.response?.data?.message || 'Gagal menyimpan.'] })
      window.scrollTo(0, 0)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/villas" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{editing ? 'Edit Villa' : 'Tambah Villa'}</h1>

      {errors.general && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errors.general[0]}</div>}

      <form onSubmit={submit} className="space-y-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">Informasi Dasar</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nama villa" required value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name?.[0]} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Tipe</span>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
              >
                <option>Villa</option>
                <option>Cabin</option>
                <option>Pod</option>
                <option>Bungalow</option>
                <option>Apartment</option>
              </select>
            </label>
          </div>
          <div className="mt-4">
            <Textarea label="Deskripsi" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
        </div>

        {/* Lokasi */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="mb-1 font-semibold text-gray-900">Lokasi</h2>
          <p className="mb-4 text-xs text-gray-400">
            Pilih wilayah bertingkat, isi alamat lengkap, lalu tandai titik lokasi di peta.
          </p>

          <RegionSelect
            value={{ province: form.province, city: form.city, district: form.district, village: form.village }}
            onChange={(partial) => setForm((f) => ({ ...f, ...partial }))}
          />
          {errors.city?.[0] && <p className="mt-1 text-xs text-red-600">{errors.city[0]}</p>}

          <div className="mt-4">
            <Textarea
              label="Alamat lengkap (jalan, nomor, patokan)"
              rows={2}
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
            />
          </div>

          <div className="mt-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <MapPin className="h-4 w-4 text-brand-600" /> Titik Peta
              </span>
              <Button type="button" variant="subtle" onClick={geocode} loading={geocoding}>
                <Search className="h-4 w-4" /> Cari dari alamat
              </Button>
            </div>
            <MapPicker
              lat={form.latitude}
              lng={form.longitude}
              onChange={({ lat, lng }) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Klik peta atau geser marker untuk menandai lokasi — koordinat terisi otomatis.
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Input label="Latitude" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder="-8.5069" />
              <Input label="Longitude" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="115.2625" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">Harga & Kapasitas</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Harga per malam (Rp)"
              type="number"
              required
              value={form.price_per_night}
              onChange={(e) => set('price_per_night', e.target.value)}
              error={errors.price_per_night?.[0]}
            />
            <Input
              label="Harga weekend (Rp, opsional)"
              type="number"
              value={form.weekend_price}
              onChange={(e) => set('weekend_price', e.target.value)}
            />
            <Input label="Maks. tamu" type="number" min="1" required value={form.max_guests} onChange={(e) => set('max_guests', e.target.value)} />
            <Input label="Luas (m²)" type="number" value={form.size_sqm} onChange={(e) => set('size_sqm', e.target.value)} />
            <Input label="Kamar tidur" type="number" min="0" required value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} />
            <Input label="Kamar mandi" type="number" min="0" required value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">Fasilitas</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {amenities.map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={selected.includes(a.id)}
                  onChange={() => toggleAmenity(a.id)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                {a.name}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">Foto</h2>
          {existingImages.length > 0 && (
            <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {existingImages.map((img) => (
                <div key={img.id} className="group relative overflow-hidden rounded-xl border border-gray-100">
                  <img src={img.url} alt="" className="aspect-square w-full object-cover" />
                  {img.is_primary && (
                    <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Utama
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/50 p-1 opacity-0 transition group-hover:opacity-100">
                    {!img.is_primary && (
                      <button type="button" onClick={() => setPrimary(img)} className="rounded p-1 text-white hover:bg-white/20" title="Jadikan utama">
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button type="button" onClick={() => deleteImage(img)} className="rounded p-1 text-white hover:bg-white/20" title="Hapus">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-8 text-sm text-gray-500 hover:border-brand-400">
            <Upload className="h-6 w-6" />
            {newImages.length > 0 ? `${newImages.length} foto dipilih — klik untuk menambah lagi` : 'Klik untuk unggah foto (bisa banyak)'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = '' // reset agar bisa pilih file sama lagi & tetap memicu onChange
              }}
            />
          </label>

          {newPreviews.length > 0 && (
            <>
              <p className="mt-3 text-xs text-gray-400">
                Arahkan kursor ke foto untuk menghapus atau menjadikannya <span className="font-medium text-brand-600">foto utama</span>.
              </p>
              <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {newPreviews.map((src, i) => (
                  <div
                    key={i}
                    className={`group relative overflow-hidden rounded-xl border-2 ${
                      i === effectivePrimary ? 'border-brand-600' : 'border-gray-100'
                    }`}
                  >
                    <img src={src} alt="" className="aspect-square w-full object-cover" />

                    {/* aksi saat hover */}
                    <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/50 p-1 opacity-0 transition group-hover:opacity-100">
                      {i !== effectivePrimary && (
                        <button
                          type="button"
                          onClick={() => setPrimaryIndex(i)}
                          className="rounded p-1 text-white hover:bg-white/20"
                          title="Jadikan foto utama"
                        >
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeNewImage(i)}
                        className="rounded p-1 text-white hover:bg-white/20"
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {i === effectivePrimary && (
                      <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        <Star className="h-2.5 w-2.5 fill-white" /> Utama
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="h-4 w-4 rounded text-brand-600" />
              Aktif (tampilkan di situs)
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} className="h-4 w-4 rounded text-brand-600" />
              Villa unggulan
            </label>
          </div>
        </div>

        {/* Aksi: menempel di bawah layar pada mobile agar tak perlu scroll jauh */}
        <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:justify-end md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <Button as={Link} to="/admin/villas" variant="ghost" className="flex-1 md:flex-none">
            Batal
          </Button>
          <Button type="submit" loading={saving} className="flex-1 md:flex-none">
            {editing ? 'Simpan Perubahan' : 'Tambah Villa'}
          </Button>
        </div>
      </form>
    </div>
  )
}
