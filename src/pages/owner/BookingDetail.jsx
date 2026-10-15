import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, Users, BedDouble, CalendarDays, MessageSquareText, MapPin, Wallet, CheckCircle2, Clock, XCircle } from 'lucide-react'
import api from '../../lib/api'
import { rupiah, formatDateTime } from '../../lib/format'
import { PageLoader } from '../../components/ui'
import { useOwnerTheme, Panel, BookingStatusPill, dmy, titleCase } from './kit'

const PAYMENT = {
  awaiting: { label: 'Menunggu pembayaran tamu', icon: Clock, cls: 'text-amber-700 bg-amber-50' },
  submitted: { label: 'Bukti bayar sedang diverifikasi admin', icon: Clock, cls: 'text-sky-700 bg-sky-50' },
  verified: { label: 'Pembayaran terverifikasi', icon: CheckCircle2, cls: 'text-emerald-700 bg-emerald-50' },
  rejected: { label: 'Pembayaran ditolak', icon: XCircle, cls: 'text-rose-700 bg-rose-50' },
}

function waLink(phone) {
  let n = String(phone || '').replace(/\D/g, '')
  if (!n) return null
  if (n.startsWith('0')) n = '62' + n.slice(1)
  else if (n.startsWith('8')) n = '62' + n
  return `https://wa.me/${n}`
}

export default function OwnerBookingDetail() {
  const { id } = useParams()
  useOwnerTheme('Detail Pesanan')
  const [b, setB] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setB(null)
    setError('')
    api
      .get(`/owner/bookings/${id}`)
      .then((res) => setB(res.data))
      .catch((e) => setError(e.response?.status === 404 ? 'Pesanan tidak ditemukan atau sudah dihapus.' : 'Gagal memuat pesanan.'))
  }, [id])

  if (error)
    return (
      <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-sand-200">
        <p className="text-sm text-gray-600">{error}</p>
        <Link to="/owner/bookings" className="mt-3 inline-block text-sm font-semibold text-brand-700">
          Kembali ke daftar pesanan
        </Link>
      </div>
    )
  if (!b) return <PageLoader />

  const pay = PAYMENT[b.payment?.status]
  const canContact = ['confirmed', 'completed'].includes(b.status)
  const wa = waLink(b.guest_phone)

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/owner/bookings" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-800">
        <ArrowLeft className="h-4 w-4" /> Pesanan
      </Link>

      <div
        className="relative mb-6 overflow-hidden rounded-3xl p-6 text-white sm:p-7"
        style={{ background: 'radial-gradient(80% 120% at 100% 0%, #2a7a4f 0%, transparent 55%), linear-gradient(135deg, #143a26 0%, #0b2117 100%)' }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-xs tracking-wider text-gold-300">{b.booking_code}</div>
            <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{b.guest_name}</h1>
            <p className="mt-1 text-sm text-emerald-50/70">{b.villa?.name}</p>
          </div>
          <div className="rounded-full bg-white px-1 py-1">
            <BookingStatusPill status={b.status} />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Check-in', value: dmy(b.check_in), icon: CalendarDays },
            { label: 'Check-out', value: dmy(b.check_out), icon: CalendarDays },
            { label: 'Durasi', value: `${b.nights} malam`, icon: BedDouble },
            { label: 'Tamu', value: `${b.guests} orang`, icon: Users },
          ].map((x) => (
            <div key={x.label} className="rounded-2xl bg-white/[0.07] px-4 py-3 ring-1 ring-inset ring-white/10">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-emerald-50/60">
                <x.icon className="h-3.5 w-3.5 text-gold-300" /> {x.label}
              </div>
              <div className="mt-1 font-display text-lg font-semibold">{x.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Panel title="Data tamu">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Item label="Nama pemesan" value={b.guest_name} />
              <Item
                label="No. HP / WhatsApp"
                value={
                  canContact ? (
                    <span className="flex flex-wrap items-center gap-3">
                      <a href={`tel:${b.guest_phone}`} className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                        <Phone className="h-3.5 w-3.5" /> {b.guest_phone}
                      </a>
                      {wa && (
                        <a href={wa} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-emerald-600 hover:underline">
                          WhatsApp
                        </a>
                      )}
                    </span>
                  ) : (
                    <span className="text-gray-400">Tampil setelah pesanan terkonfirmasi</span>
                  )
                }
              />
              <Item
                label="Email"
                value={
                  canContact && b.guest_email ? (
                    <a href={`mailto:${b.guest_email}`} className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                      <Mail className="h-3.5 w-3.5" /> {b.guest_email}
                    </a>
                  ) : canContact ? (
                    '-'
                  ) : (
                    <span className="text-gray-400">Tampil setelah pesanan terkonfirmasi</span>
                  )
                }
              />
              <Item label="Dipesan pada" value={formatDateTime(b.created_at)} />
            </dl>
            {b.notes && (
              <div className="mt-5 flex gap-3 rounded-xl bg-sand-50 p-4 text-sm text-gray-700">
                <MessageSquareText className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-600" />
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Catatan tamu</div>
                  <p className="mt-0.5 whitespace-pre-line">{b.notes}</p>
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Properti">
            <div className="flex gap-4">
              <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-sand-100">
                {b.villa?.primary_image_url && <img src={b.villa.primary_image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0">
                <Link to={`/owner/properties/${b.villa_id}/edit`} className="font-semibold text-brand-900 hover:underline">
                  {b.villa?.name}
                </Link>
                <p className="mt-1 flex items-start gap-1 text-xs text-gray-500">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gold-600" /> {[b.villa?.address, titleCase(b.villa?.city)].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Rincian pendapatan">
            <dl className="space-y-2.5 text-sm">
              <Row label={`${rupiah(b.price_per_night)} × ${b.nights} malam`} value={rupiah(b.subtotal)} />
              <div className="my-3 border-t border-dashed border-sand-200" />
              <Row label="Nilai sewa Anda" value={rupiah(b.subtotal)} strong />
            </dl>
            <p className="mt-3 text-xs text-gray-400">Biaya layanan, pajak, dan promo dikelola oleh Bamboe Oerip dan tidak mengurangi nilai sewa Anda.</p>
          </Panel>

          <Panel title="Status pembayaran">
            {pay ? (
              <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${pay.cls}`}>
                <pay.icon className="h-5 w-5 flex-shrink-0" /> {pay.label}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Data pembayaran tidak tersedia.</p>
            )}
            {b.payment?.verified_at && b.payment.status === 'verified' && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                <Wallet className="h-3.5 w-3.5" /> Diverifikasi {formatDateTime(b.payment.verified_at)}
              </p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Item({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</dt>
      <dd className="mt-1 break-words text-sm text-gray-800">{value || '-'}</dd>
    </div>
  )
}

function Row({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={strong ? 'font-semibold text-brand-900' : 'text-gray-500'}>{label}</dt>
      <dd className={strong ? 'font-display text-lg font-semibold text-brand-900' : 'text-gray-800'}>{value}</dd>
    </div>
  )
}
