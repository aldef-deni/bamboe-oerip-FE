import { Loader2 } from 'lucide-react'

export function Spinner({ className = '' }) {
  return <Loader2 className={`animate-spin ${className}`} />
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-8 w-8 text-brand-600" />
    </div>
  )
}

export function Button({ as = 'button', variant = 'primary', className = '', loading, children, ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
    outline: 'border border-brand-600 text-brand-700 hover:bg-brand-50',
    subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
    ghost: 'text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    dark: 'bg-gray-900 text-white hover:bg-gray-800',
  }
  const Comp = as
  return (
    <Comp className={`${base} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </Comp>
  )
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>}
      <input
        className={`w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>}
      <textarea
        className={`w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

export function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}

/**
 * Pembungkus daftar data: kartu di mobile, tabel di layar md ke atas.
 * Pakai <MobileList> untuk kartu dan <DesktopTable> untuk tabelnya.
 */
export function MobileList({ children, className = '' }) {
  return <div className={`space-y-3 md:hidden ${className}`}>{children}</div>
}

export function DesktopTable({ children }) {
  return (
    <div className="hidden overflow-x-auto rounded-2xl border border-gray-100 bg-white md:block">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  )
}

/** Satu baris data dalam bentuk kartu (mobile). */
export function DataCard({ children, className = '', active = false, ...props }) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
        active ? 'border-brand-300 bg-brand-50/60 ring-1 ring-brand-200' : 'border-gray-100'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

/** Pasangan label–nilai di dalam DataCard. */
export function CardField({ label, value, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-[11px] uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="truncate text-sm font-medium text-gray-800">{value ?? '—'}</dd>
    </div>
  )
}

export function EmptyState({ title, subtitle, icon: Icon, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
      {Icon && <Icon className="mb-3 h-10 w-10 text-gray-300" />}
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      {subtitle && <p className="mt-1 max-w-sm text-sm text-gray-500">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
