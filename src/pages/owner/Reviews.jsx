import { useEffect, useState } from 'react'
import { Star, ChevronLeft, ChevronRight, MessageSquareQuote } from 'lucide-react'
import api from '../../lib/api'
import { PageLoader } from '../../components/ui'
import { useOwnerTheme, PageHeader, Panel, dmy } from './kit'

function Stars({ value, size = 'h-4 w-4' }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${size} ${i <= value ? 'fill-gold-400 text-gold-400' : 'text-sand-200'}`} />
      ))}
    </span>
  )
}

export default function OwnerReviews() {
  useOwnerTheme('Ulasan Tamu')
  const [villas, setVillas] = useState([])
  const [villaId, setVillaId] = useState('')
  const [rating, setRating] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/owner/villas').then((res) => setVillas(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setPage(1)
  }, [villaId, rating])

  useEffect(() => {
    setLoading(true)
    api
      .get('/owner/reviews', { params: { villa_id: villaId || undefined, rating: rating || undefined, page } })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [villaId, rating, page])

  if (!data) return <PageLoader />

  const list = data.reviews.data
  const total = data.total || 0

  return (
    <div>
      <PageHeader eyebrow="Reputasi" title="Ulasan Tamu" subtitle="Apa kata tamu tentang properti Anda." />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <Panel>
            <div className="text-center">
              <div className="font-display text-5xl font-semibold text-brand-900">{total ? Number(data.average).toFixed(1).replace('.', ',') : '—'}</div>
              <div className="mt-2 flex justify-center">
                <Stars value={Math.round(data.average)} size="h-5 w-5" />
              </div>
              <div className="mt-1 text-sm text-gray-500">{total} ulasan</div>
            </div>
            <div className="mt-6 space-y-2">
              {[5, 4, 3, 2, 1].map((r) => {
                const n = Number(data.distribution?.[r] || 0)
                const pct = total ? (n / total) * 100 : 0
                const active = String(rating) === String(r)
                return (
                  <button
                    key={r}
                    onClick={() => setRating(active ? '' : String(r))}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-1 text-sm transition ${active ? 'bg-gold-50 ring-1 ring-gold-200' : 'hover:bg-sand-50'}`}
                  >
                    <span className="flex w-8 items-center gap-0.5 font-medium text-brand-900">
                      {r} <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-sand-100">
                      <span className="block h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-500" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="w-6 text-right text-xs text-gray-500">{n}</span>
                  </button>
                )
              })}
            </div>
          </Panel>

          <select value={villaId} onChange={(e) => setVillaId(e.target.value)} className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm outline-none">
            <option value="">Semua properti</option>
            {villas.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className={loading ? 'opacity-60 transition' : 'transition'}>
          {list.length === 0 ? (
            <div className="rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-sand-200">
              <MessageSquareQuote className="mx-auto h-10 w-10 text-gold-400" />
              <p className="mt-3 text-sm text-gray-500">Belum ada ulasan{rating ? ` bintang ${rating}` : ''}.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {list.map((rv) => (
                <article key={rv.id} className="rounded-2xl border border-sand-200/70 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    {rv.user?.avatar_url ? (
                      <img src={rv.user.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-800 font-display text-base font-semibold text-gold-200">
                        {rv.user?.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-brand-900">{rv.user?.name || 'Tamu'}</span>
                        <span className="text-xs text-gray-400">{dmy(rv.created_at)}</span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <Stars value={rv.rating} />
                        <span className="text-xs text-gray-500">· {rv.villa?.name}</span>
                      </div>
                      {rv.comment ? (
                        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700">“{rv.comment}”</p>
                      ) : (
                        <p className="mt-3 text-sm italic text-gray-400">Tanpa komentar.</p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {data.reviews.last_page > 1 && (
            <div className="mt-5 flex items-center justify-end gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg bg-white p-2 ring-1 ring-sand-200 disabled:opacity-40" aria-label="Sebelumnya">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-500">
                {page} / {data.reviews.last_page}
              </span>
              <button disabled={page >= data.reviews.last_page} onClick={() => setPage((p) => p + 1)} className="rounded-lg bg-white p-2 ring-1 ring-sand-200 disabled:opacity-40" aria-label="Berikutnya">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
