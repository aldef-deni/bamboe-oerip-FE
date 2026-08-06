import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import api from '../lib/api'

/**
 * Input tujuan dengan autocomplete: menampilkan saran DESTINASI (kota) & AKOMODASI (nama villa).
 * Klik villa -> langsung ke detail. Klik kota -> isi kolom. Teks bebas tetap dicari (name/city/province).
 */
export default function DestinationSearch({ value, onChange, placeholder = 'Kota atau nama villa', glass = false }) {
  const navigate = useNavigate()
  const ref = useRef(null)
  const [open, setOpen] = useState(false)
  const [villas, setVillas] = useState([])
  const [cities, setCities] = useState([])
  const [allCities, setAllCities] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/villas/cities').then((r) => setAllCities(r.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    const q = (value || '').trim()
    if (q.length < 2) {
      setVillas([])
      setCities([])
      return
    }
    setCities(allCities.filter((c) => c.toLowerCase().includes(q.toLowerCase())).slice(0, 4))
    const t = setTimeout(() => {
      setLoading(true)
      api
        .get('/villas', { params: { search: q, per_page: 6 } })
        .then((r) => setVillas(r.data.data || []))
        .catch(() => setVillas([]))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [value, allCities])

  const pickCity = (c) => {
    onChange(c)
    setOpen(false)
  }
  const pickVilla = (v) => {
    setOpen(false)
    navigate(`/villa/${v.slug}`)
  }

  const showDrop = open && (value || '').trim().length >= 2 && (cities.length > 0 || villas.length > 0 || loading)

  return (
    <div className="relative" ref={ref}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${
          glass
            ? 'border-white/30 bg-white/15 text-white placeholder-white/60 focus:border-white/60 focus:bg-white/25'
            : 'border-gray-200 focus:border-brand-500'
        }`}
      />
      {showDrop && (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-gray-100 bg-white py-2 shadow-xl">
          {cities.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Destinasi</p>
              {cities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => pickCity(c)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <MapPin className="h-4 w-4 text-gray-400" /> {c}
                </button>
              ))}
            </div>
          )}
          {villas.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Akomodasi</p>
              {villas.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => pickVilla(v)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-gray-50"
                >
                  <div className="h-9 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-brand-50">
                    {v.primary_image_url ? (
                      <img src={v.primary_image_url} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-brand-600">VB</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-800">{v.name}</div>
                    <div className="truncate text-xs text-gray-400">
                      {v.city}
                      {v.province ? `, ${v.province}` : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {loading && villas.length === 0 && <p className="px-3 py-2 text-sm text-gray-400">Mencari…</p>}
        </div>
      )}
    </div>
  )
}
