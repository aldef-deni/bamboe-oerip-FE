import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation, ImageOff } from 'lucide-react'
import api from '../lib/api'
import { rupiah } from '../lib/format'
import { Spinner } from './ui'

const INDONESIA_CENTER = [-2.5, 118]

// Marker kustom (lingkaran hijau) — hindari isu ikon default Leaflet di bundler
const makeIcon = (active) =>
  L.divIcon({
    className: 'vb-marker',
    html: `<span class="vb-pin${active ? ' vb-pin--active' : ''}"></span>`,
    iconSize: active ? [28, 28] : [20, 20],
    iconAnchor: active ? [14, 14] : [10, 10],
    popupAnchor: [0, active ? -16 : -12],
  })

// Terbang ke titik aktif + buka popup-nya
function Focuser({ point, markerRefs }) {
  const map = useMap()
  useEffect(() => {
    if (!point) return
    map.flyTo([point.lat, point.lng], 13, { duration: 0.8 })
    const t = setTimeout(() => markerRefs.current[point.id]?.openPopup(), 350)
    return () => clearTimeout(t)
  }, [point, map, markerRefs])
  return null
}

// Sesuaikan tampilan peta agar semua titik (hasil filter) terlihat
function FitBounds({ points, trigger }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger])
  return null
}

export default function BranchMap() {
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [province, setProvince] = useState('all')
  const [activeId, setActiveId] = useState(null)
  const markerRefs = useRef({})

  useEffect(() => {
    api
      .get('/villas/map')
      .then((r) => setPoints(r.data || []))
      .catch(() => setPoints([]))
      .finally(() => setLoading(false))
  }, [])

  const provinces = useMemo(
    () => ['all', ...Array.from(new Set(points.map((p) => p.province))).sort()],
    [points],
  )
  const filtered = useMemo(
    () => (province === 'all' ? points : points.filter((p) => p.province === province)),
    [points, province],
  )
  const active = filtered.find((p) => p.id === activeId) || null

  const selectPoint = (id) => setActiveId((cur) => (cur === id ? null : id))

  // Sembunyikan seluruh section bila belum ada villa berkoordinat
  if (!loading && points.length === 0) return null

  return (
    <section className="border-t border-gray-100 bg-gradient-to-b from-white to-brand-50/40">
      <style>{`
        .vb-pin{display:block;width:100%;height:100%;border-radius:9999px;background:#0e9f6e;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(14,63,45,.35);}
        .vb-pin--active{background:#1e5c3c;box-shadow:0 0 0 6px rgba(30,92,60,.25),0 3px 8px rgba(14,63,45,.45);}
        .vb-marker{background:transparent;border:0;}
        .leaflet-container{font-family:inherit;}
        .leaflet-popup-content-wrapper{border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.12);}
        .leaflet-popup-content{margin:0;width:210px!important;}
      `}</style>

      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        {/* Judul */}
        <div className="mb-6 text-center">
          <h2 className="font-serif text-2xl font-bold text-gray-900 md:text-3xl">
            Menjangkau Setiap Sudut Indonesia
          </h2>
          <p className="mt-2 text-sm text-gray-500 md:text-base">
            Temukan unit kami yang tersebar di berbagai destinasi Nusantara.
          </p>
          <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-gold-400 to-brand-500" />
        </div>

        {/* Filter provinsi */}
        {provinces.length > 1 && (
          <div className="mb-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {provinces.map((prov) => (
              <button
                key={prov}
                onClick={() => {
                  setProvince(prov)
                  setActiveId(null)
                }}
                className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  province === prov
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-brand-300'
                }`}
              >
                {prov === 'all' ? 'Semua' : prov}
              </button>
            ))}
          </div>
        )}

        {/* Peta + daftar */}
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Daftar lokasi — geser horizontal di HP, sidebar vertikal di desktop */}
          <div className="order-2 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] lg:order-1 lg:max-h-[520px] lg:snap-none lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:pb-0 lg:pr-1 [&::-webkit-scrollbar]:hidden">
            {loading ? (
              <div className="flex w-full justify-center py-10">
                <Spinner className="h-7 w-7 text-brand-600" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="w-full py-10 text-center text-sm text-gray-400">Belum ada lokasi di provinsi ini.</p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPoint(p.id)}
                  className={`group flex w-[80%] max-w-[290px] flex-shrink-0 snap-start gap-3 rounded-2xl border p-2.5 text-left transition sm:w-[46%] lg:w-auto lg:max-w-none lg:flex-shrink ${
                    activeId === p.id
                      ? 'border-brand-400 bg-brand-50/70 shadow-sm'
                      : 'border-gray-100 bg-white hover:border-brand-200 hover:shadow-sm'
                  }`}
                >
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <ImageOff className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-gray-900">{p.name}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3 text-brand-500" />
                      <span className="truncate">
                        {p.city}
                        {p.province && p.province !== 'Lainnya' ? `, ${p.province}` : ''}
                      </span>
                    </div>
                    <span
                      className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold ${
                        activeId === p.id ? 'text-brand-700' : 'text-brand-600 group-hover:text-brand-700'
                      }`}
                    >
                      <Navigation className="h-3 w-3" /> Buka peta
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Peta */}
          <div className="relative order-1 isolate z-0 h-[360px] overflow-hidden rounded-2xl border border-gray-100 shadow-sm sm:h-[440px] lg:order-2 lg:h-[520px]">
            <MapContainer
              center={INDONESIA_CENTER}
              zoom={5}
              scrollWheelZoom={false}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filtered.map((p) => (
                <Marker
                  key={p.id}
                  position={[p.lat, p.lng]}
                  icon={makeIcon(activeId === p.id)}
                  ref={(el) => {
                    if (el) markerRefs.current[p.id] = el
                  }}
                  eventHandlers={{ click: () => setActiveId(p.id) }}
                >
                  <Popup>
                    <div className="overflow-hidden rounded-xl">
                      {p.image && (
                        <img src={p.image} alt={p.name} className="h-24 w-full object-cover" />
                      )}
                      <div className="p-2.5">
                        <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3 text-brand-500" /> {p.city}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          Mulai <span className="font-semibold text-brand-700">{rupiah(p.price)}</span>/malam
                        </div>
                        <Link
                          to={`/villa/${p.slug}`}
                          className="mt-2 block rounded-lg bg-brand-600 py-1.5 text-center text-xs font-semibold text-white transition hover:bg-brand-700"
                        >
                          Lihat detail
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              <Focuser point={active} markerRefs={markerRefs} />
              <FitBounds points={filtered} trigger={province} />
            </MapContainer>
          </div>
        </div>
      </div>
    </section>
  )
}
