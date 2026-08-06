import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, MapPin } from 'lucide-react'
import api from '../../lib/api'
import { rupiah, formatDate, STATUS_LABELS, STATUS_COLORS } from '../../lib/format'
import { PageLoader, Badge, EmptyState, Button } from '../../components/ui'

export default function BookingsTab() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/bookings')
      .then((res) => setBookings(res.data.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  if (bookings.length === 0)
    return (
      <EmptyState
        icon={CalendarCheck}
        title="Belum ada pesanan"
        subtitle="Mulai jelajahi villa dan buat pemesanan pertamamu."
        action={
          <Button as={Link} to="/villas">
            Cari Villa
          </Button>
        }
      />
    )

  return (
    <div className="space-y-4">
      {bookings.map((b) => (
        <Link
          key={b.id}
          to={`/bookings/${b.id}`}
          className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition hover:shadow-md sm:flex-row sm:items-center"
        >
          <div className="h-24 w-full flex-shrink-0 overflow-hidden rounded-xl bg-brand-50 sm:h-20 sm:w-28">
            {b.villa?.primary_image_url ? (
              <img src={b.villa.primary_image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-300 text-sm font-semibold text-brand-700">
                VB
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">{b.booking_code}</span>
              <Badge className={STATUS_COLORS[b.status]}>{STATUS_LABELS[b.status]}</Badge>
            </div>
            <h3 className="font-semibold text-gray-900">{b.villa?.name}</h3>
            <p className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" /> {b.villa?.city}
            </p>
            <div className="mt-1 text-sm text-gray-600">
              {formatDate(b.check_in)} – {formatDate(b.check_out)} · {b.nights} malam
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-brand-700">{rupiah(b.total)}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}
