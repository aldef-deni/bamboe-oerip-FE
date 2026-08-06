import { Link } from 'react-router-dom'
import { MapPin, Users, BedDouble } from 'lucide-react'
import { rupiah } from '../lib/format'
import StarRating from './StarRating'

export default function VillaCard({ villa }) {
  return (
    <Link
      to={`/villa/${villa.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-50">
        {villa.primary_image_url ? (
          <img
            src={villa.primary_image_url}
            alt={villa.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-300 text-brand-700">
            <span className="text-lg font-semibold">Villa Box</span>
          </div>
        )}
        {villa.is_featured && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-brand-700 shadow">
            ⭐ Unggulan
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-gray-900/70 px-2.5 py-1 text-xs font-medium text-white">
          {villa.type}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="h-3.5 w-3.5" />
          {villa.city}
          {villa.province ? `, ${villa.province}` : ''}
        </div>
        <h3 className="line-clamp-1 font-semibold text-gray-900">{villa.name}</h3>
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {villa.max_guests} tamu
          </span>
          <span className="inline-flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" /> {villa.bedrooms} kamar
          </span>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <span className="text-lg font-bold text-brand-700">{rupiah(villa.price_per_night)}</span>
            <span className="text-xs text-gray-500"> / malam</span>
          </div>
          {Number(villa.rating_avg) > 0 && <StarRating value={villa.rating_avg} size={14} showValue />}
        </div>
      </div>
    </Link>
  )
}
