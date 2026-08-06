import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

/**
 * Peta lokasi read-only (marker tetap) untuk halaman detail.
 * Tidak render bila koordinat tidak valid.
 */
export default function MapView({ lat, lng, label, zoom = 15, className = 'h-72' }) {
  const elRef = useRef(null)
  const mapRef = useRef(null)

  const la = Number(lat)
  const ln = Number(lng)
  const valid = Number.isFinite(la) && Number.isFinite(ln) && (la !== 0 || ln !== 0)

  useEffect(() => {
    if (!valid || mapRef.current || !elRef.current) return
    const map = L.map(elRef.current, { scrollWheelZoom: false }).setView([la, ln], zoom)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)
    const marker = L.marker([la, ln]).addTo(map)
    if (label) marker.bindPopup(label)
    mapRef.current = map
    setTimeout(() => map.invalidateSize(), 200)
    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, la, ln, zoom])

  if (!valid) return null

  return (
    <div
      ref={elRef}
      className={`${className} w-full overflow-hidden rounded-xl border border-gray-200`}
      style={{ zIndex: 0 }}
    />
  )
}
