import { useEffect, useState } from 'react'
import { X, Copy, Check, Upload, Building2 } from 'lucide-react'
import api from '../lib/api'
import { rupiah } from '../lib/format'
import { Button, Input } from './ui'

/**
 * Modal pembayaran: info rekening + form upload bukti transfer.
 * Muncul setelah pesanan dibuat. onSuccess dipanggil setelah bukti terkirim.
 */
export default function PaymentModal({ booking, onClose, onSuccess }) {
  const [bank, setBank] = useState({})
  const [copied, setCopied] = useState(false)
  const [proof, setProof] = useState(null)
  const [form, setForm] = useState({ bank_name: '', sender_name: booking?.guest_name || '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/payment/bank-info').then((r) => setBank(r.data)).catch(() => {})
  }, [])

  const copyAccount = () => {
    navigator.clipboard.writeText(bank.bank_account_number || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!proof) return setError('Silakan unggah bukti transfer.')
    setError('')
    setSubmitting(true)
    const fd = new FormData()
    fd.append('bank_name', form.bank_name)
    fd.append('sender_name', form.sender_name)
    fd.append('proof', proof)
    try {
      await api.post(`/bookings/${booking.id}/payment`, fd)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengunggah bukti transfer.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <Building2 className="h-5 w-5 text-brand-600" /> Selesaikan Pembayaran
          </h2>
          <button onClick={onClose} title="Tutup">
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          {/* Nominal */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-center text-white">
            <p className="text-sm text-white/80">Total yang harus ditransfer</p>
            <p className="mt-1 text-3xl font-bold">{rupiah(booking.total)}</p>
            <p className="mt-1 text-xs text-white/70">Kode pesanan: {booking.booking_code}</p>
          </div>

          {/* Rekening */}
          <div className="mt-4 rounded-2xl border border-gray-100 p-4 text-sm">
            <p className="mb-2 font-semibold text-gray-800">Transfer ke rekening:</p>
            <div className="space-y-1.5 text-gray-700">
              <p>
                Bank: <span className="font-semibold">{bank.bank_name || '-'}</span>
              </p>
              <p className="flex items-center gap-2">
                No. Rekening: <span className="font-semibold">{bank.bank_account_number || '-'}</span>
                <button type="button" onClick={copyAccount} className="text-brand-600 hover:text-brand-700" title="Salin">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </p>
              <p>
                Atas nama: <span className="font-semibold">{bank.bank_account_name || '-'}</span>
              </p>
            </div>
            {bank.payment_instructions && (
              <p className="mt-3 border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-500">
                {bank.payment_instructions}
              </p>
            )}
          </div>

          {/* Upload bukti */}
          <form onSubmit={submit} className="mt-4 space-y-3">
            <p className="text-sm font-semibold text-gray-800">Unggah bukti transfer</p>
            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Bank pengirim"
                required
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                placeholder="Contoh: BCA"
              />
              <Input
                label="Nama pengirim"
                required
                value={form.sender_name}
                onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
              />
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Foto bukti transfer</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProof(e.target.files[0])}
                className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700"
              />
            </label>
            <Button type="submit" className="w-full" loading={submitting}>
              <Upload className="h-4 w-4" /> Kirim Bukti &amp; Selesaikan
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-1 text-center text-sm text-gray-500 hover:text-gray-700"
            >
              Bayar &amp; unggah nanti
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
