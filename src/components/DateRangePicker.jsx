import { useEffect, useMemo, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { id as idLocale } from 'date-fns/locale'
import { format, parseISO, addDays } from 'date-fns'
import 'react-day-picker/style.css'
import { Calendar, X } from 'lucide-react'

const toISO = (d) => (d ? format(d, 'yyyy-MM-dd') : '')
const fromISO = (s) => {
  if (!s) return undefined
  try {
    const d = typeof s === 'string' ? parseISO(s) : s
    return isNaN(d) ? undefined : d
  } catch {
    return undefined
  }
}
const fmtShort = (d) => (d ? format(d, 'dd/MM/yyyy') : '')
const fmtLong = (d) => (d ? format(d, 'EEE, dd MMM yyyy', { locale: idLocale }) : '—')
const nightsOf = (a, b) => (a && b ? Math.max(0, Math.round((b - a) / 86400000)) : 0)

/**
 * Range date picker ala bobobox: 2 bulan (desktop), DD/MM/YYYY, footer check-in/out.
 * Jika hanya 1 tanggal dipilih -> check-out otomatis keesokan harinya.
 */
export default function DateRangePicker({
  checkIn,
  checkOut,
  onChange,
  minDate,
  placeholder = 'Pilih tanggal menginap',
  glass = false,
  showNights = true,
  autoFillEnd = true,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const from = fromISO(checkIn)
  const to = fromISO(checkOut)
  const selected = from ? { from, to } : undefined

  const min = useMemo(() => {
    if (minDate) return fromISO(minDate) || new Date()
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [minDate])

  // Tutup + isi otomatis check-out (H+1) bila hanya check-in yang dipilih
  const close = () => {
    if (autoFillEnd && from && !to) {
      onChange({ check_in: toISO(from), check_out: toISO(addDays(from, 1)) })
    }
    setOpen(false)
  }

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) close()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to])

  // Kontrol penuh: klik pertama = check-in (baru), klik kedua = check-out.
  const handleDayClick = (day, modifiers) => {
    if (modifiers?.disabled) return
    const noPartial = !from || (from && to) // belum ada, atau range sudah lengkap -> mulai baru
    if (noPartial) {
      onChange({ check_in: toISO(day), check_out: '' })
      return
    }
    // sudah ada check-in, belum check-out
    if (day.getTime() <= from.getTime()) {
      onChange({ check_in: toISO(day), check_out: '' }) // klik sebelum/sama -> jadi check-in baru
    } else {
      onChange({ check_in: toISO(from), check_out: toISO(day) })
      setOpen(false)
    }
  }

  const nights = nightsOf(from, to)
  const label = from
    ? to
      ? `${fmtShort(from)} — ${fmtShort(to)}${nights && showNights ? ` · ${nights} malam` : ''}`
      : `${fmtShort(from)} — …`
    : ''
  const months = typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1

  return (
    <div className="relative" ref={ref}>
      <div
        className={`flex w-full min-w-0 items-center gap-1 rounded-xl border px-3 py-2.5 text-sm ${
          glass
            ? 'border-white/30 bg-white/15 focus-within:border-white/60'
            : 'border-gray-200 focus-within:border-brand-500'
        }`}
      >
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none">
          <Calendar className={`h-4 w-4 flex-shrink-0 ${glass ? 'text-white/70' : 'text-gray-400'}`} />
          <span
            className={`min-w-0 truncate ${
              label ? (glass ? 'text-white' : 'text-gray-800') : glass ? 'text-white/70' : 'text-gray-400'
            }`}
          >
            {label || placeholder}
          </span>
        </button>
        {(from || to) && (
          <button
            type="button"
            onClick={() => {
              onChange({ check_in: '', check_out: '' })
              setOpen(false)
            }}
            className={`flex-shrink-0 rounded-full p-0.5 ${
              glass ? 'text-white/70 hover:bg-white/20 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-red-500'
            }`}
            title="Hapus tanggal"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-max max-w-[95vw] overflow-auto rounded-2xl border border-gray-100 bg-white p-3 text-gray-900 shadow-xl">
          <DayPicker
            mode="range"
            selected={selected}
            onDayClick={handleDayClick}
            numberOfMonths={months}
            disabled={{ before: min }}
            startMonth={min}
            locale={idLocale}
            style={{
              '--rdp-accent-color': '#257449',
              '--rdp-accent-background-color': '#dcf1e3',
              '--rdp-today-color': '#257449',
              color: '#1f2937',
            }}
          />

          {/* Info check-in / check-out */}
          <div className="mt-1 flex items-stretch gap-3 border-t border-gray-100 pt-3">
            <div className="flex-1 rounded-xl bg-gray-50 px-3 py-2">
              <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Check-in</div>
              <div className="text-sm font-semibold text-gray-800">{fmtLong(from)}</div>
            </div>
            <div className="flex-1 rounded-xl bg-gray-50 px-3 py-2 text-right">
              <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Check-out</div>
              <div className="text-sm font-semibold text-gray-800">{to ? fmtLong(to) : '—'}</div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => onChange({ check_in: '', check_out: '' })}
              className="text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={close}
              className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
