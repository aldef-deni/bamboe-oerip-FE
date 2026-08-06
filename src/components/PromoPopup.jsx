import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { X, Tag, Check, Copy } from 'lucide-react'
import api from '../lib/api'
import { promoValueLabel } from './PromoCard'
import { formatDate } from '../lib/format'

export default function PromoPopup() {
  const [promo, setPromo] = useState(null)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Selalu tampilkan popup promo setiap kali halaman dimuat/refresh
    api
      .get('/promos/popup')
      .then((res) => {
        if (res.data && res.data.code) {
          setPromo(res.data)
          setOpen(true)
        }
      })
      .catch(() => {})
  }, [])

  if (!open || !promo) return null

  const copy = () => {
    navigator.clipboard.writeText(promo.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-1.5 text-gray-600 backdrop-blur hover:bg-white"
        >
          <X className="h-5 w-5" />
        </button>

        {promo.image_url ? (
          <img
            src={promo.image_url}
            alt={promo.code}
            className="block max-h-[60vh] w-full object-contain"
          />
        ) : (
          <div className="flex aspect-[16/10] w-full flex-col items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <Tag className="h-10 w-10" />
            <span className="mt-2 text-2xl font-bold">{promoValueLabel(promo)}</span>
          </div>
        )}

        <div className="p-6 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-brand-600">Promo Spesial</div>
          <div className="mt-1 text-xl font-bold text-gray-900">{promoValueLabel(promo)}</div>
          {promo.description && <p className="mt-1 text-sm text-gray-600">{promo.description}</p>}

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="rounded-lg border-2 border-dashed border-brand-400 bg-brand-50 px-4 py-2 font-mono text-lg font-bold tracking-wider text-brand-700">
              {promo.code}
            </span>
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Tersalin' : 'Salin'}
            </button>
          </div>

          {promo.expires_at && <p className="mt-3 text-xs text-gray-400">Berlaku s/d {formatDate(promo.expires_at)}</p>}
          <Link
            to="/promo"
            onClick={() => setOpen(false)}
            className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline"
          >
            Lihat semua promo →
          </Link>
        </div>
      </div>
    </div>
  )
}
