import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Sparkles, Wallet, ArrowRight, Tag } from 'lucide-react'
import api from '../lib/api'
import { useSettings } from '../context/SettingsContext'
import VillaCard from '../components/VillaCard'
import PromoCard from '../components/PromoCard'
import SearchBar from '../components/SearchBar'
import BranchMap from '../components/BranchMap'
import { Spinner } from '../components/ui'

function SectionHeader({ icon: Icon, title, to }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-gray-900 md:text-3xl">
          {Icon && <Icon className="h-6 w-6 text-gold-500" />} {title}
        </h2>
        <div className="mt-2 h-1 w-16 rounded-full bg-gradient-to-r from-gold-400 to-brand-500" />
      </div>
      {to && (
        <Link
          to={to}
          className="inline-flex flex-shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 transition-all hover:gap-2"
        >
          Lihat semua <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

export default function Home() {
  const settings = useSettings()
  const [villas, setVillas] = useState([])
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/villas', { params: { per_page: 6, sort: 'rating' } }),
      api.get('/promos'),
    ])
      .then(([v, p]) => {
        setVillas(v.data.data)
        setPromos(p.data)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white">
      {/* ===== Hero ===== */}
      <section className="relative text-white">
        {/* Banner background + overlay (di-clip; TERPISAH dari konten agar dropdown datepicker tidak terpotong) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/banner-home.webp')" }}
          />
          {/* overlay gelap-hijau agar teks & filter terbaca */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-900/92 via-brand-900/70 to-brand-800/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/75 via-transparent to-brand-900/25" />
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gold-400/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-gold-200 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> {settings.site_tagline || 'Sewa villa & staycation terbaik di Indonesia'}
          </span>
          <h1 className="mt-5 max-w-2xl font-serif text-4xl font-bold leading-[1.1] drop-shadow-sm md:text-5xl lg:text-6xl">
            Temukan villa &amp; staycation{' '}
            <span className="bg-gradient-to-r from-gold-200 via-gold-400 to-gold-300 bg-clip-text text-transparent">
              terbaik
            </span>{' '}
            di Indonesia
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/90 drop-shadow md:text-lg">
            Booking villa privat, cabin, dan pod unik dengan mudah. Harga transparan, konfirmasi cepat.
          </p>
          <div className="relative z-20 mt-8 max-w-4xl">
            <SearchBar glass />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
      </section>

      {/* ===== Promo ===== */}
      {promos.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <SectionHeader icon={Tag} title="Promo & Penawaran" to="/promo" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {promos.slice(0, 3).map((p) => (
              <PromoCard key={p.id} promo={p} />
            ))}
          </div>
        </section>
      )}

      {/* ===== Peta sebaran lokasi ===== */}
      <BranchMap />

      {/* ===== Villa pilihan ===== */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <SectionHeader title="Villa Pilihan" to="/villas" />
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8 text-brand-600" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {villas.map((v) => (
              <VillaCard key={v.id} villa={v} />
            ))}
          </div>
        )}
      </section>

      {/* ===== Kenapa kami ===== */}
      <section className="border-t border-gray-100 bg-gradient-to-br from-brand-50/60 to-gold-50/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl font-bold text-gray-900">Kenapa {settings.site_name || 'Bamboe Oerip'}?</h2>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-gold-400 to-brand-500" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Wallet, title: 'Harga transparan', desc: 'Tanpa biaya tersembunyi. Total pembayaran jelas sebelum booking.' },
              { icon: ShieldCheck, title: 'Aman & terverifikasi', desc: 'Setiap pembayaran diverifikasi langsung oleh tim kami.' },
              { icon: Sparkles, title: 'Villa terkurasi', desc: 'Pilihan villa, cabin, dan pod terbaik di berbagai destinasi.' },
            ].map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-gray-100 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-gold-200 shadow-md">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                <p className="mt-1.5 text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
