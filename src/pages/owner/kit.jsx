import { useEffect } from 'react'

/* =====================================================================
 * Kit tampilan Extranet Owner — hijau tua + emas, judul serif.
 * ===================================================================== */

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap'

/** Muat font premium (sekali) + set judul tab browser. */
export function useOwnerTheme(title) {
  useEffect(() => {
    if (!document.getElementById('owner-fonts')) {
      const pre = document.createElement('link')
      pre.rel = 'preconnect'
      pre.href = 'https://fonts.gstatic.com'
      pre.crossOrigin = ''
      document.head.appendChild(pre)
      const link = document.createElement('link')
      link.id = 'owner-fonts'
      link.rel = 'stylesheet'
      link.href = FONT_HREF
      document.head.appendChild(link)
      const icon = document.querySelector('link[rel="icon"]')
      if (icon) {
        icon.type = 'image/webp'
        icon.href = '/logo-sm.webp'
      }
    }
  }, [])

  useEffect(() => {
    document.title = title ? `${title} · Extranet Bamboe Oerip` : 'Extranet Owner · Bamboe Oerip'
  }, [title])
}

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600">
            <span className="h-px w-6 bg-gold-400" />
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-[1.65rem] font-semibold leading-tight text-brand-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, subtitle, action, children, className = '', bodyClass = 'p-5' }) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-sand-200/70 bg-white ${className}`}
      style={{ boxShadow: '0 1px 2px rgba(22,61,43,0.04), 0 12px 32px -18px rgba(22,61,43,0.18)' }}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-sand-100 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="font-display text-lg font-semibold text-brand-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  )
}

const TONES = {
  green: { ring: 'from-brand-500 to-brand-700', soft: 'bg-brand-50 text-brand-700' },
  gold: { ring: 'from-gold-300 to-gold-600', soft: 'bg-gold-50 text-gold-700' },
  sky: { ring: 'from-sky-400 to-sky-600', soft: 'bg-sky-50 text-sky-700' },
  rose: { ring: 'from-rose-400 to-rose-600', soft: 'bg-rose-50 text-rose-700' },
  violet: { ring: 'from-violet-400 to-violet-600', soft: 'bg-violet-50 text-violet-700' },
}

export function StatTile({ label, value, hint, icon: Icon, tone = 'green' }) {
  const t = TONES[tone] || TONES.green
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-sand-200/70 bg-white p-4 sm:p-5"
      style={{ boxShadow: '0 1px 2px rgba(22,61,43,0.04), 0 14px 30px -20px rgba(22,61,43,0.25)' }}
    >
      <span className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${t.ring}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</div>
          <div className="mt-2 truncate font-display text-2xl font-semibold text-brand-900 sm:text-[1.7rem]">{value}</div>
          {hint && <div className="mt-1 truncate text-xs text-gray-500">{hint}</div>}
        </div>
        {Icon && (
          <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${t.soft}`}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  )
}

/** Status tayang properti untuk owner. */
export function propertyStatus(v) {
  if (v.review_status === 'pending') return { label: 'Menunggu Tinjauan', cls: 'bg-amber-50 text-amber-700 ring-amber-200' }
  if (v.review_status === 'rejected') return { label: 'Perlu Perbaikan', cls: 'bg-rose-50 text-rose-700 ring-rose-200' }
  if (v.is_active) return { label: 'Tayang', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' }
  return { label: 'Disembunyikan', cls: 'bg-gray-100 text-gray-600 ring-gray-200' }
}

export function PropertyStatusPill({ villa, className = '' }) {
  const s = propertyStatus(villa)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${s.cls} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  )
}

export const BOOKING_STATUS = {
  pending: { label: 'Menunggu Pembayaran', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  awaiting_verification: { label: 'Verifikasi Pembayaran', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  confirmed: { label: 'Terkonfirmasi', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  completed: { label: 'Selesai', cls: 'bg-brand-50 text-brand-700 ring-brand-200' },
  cancelled: { label: 'Dibatalkan', cls: 'bg-gray-100 text-gray-600 ring-gray-200' },
  rejected: { label: 'Ditolak', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
}

export function BookingStatusPill({ status }) {
  const s = BOOKING_STATUS[status] || { label: status, cls: 'bg-gray-100 text-gray-600 ring-gray-200' }
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${s.cls}`}>
      {s.label}
    </span>
  )
}

/**
 * Ubah nilai tanggal API ke [yyyy, mm, dd] sesuai zona waktu lokal.
 * Kolom date Laravel diserialisasi sebagai ISO UTC (mis. check-in 14/11 WIB
 * menjadi "2026-11-13T17:00:00Z"), jadi tidak boleh sekadar dipotong 10 karakter.
 */
export function ymdParts(value) {
  if (!value) return null
  const s = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.split('-')
  const d = new Date(s)
  if (isNaN(d)) return null
  return [String(d.getFullYear()), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')]
}

/** Tanggal DD/MM/YYYY (standar Bamboe Oerip). */
export function dmy(value) {
  const p = ymdParts(value)
  return p ? `${p[2]}/${p[1]}/${p[0]}` : '-'
}

/** "KABUPATEN GIANYAR" -> "Kabupaten Gianyar" (data wilayah berhuruf kapital). */
export function titleCase(s) {
  if (!s) return ''
  if (s !== s.toUpperCase()) return s
  return s.toLowerCase().replace(/(^|[\s-/(])\S/g, (c) => c.toUpperCase())
}

export function shortRupiah(n) {
  const v = Number(n || 0)
  if (v >= 1e9) return `Rp${(v / 1e9).toFixed(1).replace('.', ',')} M`
  if (v >= 1e6) return `Rp${(v / 1e6).toFixed(1).replace('.', ',')} jt`
  if (v >= 1e3) return `Rp${Math.round(v / 1e3)} rb`
  return `Rp${v}`
}

export const ID_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export function monthLabel(ym) {
  const [y, m] = (ym || '').split('-')
  return `${ID_MONTHS[Number(m) - 1] || m} '${(y || '').slice(2)}`
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 19) return 'Selamat sore'
  return 'Selamat malam'
}

/** Tombol bergaya premium (emas / hijau). */
export function GoldButton({ as: Comp = 'button', className = '', children, ...props }) {
  return (
    <Comp
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-300 to-gold-500 px-5 py-2.5 text-sm font-semibold text-brand-900 shadow-[0_8px_20px_-8px_rgba(194,154,43,0.8)] ring-1 ring-inset ring-gold-600/30 transition hover:from-gold-200 hover:to-gold-400 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </Comp>
  )
}
