import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import api from '../lib/api'
import VillaCard from '../components/VillaCard'
import SearchBar from '../components/SearchBar'
import { Spinner, EmptyState } from '../components/ui'

export default function Villas() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [villas, setVillas] = useState([])
  const [amenities, setAmenities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const params = Object.fromEntries(searchParams.entries())
  const selectedAmenities = params.amenities ? params.amenities.split(',').map(Number) : []

  useEffect(() => {
    api.get('/amenities').then((res) => setAmenities(res.data))
  }, [])

  useEffect(() => {
    setLoading(true)
    api
      .get('/villas', { params: { ...params, per_page: 24 } })
      .then((res) => setVillas(res.data.data))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  const toggleAmenity = (id) => {
    const set = new Set(selectedAmenities)
    set.has(id) ? set.delete(id) : set.add(id)
    updateParam('amenities', [...set].join(','))
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <SearchBar initial={params} />
      </div>

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        {/* Filters */}
        <aside className={`${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-5">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Urutkan</h3>
              <select
                value={params.sort || ''}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Paling Relevan</option>
                <option value="price_asc">Harga Terendah</option>
                <option value="price_desc">Harga Tertinggi</option>
                <option value="rating">Rating Tertinggi</option>
              </select>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Harga per malam</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  defaultValue={params.min_price || ''}
                  onBlur={(e) => updateParam('min_price', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  defaultValue={params.max_price || ''}
                  onBlur={(e) => updateParam('max_price', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Fasilitas</h3>
              <div className="space-y-2">
                {amenities.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(a.id)}
                      onChange={() => toggleAmenity(a.id)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    {a.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">{loading ? 'Memuat…' : `${villas.length} villa ditemukan`}</p>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filter
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner className="h-8 w-8 text-brand-600" />
            </div>
          ) : villas.length === 0 ? (
            <EmptyState title="Tidak ada villa" subtitle="Coba ubah kata kunci atau filter pencarian." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {villas.map((v) => (
                <VillaCard key={v.id} villa={v} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
