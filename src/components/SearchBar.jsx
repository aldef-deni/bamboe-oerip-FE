import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { Search, MapPin, Calendar, Users } from 'lucide-react'
import DestinationSearch from './DestinationSearch'
import DateRangePicker from './DateRangePicker'

const todayISO = format(new Date(), 'yyyy-MM-dd')
const tomorrowISO = format(addDays(new Date(), 1), 'yyyy-MM-dd')

export default function SearchBar({ initial = {}, glass = false }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    search: initial.search || '',
    check_in: initial.check_in || todayISO,
    check_out: initial.check_out || tomorrowISO,
    guests: initial.guests || '',
  })

  const submit = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    Object.entries(form).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    navigate(`/villas?${params.toString()}`)
  }

  const labelCls = `mb-1 flex items-center gap-1 text-xs font-medium ${glass ? 'text-white/85' : 'text-gray-500'}`
  const formCls = glass
    ? 'grid gap-3 rounded-2xl border border-white/25 bg-white/10 p-4 shadow-2xl ring-1 ring-white/10 backdrop-blur-2xl md:grid-cols-[1.6fr_1.5fr_0.7fr_auto] md:items-end'
    : 'grid gap-3 rounded-2xl bg-white p-4 shadow-lg md:grid-cols-[1.6fr_1.5fr_0.7fr_auto] md:items-end'

  return (
    <form onSubmit={submit} className={formCls}>
      <label className="block">
        <span className={labelCls}>
          <MapPin className="h-3.5 w-3.5" /> Tujuan / Akomodasi
        </span>
        <DestinationSearch value={form.search} onChange={(v) => setForm({ ...form, search: v })} glass={glass} />
      </label>

      <label className="block">
        <span className={labelCls}>
          <Calendar className="h-3.5 w-3.5" /> Tanggal menginap
        </span>
        <DateRangePicker
          checkIn={form.check_in}
          checkOut={form.check_out}
          onChange={({ check_in, check_out }) => setForm({ ...form, check_in, check_out })}
          glass={glass}
        />
      </label>

      <label className="block">
        <span className={labelCls}>
          <Users className="h-3.5 w-3.5" /> Tamu
        </span>
        <input
          type="number"
          min="1"
          value={form.guests}
          onChange={(e) => setForm({ ...form, guests: e.target.value })}
          placeholder="2"
          className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${
            glass
              ? 'border-white/30 bg-white/15 text-white placeholder-white/60 focus:border-white/60 focus:bg-white/25'
              : 'border-gray-200 focus:border-brand-500'
          }`}
        />
      </label>

      <button
        type="submit"
        className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md transition ${
          glass
            ? 'bg-gradient-to-r from-gold-400 to-gold-500 text-brand-900 hover:from-gold-300 hover:to-gold-400'
            : 'bg-brand-600 text-white hover:bg-brand-700'
        }`}
      >
        <Search className="h-4 w-4" /> Cari
      </button>
    </form>
  )
}
