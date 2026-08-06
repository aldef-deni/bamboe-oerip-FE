import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, Leaf, ShieldCheck, Wallet, Heart, Clock, MapPin, Building2,
  Users, Star, Target, Compass, ArrowRight, Phone, Mail, CheckCircle2,
} from 'lucide-react'
import api from '../lib/api'
import { useSettings } from '../context/SettingsContext'

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-gold-200">
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-serif text-2xl font-bold text-white md:text-3xl">{value}</div>
      <div className="mt-0.5 text-xs text-white/70 md:text-sm">{label}</div>
    </div>
  )
}

const VALUES = [
  { icon: Leaf, title: 'Autentik & Alami', desc: 'Setiap unit menghadirkan sentuhan alami khas bambu dan kehangatan budaya lokal Nusantara.' },
  { icon: ShieldCheck, title: 'Aman & Terverifikasi', desc: 'Setiap pembayaran diverifikasi langsung oleh tim kami untuk kenyamanan dan keamanan Anda.' },
  { icon: Wallet, title: 'Harga Transparan', desc: 'Tanpa biaya tersembunyi. Total pembayaran jelas terlihat sebelum Anda melakukan pemesanan.' },
  { icon: Heart, title: 'Nyaman & Privat', desc: 'Ruang istirahat yang tenang, bersih, dan privat untuk pengalaman menginap yang berkesan.' },
  { icon: Clock, title: 'Mudah & Cepat', desc: 'Proses pemesanan sederhana dengan konfirmasi cepat, kapan pun Anda membutuhkannya.' },
  { icon: Sparkles, title: 'Terkurasi', desc: 'Villa, homestay, dan properti pilihan yang dikurasi untuk standar kenyamanan terbaik.' },
]

export default function About() {
  const settings = useSettings()
  const brand = settings.site_name || 'Bamboe Oerip'
  const [stats, setStats] = useState({ villas: null, cities: null })

  useEffect(() => {
    Promise.all([api.get('/villas', { params: { per_page: 1 } }), api.get('/villas/cities')])
      .then(([v, c]) => setStats({ villas: v.data.total ?? null, cities: (c.data || []).length || null }))
      .catch(() => {})
  }, [])

  return (
    <div className="bg-white">
      {/* ===== Hero ===== */}
      <section className="relative text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/banner-home.webp')" }} />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/92 via-brand-900/80 to-brand-800/60" />
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gold-400/15 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center md:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-gold-200 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Tentang Kami
          </span>
          <h1 className="mt-5 font-serif text-4xl font-bold leading-tight drop-shadow-sm md:text-5xl lg:text-6xl">
            Tentang{' '}
            <span className="bg-gradient-to-r from-gold-200 via-gold-400 to-gold-300 bg-clip-text text-transparent">
              {brand}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 drop-shadow md:text-lg">
            {settings.site_tagline ||
              'Menghadirkan pengalaman menginap istimewa di villa, homestay, dan properti pilihan dengan sentuhan alami khas bambu.'}
          </p>
        </div>

        {/* Stats band */}
        <div className="relative border-t border-white/10 bg-black/10 backdrop-blur-sm">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4">
            <Stat icon={Building2} value={stats.villas ? `${stats.villas}+` : 'Puluhan'} label="Unit Terkurasi" />
            <Stat icon={MapPin} value={stats.cities ? `${stats.cities}+` : 'Banyak'} label="Kota di Indonesia" />
            <Stat icon={Users} value="Ribuan" label="Tamu Menginap" />
            <Stat icon={Star} value="24/7" label="Dukungan Ramah" />
          </div>
        </div>
      </section>

      {/* ===== Cerita Kami ===== */}
      <section className="mx-auto max-w-5xl px-4 py-16 md:py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-bold text-gray-900 md:text-4xl">Cerita Kami</h2>
            <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-gold-400 to-brand-500" />
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-gray-600">
              <p>
                <span className="font-semibold text-brand-700">{brand}</span> lahir dari kecintaan pada keindahan alam
                Nusantara dan kehangatan budaya lokal. Kami percaya bahwa setiap perjalanan layak diakhiri dengan tempat
                istirahat yang nyaman, tenang, dan berkesan.
              </p>
              <p>
                Berawal dari sebuah homestay bernuansa bambu, kami tumbuh menjadi platform pemesanan yang menghubungkan
                Anda dengan villa, cabin, dan properti pilihan di berbagai destinasi — mulai dari pegunungan yang sejuk
                hingga pesisir yang menawan.
              </p>
              <p>
                Dengan proses pemesanan yang mudah, harga yang transparan, serta pelayanan yang ramah dan tepercaya, kami
                berkomitmen menghadirkan pengalaman staycation terbaik bagi Anda dan keluarga.
              </p>
            </div>
          </div>

          <div className="relative">
            <img
              src="/tentang-kami.webp"
              alt="Tentang Bamboe Oerip"
              className="block w-full rounded-3xl shadow-xl"
            />
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl bg-white p-4 shadow-lg ring-1 ring-gray-100 sm:block">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-gold-200">
                  <Leaf className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Sentuhan Alami</div>
                  <div className="text-xs text-gray-500">Nuansa bambu di setiap unit</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Visi & Misi ===== */}
      <section className="border-y border-gray-100 bg-gradient-to-br from-brand-50/70 to-gold-50/40">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-16 md:grid-cols-2 md:py-20">
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-gold-200 shadow-md">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-gray-900">Visi</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
              Menjadi platform pilihan utama untuk menemukan penginapan bernuansa alami dan autentik di seluruh
              Indonesia — yang mengedepankan kenyamanan, kepercayaan, dan kelestarian.
            </p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-md">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-gray-900">Misi</h3>
            <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-gray-600">
              {[
                'Menghadirkan pilihan penginapan terkurasi dengan standar kenyamanan terbaik.',
                'Memberikan proses pemesanan yang mudah, cepat, dan transparan.',
                'Menjaga kepercayaan melalui pelayanan yang ramah dan tepercaya.',
              ].map((m) => (
                <li key={m} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600" /> {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ===== Nilai Kami ===== */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-3xl font-bold text-gray-900 md:text-4xl">Nilai yang Kami Junjung</h2>
          <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-gold-400 to-brand-500" />
          <p className="mx-auto mt-3 max-w-xl text-gray-500">
            Prinsip yang menjadi landasan kami dalam melayani setiap tamu.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="group rounded-2xl border border-gray-100 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-gradient-to-br group-hover:from-brand-600 group-hover:to-brand-800 group-hover:text-gold-200">
                <v.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{v.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg, #1e5c3c 0%, #257449 55%, #143a26 100%)' }} />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold-400/15 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center text-white md:py-20">
          <h2 className="font-serif text-3xl font-bold md:text-4xl">Siap memulai staycation Anda?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Temukan villa &amp; penginapan terbaik bersama {brand}. Booking mudah, harga transparan, konfirmasi cepat.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/villas"
              className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 text-sm font-semibold text-brand-900 shadow-lg transition hover:bg-gold-300"
            >
              Jelajahi Villa <ArrowRight className="h-4 w-4" />
            </Link>
            {(settings.contact_phone || settings.contact_email) && (
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/85">
                {settings.contact_phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-gold-200" /> {settings.contact_phone}
                  </span>
                )}
                {settings.contact_email && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-gold-200" /> {settings.contact_email}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
