import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Perbaiki path ikon marker default agar tampil di bundler (Vite)
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const INDONESIA = [-2.5, 118]

export default function MapPicker({ lat, lng, onChange }) {
  const elRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    if (mapRef.current || !elRef.current) return

    const hasPoint = Number.isFinite(+lat) && Number.isFinite(+lng) && (+lat !== 0 || +lng !== 0)
    const center = hasPoint ? [+lat, +lng] : INDONESIA
    const zoom = hasPoint ? 15 : 5

    const map = L.map(elRef.current).setView(center, zoom)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker(center, { draggable: true }).addTo(map)
    const emit = (ll) => onChange?.({ lat: +ll.lat.toFixed(7), lng: +ll.lng.toFixed(7) })
    marker.on('dragend', () => emit(marker.getLatLng()))
    map.on('click', (e) => {
      marker.setLatLng(e.latlng)
      emit(e.latlng)
    })

    mapRef.current = map
    markerRef.current = marker
    setTimeout(() => map.invalidateSize(), 200)

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sinkronkan marker saat lat/lng berubah dari luar (geocode / input manual)
  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return
    const la = +lat
    const ln = +lng
    if (!Number.isFinite(la) || !Number.isFinite(ln) || (la === 0 && ln === 0)) return
    const cur = marker.getLatLng()
    if (Math.abs(cur.lat - la) < 1e-6 && Math.abs(cur.lng - ln) < 1e-6) return
    marker.setLatLng([la, ln])
    map.setView([la, ln], Math.max(map.getZoom(), 15))
  }, [lat, lng])

  return (
    <div
      ref={elRef}
      className="h-72 w-full overflow-hidden rounded-xl border border-gray-200"
      style={{ zIndex: 0 }}
    />
  )
}
