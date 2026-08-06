import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, Users, BedDouble, Bath, Maximize, Heart, Check, Calendar, Navigation } from 'lucide-react'
import api from '../lib/api'
import { rupiah, nightsBetween, formatDate } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import StarRating from '../components/StarRating'
import MapView from '../components/MapView'
import DateRangePicker from '../components/DateRangePicker'
import { PageLoader, Button, EmptyState } from '../components/ui'

export default function VillaDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const settings = useSettings()
  const [villa, setVilla] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [wishlisted, setWishlisted] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const [dates, setDates] = useState({ check_in: '', check_out: '', guests: 1 })
  const [availability, setAvailability] = useState(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    setLoading(true)
    api
      .get(`/villas/${slug}`)
      .then((res) => setVilla(res.data))
      .catch(() => setVilla(null))
      .finally(() => setLoading(false))
  }, [slug])

  const nights = nightsBetween(dates.check_in, dates.check_out)
  const feePercent = Number(settings.service_fee_percent || 0)
  const subtotal = villa ? Number(villa.price_per_night) * nights : 0
  const serviceFee = Math.round((subtotal * feePercent) / 100)
  const total = subtotal + serviceFee

  const checkAvailability = async () => {
    if (!dates.check_in || !dates.check_out) return
    setChecking(true)
    setAvailability(null)
    try {
      const res = await api.post(`/villas/${villa.id}/availability`, {
        check_in: dates.check_in,
        check_out: dates.check_out,
      })
      setAvailability(res.data.available)
    } catch {
      setAvailability(null)
    } finally {
      setChecking(false)
    }
  }

  const toggleWishlist = async () => {
    if (!user) return navigate('/login')
    const res = await api.post(`/villas/${villa.id}/wishlist`)
    setWishlisted(res.data.wishlisted)
  }

  const goToCheckout = () => {
    if (!user) return navigate('/login', { state: { from: `/villa/${slug}` } })
    const params = new URLSearchParams(dates)
    navigate(`/checkout/${slug}?${params.toString()}`)
  }

  if (loading) return <PageLoader />
  if (!villa)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="Villa tidak ditemukan" action={<Link to="/villas" className="text-brand-700 underline">Kembali ke daftar</Link>} />
      </div>
    )

  const images = villa.images || []

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{villa.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {villa.city}
              {villa.province ? `, ${villa.province}` : ''}
            </span>
            {Number(villa.rating_avg) > 0 && <StarRating value={villa.rating_avg} showValue count={villa.review_count} />}
          </div>
        </div>
        <button
          onClick={toggleWishlist}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium ${
            wishlisted ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} /> Simpan
        </button>
      </div>

      {/* Gallery */}
      <div className="mb-8 overflow-hidden rounded-2xl">
        <div className="aspect-[16/9] w-full bg-brand-50">
          {images.length > 0 ? (
            <img src={images[activeImg]?.url} alt={villa.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-300 text-2xl font-semibold text-brand-700">
              Villa Box
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveImg(i)}
                className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                  i === activeImg ? 'border-brand-600' : 'border-transparent'
                }`}
              >
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Info */}
        <div>
          <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-6 sm:grid-cols-4">
            <Spec icon={Users} label="Tamu" value={`${villa.max_guests} orang`} />
            <Spec icon={BedDouble} label="Kamar" value={`${villa.bedrooms} kamar`} />
            <Spec icon={Bath} label="Kamar mandi" value={`${villa.bathrooms}`} />
            {villa.size_sqm && <Spec icon={Maximize} label="Luas" value={`${villa.size_sqm} m²`} />}
          </div>

          <div className="border-b border-gray-100 py-6">
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Tentang villa ini</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">{villa.description}</p>
          </div>

          {villa.amenities?.length > 0 && (
            <div className="border-b border-gray-100 py-6">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Fasilitas</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {villa.amenities.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-brand-600" /> {a.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(villa.address || (villa.latitude && villa.longitude)) && (
            <div className="border-b border-gray-100 py-6">
              <h2 className="mb-2 text-lg font-semibold text-gray-900">Lokasi</h2>
              {villa.address && (
                <p className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" /> {villa.address}
                </p>
              )}
              {villa.latitude && villa.longitude && (
                <div className="mt-3">
                  <MapView lat={villa.latitude} lng={villa.longitude} label={villa.name} />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${villa.latitude},${villa.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
                  >
                    <Navigation className="h-4 w-4" /> Buka di Google Maps
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Reviews */}
          <div className="py-6">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Ulasan ({villa.review_count})</h2>
            {villa.reviews?.length > 0 ? (
              <div className="space-y-4">
                {villa.reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium text-gray-800">{r.user?.name || 'Tamu'}</span>
                      <StarRating value={r.rating} size={14} />
                    </div>
                    {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Belum ada ulasan untuk villa ini.</p>
            )}
          </div>
        </div>

        {/* Booking widget */}
        <div>
          <div className="sticky top-20 rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="mb-4">
              <span className="text-2xl font-bold text-brand-700">{rupiah(villa.price_per_night)}</span>
              <span className="text-sm text-gray-500"> / malam</span>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">Tanggal menginap</span>
                <DateRangePicker
                  checkIn={dates.check_in}
                  checkOut={dates.check_out}
                  onChange={({ check_in, check_out }) => {
                    setDates({ ...dates, check_in, check_out })
                    setAvailability(null)
                  }}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">Jumlah tamu</span>
                <input
                  type="number"
                  min="1"
                  max={villa.max_guests}
                  value={dates.guests}
                  onChange={(e) => setDates({ ...dates, guests: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
            </div>

            {nights > 0 && (
              <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
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
                <div className="flex justify-between border-t border-gray-100 pt-2 font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{rupiah(total)}</span>
                </div>
              </div>
            )}

            {availability === true && (
              <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                ✓ Tersedia untuk {formatDate(dates.check_in)} – {formatDate(dates.check_out)}
              </p>
            )}
            {availability === false && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                Tidak tersedia pada tanggal tersebut.
              </p>
            )}

            <div className="mt-4 space-y-2">
              <Button variant="outline" className="w-full" onClick={checkAvailability} loading={checking} disabled={nights === 0}>
                <Calendar className="h-4 w-4" /> Cek Ketersediaan
              </Button>
              <Button className="w-full" onClick={goToCheckout} disabled={nights === 0 || availability === false}>
                Pesan Sekarang
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Spec({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-brand-600" />
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-medium text-gray-800">{value}</div>
      </div>
    </div>
  )
}
