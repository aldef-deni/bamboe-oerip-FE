import { useEffect, useState } from 'react'
import { Store, Phone, Landmark, Check, Settings as SettingsIcon, Percent } from 'lucide-react'
import api from '../../lib/api'
import { PageLoader, Button, Input, Textarea } from '../../components/ui'

const FIELDS = [
  {
    section: 'Informasi Situs',
    desc: 'Identitas & biaya layanan platform.',
    icon: Store,
    keys: [
      { key: 'site_name', label: 'Nama situs' },
      { key: 'site_tagline', label: 'Tagline' },
      { key: 'service_fee_percent', label: 'Biaya layanan (%)', type: 'number' },
    ],
  },
  {
    section: 'Kontak',
    desc: 'Informasi kontak yang tampil untuk pelanggan.',
    icon: Phone,
    keys: [
      { key: 'contact_email', label: 'Email' },
      { key: 'contact_phone', label: 'Telepon' },
      { key: 'whatsapp', label: 'WhatsApp (62…)' },
      { key: 'address', label: 'Alamat', textarea: true },
    ],
  },
  {
    section: 'Rekening Pembayaran',
    desc: 'Rekening tujuan transfer & instruksi pembayaran.',
    icon: Landmark,
    keys: [
      { key: 'bank_name', label: 'Nama bank' },
      { key: 'bank_account_number', label: 'Nomor rekening' },
      { key: 'bank_account_name', label: 'Atas nama' },
      { key: 'payment_instructions', label: 'Instruksi pembayaran', textarea: true },
    ],
  },
]

export default function AdminSettings() {
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get('/admin/settings').then((res) => setValues(res.data || {})).finally(() => setLoading(false))
  }, [])

  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const res = await api.put('/admin/settings', { settings: values })
      setValues(res.data)
      setMessage('Pengaturan berhasil disimpan.')
      setTimeout(() => setMessage(''), 2500)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="mx-auto max-w-3xl pb-24">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-sm text-gray-500">Kelola informasi situs, kontak, dan rekening pembayaran.</p>
        </div>
      </div>

      {/* Toast sukses */}
      {message && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
          <Check className="h-4 w-4" /> {message}
        </div>
      )}

      <form onSubmit={save} className="space-y-5">
        {FIELDS.map((group) => (
          <div key={group.section} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            {/* Kepala seksi */}
            <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/50 px-6 py-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <group.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{group.section}</h2>
                <p className="text-xs text-gray-400">{group.desc}</p>
              </div>
            </div>

            {/* Isi */}
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              {group.keys.map((f) => (
                <div key={f.key} className={f.textarea ? 'sm:col-span-2' : ''}>
                  {f.textarea ? (
                    <Textarea label={f.label} rows={3} value={values[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} />
                  ) : (
                    <Input label={f.label} type={f.type || 'text'} value={values[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Pajak (PPN) */}
        {(() => {
          const taxOn = ['1', 'true', true].includes(values.tax_enabled)
          return (
            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/50 px-6 py-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Percent className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Pajak (PPN)</h2>
                  <p className="text-xs text-gray-400">Jika aktif, PPN ditampilkan & ditambahkan pada total pembayaran customer.</p>
                </div>
              </div>

              <div className="space-y-4 p-6">
                {/* Toggle aktif/nonaktif */}
                <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Aktifkan PPN</div>
                    <div className="text-xs text-gray-400">{taxOn ? 'PPN sedang aktif.' : 'PPN nonaktif — tidak ditambahkan ke total.'}</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={taxOn}
                    onClick={() => set('tax_enabled', taxOn ? '0' : '1')}
                    className={`relative h-7 w-12 flex-shrink-0 rounded-full transition ${taxOn ? 'bg-brand-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${taxOn ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                {/* Persentase */}
                <div className="max-w-xs">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-gray-700">Persentase PPN (%)</span>
                    <div className="flex items-center gap-2 rounded-xl border border-gray-300 px-3 focus-within:border-brand-500">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={values.tax_percent ?? ''}
                        onChange={(e) => set('tax_percent', e.target.value)}
                        placeholder="cth: 11"
                        className="w-full bg-transparent py-2.5 text-sm outline-none"
                      />
                      <Percent className="h-4 w-4 text-gray-400" />
                    </div>
                  </label>
                  <p className="mt-1 text-xs text-gray-400">Dihitung dari subtotal + biaya layanan − diskon.</p>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Bar simpan mengambang */}
        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white/90 px-5 py-3 shadow-lg backdrop-blur">
          <span className="hidden text-xs text-gray-400 sm:block">Perubahan berlaku setelah disimpan.</span>
          <Button type="submit" loading={saving} className="w-full sm:w-auto">
            <Check className="h-4 w-4" /> Simpan Pengaturan
          </Button>
        </div>
      </form>
    </div>
  )
}
