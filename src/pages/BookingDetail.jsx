import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Copy, Check, Upload, Building2 } from 'lucide-react'
import api from '../lib/api'
import { rupiah, formatDate, STATUS_LABELS, STATUS_COLORS } from '../lib/format'
import { PageLoader, Button, Input, Badge, EmptyState } from '../components/ui'

export default function BookingDetail() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [bank, setBank] = useState({})
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const [proof, setProof] = useState(null)
  const [payForm, setPayForm] = useState({ bank_name: '', sender_name: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([api.get(`/bookings/${id}`), api.get('/payment/bank-info')])
      .then(([b, bk]) => {
        setBooking(b.data)
        setBank(bk.data)
      })
      .catch(() => setBooking(null))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const copyAccount = () => {
    navigator.clipboard.writeText(bank.bank_account_number || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const submitProof = async (e) => {
    e.preventDefault()
    if (!proof) return setError('Silakan pilih file bukti transfer.')
    setError('')
    setSubmitting(true)
    const fd = new FormData()
    fd.append('bank_name', payForm.bank_name)
    fd.append('sender_name', payForm.sender_name)
    fd.append('proof', proof)
    try {
      const res = await api.post(`/bookings/${id}/payment`, fd)
      setBooking(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengunggah bukti.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageLoader />
  if (!booking)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="Pesanan tidak ditemukan" />
      </div>
    )

  const canPay = ['pending', 'awaiting_verification'].includes(booking.status)
  const payment = booking.payment

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">Kode Pesanan</p>
          <h1 className="text-2xl font-bold text-gray-900">{booking.booking_code}</h1>
        </div>
        <Badge className={STATUS_COLORS[booking.status]}>{STATUS_LABELS[booking.status]}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Booking summary */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex gap-3 border-b border-gray-100 pb-4">
            <div className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-brand-50">
              {booking.villa?.primary_image_url ? (
                <img src={booking.villa.primary_image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-300 text-xs font-semibold text-brand-700">
                  VB
                </div>
              )}
            </div>
            <div>
              <Link to={`/villa/${booking.villa?.slug}`} className="font-semibold text-gray-900 hover:text-brand-700">
                {booking.villa?.name}
              </Link>
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3" /> {booking.villa?.city}
              </p>
            </div>
          </div>

          <dl className="space-y-2 py-4 text-sm">
            <Row label="Check-in" value={formatDate(booking.check_in)} />
            <Row label="Check-out" value={formatDate(booking.check_out)} />
            <Row label="Durasi" value={`${booking.nights} malam`} />
            <Row label="Tamu" value={`${booking.guests} orang`} />
            <Row label="Atas nama" value={booking.guest_name} />
          </dl>

          <div className="space-y-2 border-t border-gray-100 pt-4 text-sm">
            <Row label={`${rupiah(booking.price_per_night)} × ${booking.nights} malam`} value={rupiah(booking.subtotal)} />
            {Number(booking.service_fee) > 0 && <Row label="Biaya layanan" value={rupiah(booking.service_fee)} />}
            {Number(booking.discount) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Diskon promo{booking.promo_code ? ` (${booking.promo_code})` : ''}</span>
                <span>−{rupiah(booking.discount)}</span>
              </div>
            )}
            {Number(booking.tax) > 0 && <Row label="PPN" value={rupiah(booking.tax)} />}
            <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900">
              <span>Total</span>
              <span className="text-brand-700">{rupiah(booking.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Building2 className="h-5 w-5 text-brand-600" /> Pembayaran
          </h2>

          {booking.status === 'confirmed' && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              ✓ Pembayaran terverifikasi. Pesanan Anda dikonfirmasi. Sampai jumpa di villa!
            </div>
          )}
          {booking.status === 'rejected' && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              Pembayaran ditolak. {payment?.note || 'Silakan hubungi kami.'}
            </div>
          )}
          {booking.status === 'cancelled' && (
            <div className="rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-600">Pesanan dibatalkan.</div>
          )}

          {canPay && (
            <>
              <div className="mb-4 rounded-xl bg-sand-50 p-4 text-sm">
                <p className="mb-2 text-gray-600">Transfer sejumlah</p>
                <p className="mb-3 text-xl font-bold text-brand-700">{rupiah(booking.total)}</p>
                <div className="space-y-1 text-gray-700">
                  <p>
                    Bank: <span className="font-semibold">{bank.bank_name}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    No. Rek: <span className="font-semibold">{bank.bank_account_number}</span>
                    <button onClick={copyAccount} className="text-brand-600 hover:text-brand-700">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </p>
                  <p>
                    a.n. <span className="font-semibold">{bank.bank_account_name}</span>
                  </p>
                </div>
                {bank.payment_instructions && (
                  <p className="mt-3 border-t border-sand-200 pt-3 text-xs text-gray-500">{bank.payment_instructions}</p>
                )}
              </div>

              {booking.status === 'awaiting_verification' && (
                <div className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Bukti transfer sudah kami terima dan sedang diverifikasi. Anda dapat mengunggah ulang bila diperlukan.
                </div>
              )}

              <form onSubmit={submitProof} className="space-y-3">
                {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}
                <Input
                  label="Bank pengirim"
                  required
                  value={payForm.bank_name}
                  onChange={(e) => setPayForm({ ...payForm, bank_name: e.target.value })}
                  placeholder="Contoh: BCA"
                />
                <Input
                  label="Nama pengirim"
                  required
                  value={payForm.sender_name}
                  onChange={(e) => setPayForm({ ...payForm, sender_name: e.target.value })}
                />
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Bukti transfer</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProof(e.target.files[0])}
                    className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700"
                  />
                </label>
                <Button type="submit" className="w-full" loading={submitting}>
                  <Upload className="h-4 w-4" /> Unggah Bukti Transfer
                </Button>
              </form>
            </>
          )}

          {payment?.proof_url && !canPay && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-gray-600">Bukti transfer:</p>
              <img src={payment.proof_url} alt="Bukti" className="max-h-64 rounded-xl border border-gray-100" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Link to="/profile/pesanan" className="text-sm font-medium text-brand-700 hover:underline">
          ← Kembali ke pesanan saya
        </Link>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-gray-600">
      <span>{label}</span>
      <span className="text-right font-medium text-gray-800">{value}</span>
    </div>
  )
}
