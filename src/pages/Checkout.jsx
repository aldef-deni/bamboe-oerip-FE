import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { MapPin, Tag } from 'lucide-react'
import api from '../lib/api'
import PaymentModal from '../components/PaymentModal'
import { rupiah, nightsBetween, formatDate } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { PageLoader, Button, Input, Textarea } from '../components/ui'

export default function Checkout() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const settings = useSettings()

  const check_in = searchParams.get('check_in')
  const check_out = searchParams.get('check_out')
  const guests = Number(searchParams.get('guests') || 1)

  const [villa, setVilla] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({ guest_name: '', guest_phone: '', guest_email: '', notes: '' })

  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null) // { code, discount, description }
  const [promoError, setPromoError] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [createdBooking, setCreatedBooking] = useState(null)

  useEffect(() => {
    api
      .get(`/villas/${slug}`)
      .then((res) => setVilla(res.data))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, guest_name: user.name || '', guest_phone: user.phone || '', guest_email: user.email || '' }))
    }
  }, [user])

  const nights = nightsBetween(check_in, check_out)
  const feePercent = Number(settings.service_fee_percent || 0)
  const subtotal = villa ? Number(villa.price_per_night) * nights : 0
  const serviceFee = Math.round((subtotal * feePercent) / 100)
  const discount = appliedPromo ? Number(appliedPromo.discount) : 0
  const preTax = subtotal + serviceFee - discount
  const taxEnabled = ['1', 'true', true].includes(settings.tax_enabled)
  const taxPercent = Number(settings.tax_percent || 0)
  const tax = taxEnabled && taxPercent > 0 ? Math.round((preTax * taxPercent) / 100) : 0
  const total = Math.max(0, preTax + tax)

  const applyPromo = async () => {
    const code = promoCode.trim()
    if (!code) return
    setPromoError('')
    setPromoLoading(true)
    try {
      const res = await api.post('/promos/validate', { code, subtotal })
      setAppliedPromo({ code: res.data.code, discount: res.data.discount, description: res.data.description })
    } catch (err) {
      setAppliedPromo(null)
      setPromoError(err.response?.data?.message || 'Kode promo tidak valid.')
    } finally {
      setPromoLoading(false)
    }
  }

  const removePromo = () => {
    setAppliedPromo(null)
    setPromoCode('')
    setPromoError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSubmitting(true)
    try {
      const res = await api.post('/bookings', {
        villa_id: villa.id,
        check_in,
        check_out,
        guests,
        promo_code: appliedPromo?.code || null,
        ...form,
      })
      setCreatedBooking(res.data) // buka modal pembayaran
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: [err.response?.data?.message || 'Gagal membuat pesanan.'] })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageLoader />
  if (!villa || nights === 0)
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-gray-600">Data pemesanan tidak valid.</div>

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Konfirmasi Pemesanan</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="space-y-5">
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Data Tamu</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nama tamu"
                required
                value={form.guest_name}
                onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                error={errors.guest_name?.[0]}
              />
              <Input
                label="No. HP / WhatsApp"
                required
                value={form.guest_phone}
                onChange={(e) => setForm({ ...form, guest_phone: e.target.value })}
                error={errors.guest_phone?.[0]}
              />
            </div>
            <div className="mt-4">
              <Input
                label="Email"
                type="email"
                value={form.guest_email}
                onChange={(e) => setForm({ ...form, guest_email: e.target.value })}
                error={errors.guest_email?.[0]}
              />
            </div>
            <div className="mt-4">
              <Textarea
                label="Catatan (opsional)"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Permintaan khusus, waktu tiba, dll."
              />
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="mb-1 font-semibold">Pesanan belum bisa dibuat:</p>
              {Object.values(errors).flat().map((m, i) => (
                <div key={i}>• {m}</div>
              ))}
            </div>
          )}

          <Button type="submit" className="w-full" loading={submitting}>
            Buat Pesanan & Lanjut Bayar
          </Button>
        </form>

        {/* Summary */}
        <div>
          <div className="sticky top-20 rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex gap-3 border-b border-gray-100 pb-4">
              <div className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-brand-50">
                {villa.primary_image_url ? (
                  <img src={villa.primary_image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-300 text-xs font-semibold text-brand-700">
                    VB
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{villa.name}</h3>
                <p className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" /> {villa.city}
                </p>
              </div>
            </div>

            <div className="space-y-2 border-b border-gray-100 py-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Check-in</span>
                <span className="font-medium text-gray-800">{formatDate(check_in)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Check-out</span>
                <span className="font-medium text-gray-800">{formatDate(check_out)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tamu</span>
                <span className="font-medium text-gray-800">{guests} orang</span>
              </div>
            </div>

            {/* Kode promo */}
            <div className="border-b border-gray-100 py-4">
              <label className="mb-1 block text-xs font-medium text-gray-500">Kode Promo</label>
              {appliedPromo ? (
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                      <Tag className="h-3.5 w-3.5" /> {appliedPromo.code}
                    </div>
                    {appliedPromo.description && (
                      <div className="truncate text-xs text-emerald-600">{appliedPromo.description}</div>
                    )}
                  </div>
                  <button type="button" onClick={removePromo} className="text-xs font-medium text-red-600 hover:underline">
                    Hapus
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Masukkan kode"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm uppercase outline-none focus:border-brand-500"
                    />
                    <Button type="button" variant="outline" onClick={applyPromo} loading={promoLoading} disabled={!promoCode.trim()}>
                      Pakai
                    </Button>
                  </div>
                  {promoError && <p className="mt-1 text-xs text-red-600">{promoError}</p>}
                </>
              )}
            </div>

            <div className="space-y-2 py-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>
                  {rupiah(villa.price_per_night)} × {nights} malam
                </span>
                <span>{rupiah(subtotal)}</span>
              </div>
              {serviceFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Biaya layanan ({feePercent}%)</span>
                  <span>{rupiah(serviceFee)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon promo ({appliedPromo.code})</span>
                  <span>−{rupiah(discount)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>PPN ({taxPercent}%)</span>
                  <span>{rupiah(tax)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900">
                <span>Total</span>
                <span className="text-brand-700">{rupiah(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {createdBooking && (
        <PaymentModal
          booking={createdBooking}
          onClose={() => navigate('/profile/pesanan', { replace: true })}
          onSuccess={() => navigate('/profile/pesanan', { replace: true })}
        />
      )}
    </div>
  )
}
