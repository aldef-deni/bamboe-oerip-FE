import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, X, Check, Copy, Search, Calendar, Wallet } from 'lucide-react'
import { rupiah, formatDate } from '../lib/format'

export function promoValueLabel(p) {
  return p.type === 'percentage' ? `Diskon ${Number(p.value)}%` : `Potongan ${rupiah(p.value)}`
}

export default function PromoCard({ promo }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  const copy = () => {
    navigator.clipboard.writeText(promo.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const goSearch = () => {
    setOpen(false)
    navigate('/villas')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm ring-1 ring-transparent transition hover:-translate-y-1 hover:shadow-lg hover:ring-gold-300"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800">
          {promo.image_url ? (
            <img
              src={promo.image_url}
              alt={promo.code}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-gold-200">
              <Tag className="h-9 w-9" />
              <span className="mt-1.5 text-lg font-bold">{promoValueLabel(promo)}</span>
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-700 shadow">
            {promoValueLabel(promo)}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <span className="inline-flex w-max items-center gap-1.5 rounded-lg border border-dashed border-gold-400 bg-gold-50 px-2.5 py-1 font-mono text-sm font-bold tracking-wide text-gold-700">
            <Tag className="h-3.5 w-3.5" /> {promo.code}
          </span>
          {promo.description && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{promo.description}</p>}
          <span className="mt-auto pt-3 text-xs font-medium text-brand-700 group-hover:underline">Lihat detail →</span>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div
            className="relative max-h-[90vh] w-full max-w-md overflow-auto rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-1.5 text-gray-600 backdrop-blur hover:bg-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="aspect-[16/10] bg-gradient-to-br from-brand-600 to-brand-800">
              {promo.image_url ? (
                <img src={promo.image_url} alt={promo.code} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-gold-200">
                  <Tag className="h-10 w-10" />
                  <span className="mt-2 text-2xl font-bold">{promoValueLabel(promo)}</span>
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-gold-600">Promo Spesial</div>
              <h3 className="mt-1 font-serif text-2xl font-bold text-gray-900">{promoValueLabel(promo)}</h3>
              {promo.description && (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">{promo.description}</p>
              )}

              <div className="mt-4 flex items-center gap-2">
                <span className="flex-1 rounded-xl border-2 border-dashed border-gold-400 bg-gold-50 px-4 py-2.5 text-center font-mono text-lg font-bold tracking-wider text-gold-700">
                  {promo.code}
                </span>
                <button
                  onClick={copy}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Tersalin' : 'Salin'}
                </button>
              </div>

              <div className="mt-4 space-y-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                {promo.min_spend && Number(promo.min_spend) > 0 && (
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-brand-600" /> Min. transaksi {rupiah(promo.min_spend)}
                  </div>
                )}
                {promo.max_discount && Number(promo.max_discount) > 0 && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-brand-600" /> Potongan maksimal {rupiah(promo.max_discount)}
                  </div>
                )}
                {promo.expires_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-brand-600" /> Berlaku hingga {formatDate(promo.expires_at)}
                  </div>
                )}
                {!promo.min_spend && !promo.expires_at && (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-brand-600" /> Tanpa minimal transaksi
                  </div>
                )}
              </div>

              <button
                onClick={goSearch}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
              >
                <Search className="h-4 w-4" /> Cari Villa &amp; Pakai Promo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
