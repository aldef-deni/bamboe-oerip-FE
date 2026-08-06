import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, X, Tag, Image as ImageIcon, Upload } from 'lucide-react'
import api from '../../lib/api'
import { rupiah, formatDate } from '../../lib/format'
import { PageLoader, Button, Input, Textarea, Badge, EmptyState, MobileList, DesktopTable, DataCard } from '../../components/ui'
import DateRangePicker from '../../components/DateRangePicker'

const emptyForm = {
  code: '',
  description: '',
  type: 'percentage',
  value: '',
  min_spend: '',
  max_discount: '',
  quota: '',
  starts_at: '',
  expires_at: '',
  is_active: true,
  is_popup: false,
}

export default function AdminPromos() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | {} | promo
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [existingImage, setExistingImage] = useState(null)
  const fileRef = useRef(null)

  const imagePreview = imageFile ? URL.createObjectURL(imageFile) : !removeImage ? existingImage : null

  const load = () => {
    setLoading(true)
    api
      .get('/admin/promos', { params: { per_page: 100 } })
      .then((res) => setItems(res.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const resetImage = () => {
    setImageFile(null)
    setRemoveImage(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const openNew = () => {
    setForm(emptyForm)
    setErrors({})
    setExistingImage(null)
    resetImage()
    setEditing({})
  }

  const openEdit = (p) => {
    setForm({
      code: p.code,
      description: p.description || '',
      type: p.type,
      value: p.value,
      min_spend: p.min_spend || '',
      max_discount: p.max_discount || '',
      quota: p.quota || '',
      starts_at: p.starts_at ? p.starts_at.slice(0, 10) : '',
      expires_at: p.expires_at ? p.expires_at.slice(0, 10) : '',
      is_active: p.is_active,
      is_popup: p.is_popup,
    })
    setErrors({})
    setExistingImage(p.image_url || null)
    resetImage()
    setEditing(p)
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async (e) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    const fd = new FormData()
    fd.append('code', form.code)
    fd.append('description', form.description || '')
    fd.append('type', form.type)
    fd.append('value', form.value)
    if (form.min_spend) fd.append('min_spend', form.min_spend)
    if (form.max_discount && form.type === 'percentage') fd.append('max_discount', form.max_discount)
    if (form.quota) fd.append('quota', form.quota)
    if (form.starts_at) fd.append('starts_at', form.starts_at)
    if (form.expires_at) fd.append('expires_at', form.expires_at)
    fd.append('is_active', form.is_active ? '1' : '0')
    fd.append('is_popup', form.is_popup ? '1' : '0')
    if (imageFile) fd.append('image', imageFile)
    if (removeImage) fd.append('remove_image', '1')

    try {
      if (editing.id) {
        fd.append('_method', 'PUT')
        await api.post(`/admin/promos/${editing.id}`, fd)
      } else {
        await api.post('/admin/promos', fd)
      }
      setEditing(null)
      load()
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: [err.response?.data?.message || 'Gagal menyimpan.'] })
    } finally {
      setSaving(false)
    }
  }

  const pickImage = (e) => {
    const f = e.target.files[0]
    if (f) {
      setImageFile(f)
      setRemoveImage(false)
    }
  }
  const clearImage = () => {
    setImageFile(null)
    setRemoveImage(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  const remove = async (p) => {
    if (!confirm(`Hapus promo "${p.code}"?`)) return
    await api.delete(`/admin/promos/${p.id}`)
    setItems((it) => it.filter((x) => x.id !== p.id))
  }

  const valueLabel = (p) => (p.type === 'percentage' ? `${Number(p.value)}%` : rupiah(p.value))

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Promo</h1>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Tambah Promo
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Tag} title="Belum ada promo" subtitle="Buat kode promo pertama Anda." />
      ) : (
        <>
          {/* Mobile: kartu */}
          <MobileList>
            {items.map((p) => (
              <DataCard key={p.id}>
                <div className="flex gap-3">
                  <div className="h-14 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50">
                    {p.image_url ? (
                      <img src={p.image_url} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span className="font-mono font-semibold text-gray-900">{p.code}</span>
                        {p.is_popup && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            POPUP
                          </span>
                        )}
                      </div>
                      {p.is_active ? (
                        <Badge className="flex-shrink-0 bg-emerald-100 text-emerald-700">Aktif</Badge>
                      ) : (
                        <Badge className="flex-shrink-0 bg-gray-200 text-gray-600">Nonaktif</Badge>
                      )}
                    </div>
                    <div className="mt-1 font-semibold text-brand-700">
                      {valueLabel(p)}
                      {p.type === 'percentage' && p.max_discount && (
                        <span className="text-xs font-normal text-gray-400"> · maks {rupiah(p.max_discount)}</span>
                      )}
                    </div>
                    {p.description && <p className="mt-1 line-clamp-2 text-xs text-gray-500">{p.description}</p>}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-gray-50 pt-3">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Min. belanja</div>
                    <div className="text-sm text-gray-800">{p.min_spend ? rupiah(p.min_spend) : '-'}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Kuota</div>
                    <div className="text-sm text-gray-800">
                      {p.quota ? `${p.used_count}/${p.quota}` : `${p.used_count} / ∞`}
                    </div>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Periode</div>
                    <div className="text-sm text-gray-800">
                      {p.starts_at || p.expires_at
                        ? `${p.starts_at ? formatDate(p.starts_at) : '…'} – ${p.expires_at ? formatDate(p.expires_at) : '…'}`
                        : 'Tanpa batas'}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2 border-t border-gray-50 pt-3">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-50 py-2.5 text-sm font-semibold text-brand-700"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button
                    onClick={() => remove(p)}
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
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Potongan</th>
                <th className="px-4 py-3">Min. Belanja</th>
                <th className="px-4 py-3">Kuota</th>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50">
                        {p.image_url ? (
                          <img src={p.image_url} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-gray-900">{p.code}</span>
                          {p.is_popup && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">POPUP</span>
                          )}
                        </div>
                        {p.description && <div className="text-xs text-gray-400">{p.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-brand-700">
                    {valueLabel(p)}
                    {p.type === 'percentage' && p.max_discount && (
                      <div className="text-[11px] font-normal text-gray-400">maks {rupiah(p.max_discount)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.min_spend ? rupiah(p.min_spend) : '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.quota ? `${p.used_count}/${p.quota}` : `${p.used_count} / ∞`}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {p.starts_at || p.expires_at ? (
                      <>
                        {p.starts_at ? formatDate(p.starts_at) : '…'} – {p.expires_at ? formatDate(p.expires_at) : '…'}
                      </>
                    ) : (
                      'Tanpa batas'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.is_active ? (
                      <Badge className="bg-emerald-100 text-emerald-700">Aktif</Badge>
                    ) : (
                      <Badge className="bg-gray-200 text-gray-600">Nonaktif</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-gray-500 hover:bg-brand-50 hover:text-brand-700">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(p)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600">
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

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 p-4" onClick={() => setEditing(null)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={save}
            className="my-8 w-full max-w-lg rounded-2xl bg-white p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{editing.id ? 'Edit Promo' : 'Tambah Promo'}</h2>
              <button type="button" onClick={() => setEditing(null)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {errors.general && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errors.general[0]}</div>}

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Kode promo"
                  required
                  value={form.code}
                  onChange={(e) => set('code', e.target.value.toUpperCase())}
                  error={errors.code?.[0]}
                  placeholder="HEMAT10"
                />
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Tipe</span>
                  <select
                    value={form.type}
                    onChange={(e) => set('type', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                </label>
              </div>

              <Textarea
                label="Deskripsi"
                required
                rows={3}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                error={errors.description?.[0]}
                placeholder="Ditampilkan pada card promo. Contoh: Dapatkan diskon 10% untuk penginapan di villa Bamboe Oerip, berlaku untuk semua unit."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label={form.type === 'percentage' ? 'Nilai diskon (%)' : 'Nilai diskon (Rp)'}
                  type="number"
                  required
                  value={form.value}
                  onChange={(e) => set('value', e.target.value)}
                  error={errors.value?.[0]}
                />
                {form.type === 'percentage' && (
                  <Input
                    label="Maks. potongan (Rp)"
                    type="number"
                    value={form.max_discount}
                    onChange={(e) => set('max_discount', e.target.value)}
                  />
                )}
                <Input
                  label="Min. belanja (Rp)"
                  type="number"
                  value={form.min_spend}
                  onChange={(e) => set('min_spend', e.target.value)}
                />
                <Input label="Kuota pemakaian" type="number" value={form.quota} onChange={(e) => set('quota', e.target.value)} />
              </div>

              <div>
                <span className="mb-1 block text-sm font-medium text-gray-700">Periode berlaku (opsional)</span>
                <DateRangePicker
                  checkIn={form.starts_at}
                  checkOut={form.expires_at}
                  onChange={({ check_in, check_out }) => setForm((f) => ({ ...f, starts_at: check_in, expires_at: check_out }))}
                  placeholder="Pilih periode promo"
                />
                {errors.expires_at && <p className="mt-1 text-xs text-red-600">{errors.expires_at[0]}</p>}
              </div>

              {/* Foto promo */}
              <div>
                <span className="mb-1 block text-sm font-medium text-gray-700">Foto promo (untuk card & popup)</span>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                    {imagePreview ? (
                      <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <ImageIcon className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
                    <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                      <Upload className="h-4 w-4" /> Pilih Foto
                    </Button>
                    {imagePreview && (
                      <button type="button" onClick={clearImage} className="block text-xs font-medium text-red-600 hover:underline">
                        Hapus foto
                      </button>
                    )}
                    <p className="text-xs text-gray-400">JPG/PNG, rasio landscape disarankan.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 border-t border-gray-100 pt-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="h-4 w-4 rounded text-brand-600" />
                  Aktif
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={form.is_popup} onChange={(e) => set('is_popup', e.target.checked)} className="h-4 w-4 rounded text-brand-600" />
                  Tampilkan sebagai popup saat buka web
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Batal
              </Button>
              <Button type="submit" loading={saving}>
                Simpan
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
