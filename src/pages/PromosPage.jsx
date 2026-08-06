import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Tag, Sparkles } from 'lucide-react'
import api from '../lib/api'
import PromoCard from '../components/PromoCard'
import { Spinner, EmptyState, Button } from '../components/ui'

export default function PromosPage() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/promos')
      .then((res) => setPromos(res.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 md:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" /> Penawaran Spesial
          </span>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">Promo &amp; Diskon</h1>
          <p className="mt-2 max-w-xl text-white/80">
            Kumpulan kode promo aktif untuk staycation impianmu. Salin kode &amp; pakai saat checkout.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8 text-brand-600" />
          </div>
        ) : promos.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="Belum ada promo aktif"
            subtitle="Nantikan penawaran menarik dari kami!"
            action={
              <Button as={Link} to="/villas">
                Jelajahi Villa
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {promos.map((p) => (
              <PromoCard key={p.id} promo={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
