import { useEffect, useState } from 'react'
import { Coins, TrendingUp, TrendingDown, Clock, Save, Settings2, Users, Search, UserCog, Crown, Plus, Minus } from 'lucide-react'
import api from '../../lib/api'
import { formatDate, rupiah } from '../../lib/format'
import { PageLoader, Button, Badge, EmptyState, Input } from '../../components/ui'

const TIER_META = {
  bronze: { label: 'Bronze', ring: 'ring-amber-700/30' },
  silver: { label: 'Silver', ring: 'ring-gray-400/40' },
  gold: { label: 'Gold', ring: 'ring-yellow-500/40' },
  platinum: { label: 'Platinum', ring: 'ring-slate-400/40' },
}

const TYPE_LABELS = {
  earn: { label: 'Diperoleh', className: 'bg-emerald-100 text-emerald-700' },
  spend: { label: 'Dibelanjakan', className: 'bg-blue-100 text-blue-700' },
  expire: { label: 'Kadaluarsa', className: 'bg-gray-200 text-gray-600' },
  adjust: { label: 'Penyesuaian', className: 'bg-amber-100 text-amber-700' },
}

export default function AdminLoyalty() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [transactions, setTransactions] = useState([])

  // Pengaturan tier
  const [tiers, setTiers] = useState([])
  const [rupiahPerPoint, setRupiahPerPoint] = useState(10000)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Kelola poin & tier per pelanggan
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [sel, setSel] = useState(null)
  const [pForm, setPForm] = useState({ points: '', direction: 'add', description: '' })
  const [tierVal, setTierVal] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg2, setMsg2] = useState('')

  const fmt = (n) => Number(n ?? 0).toLocaleString('id-ID')

  const searchUsers = async (term) => {
    if (!term.trim()) return setResults([])
    try {
      const res = await api.get('/admin/users', { params: { role: 'user', search: term, per_page: 8 } })
      setResults(res.data.data || [])
    } catch {
      setResults([])
    }
  }

  const refreshSel = async (id) => {
    const res = await api.get(`/admin/loyalty/user/${id}`)
    setSel(res.data)
    setTierVal(res.data.tier_override || '')
  }

  const pickUser = async (u) => {
    setResults([])
    setQ('')
    setMsg2('')
    setPForm({ points: '', direction: 'add', description: '' })
    try {
      await refreshSel(u.id)
    } catch {
      setMsg2('Gagal memuat data pelanggan.')
    }
  }

  const submitPoints = async (e) => {
    e.preventDefault()
    if (!sel || !pForm.points) return
    setBusy(true)
    setMsg2('')
    try {
      const res = await api.post(`/admin/loyalty/adjust/${sel.id}`, {
        points: Math.abs(Number(pForm.points)),
        direction: pForm.direction,
        description: pForm.description || (pForm.direction === 'add' ? 'Penambahan poin manual oleh admin' : 'Pengurangan poin manual oleh admin'),
      })
      setMsg2(res.data.message)
      setPForm({ points: '', direction: 'add', description: '' })
      await refreshSel(sel.id)
      load()
    } catch (err) {
      setMsg2(err.response?.data?.message || 'Gagal menyimpan poin.')
    } finally {
      setBusy(false)
    }
  }

  const submitTier = async () => {
    if (!sel) return
    setBusy(true)
    setMsg2('')
    try {
      const res = await api.post(`/admin/loyalty/tier/${sel.id}`, { tier: tierVal || null })
      setMsg2(res.data.message)
      await refreshSel(sel.id)
    } catch (err) {
      setMsg2(err.response?.data?.message || 'Gagal mengubah tier.')
    } finally {
      setBusy(false)
    }
  }

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/admin/loyalty/tiers').then((r) => {
        setTiers(r.data.tiers || [])
        setRupiahPerPoint(r.data.rupiah_per_point || 10000)
      }),
      api.get('/admin/loyalty/stats').then((r) => setStats(r.data)).catch(() => setStats(null)),
      api.get('/admin/loyalty', { params: { per_page: 20 } }).then((r) => setTransactions(r.data.data || [])).catch(() => setTransactions([])),
    ]).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const setTierField = (idx, field, value) => {
    setTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)))
  }

  const setBenefits = (idx, text) => {
    setTierField(idx, 'benefits', text.split('\n').map((s) => s.trim()).filter(Boolean))
  }

  const save = async () => {
    setSaving(true)
    setMessage('')
    try {
      // max_points otomatis: min tier berikutnya - 1 (tier terakhir tak terbatas)
      const sorted = [...tiers].sort((a, b) => Number(a.min_points) - Number(b.min_points))
      const payload = sorted.map((t, i) => ({
        ...t,
        min_points: Number(t.min_points) || 0,
        multiplier: Number(t.multiplier) || 1,
        max_points: i < sorted.length - 1 ? Number(sorted[i + 1].min_points) - 1 : null,
        benefits: t.benefits || [],
      }))
      const res = await api.put('/admin/loyalty/tiers', {
        rupiah_per_point: Number(rupiahPerPoint) || 10000,
        tiers: payload,
      })
      setTiers(res.data.tiers)
      setRupiahPerPoint(res.data.rupiah_per_point)
      setMessage('Pengaturan tier berhasil disimpan.')
      setTimeout(() => setMessage(''), 3000)
    } catch (e) {
      setMessage(e.response?.data?.message || 'Gagal menyimpan. Periksa kembali isian.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  const statCards = stats
    ? [
        { label: 'Total Diperoleh', value: stats.total_earned, icon: TrendingUp, cls: 'bg-emerald-50 text-emerald-600' },
        { label: 'Total Dibelanjakan', value: stats.total_spent, icon: TrendingDown, cls: 'bg-blue-50 text-blue-600' },
        { label: 'Saldo Aktif', value: stats.active_balance, icon: Coins, cls: 'bg-amber-50 text-amber-600' },
        { label: 'Kadaluarsa', value: stats.total_expired, icon: Clock, cls: 'bg-gray-100 text-gray-500' },
      ]
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Loyalitas</h1>
        <p className="mt-1 text-sm text-gray-500">Kelola tier, poin, dan pantau transaksi loyalitas pelanggan.</p>
      </div>

      {/* Statistik */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {statCards.map((c) => (
            <div key={c.label} className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${c.cls}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div className="text-xl font-bold text-gray-900 sm:text-2xl">{Number(c.value || 0).toLocaleString('id-ID')}</div>
              <div className="text-xs text-gray-500 sm:text-sm">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Kelola Poin & Tier per Pelanggan */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
        <div className="mb-1 flex items-center gap-2">
          <UserCog className="h-5 w-5 text-brand-600" />
          <h2 className="font-bold text-gray-900">Kelola Poin &amp; Tier Pelanggan</h2>
        </div>
        <p className="mb-4 text-sm text-gray-500">Input poin manual dan tetapkan tier pelanggan secara langsung.</p>

        {/* Cari pelanggan */}
        <div className="relative max-w-md">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                searchUsers(e.target.value)
              }}
              placeholder="Cari pelanggan (nama / email)…"
              className="w-full bg-transparent py-2.5 text-sm outline-none"
            />
          </div>
          {results.length > 0 && (
            <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
              {results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => pickUser(u)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-gray-50"
                >
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                      {u.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-900">{u.name}</div>
                    <div className="truncate text-xs text-gray-400">{u.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {msg2 && (
          <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${msg2.toLowerCase().includes('gagal') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {msg2}
          </div>
        )}

        {sel && (
          <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
            {/* Ringkasan pelanggan */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                {sel.avatar_url ? (
                  <img src={sel.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                    {sel.name?.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900">{sel.name}</div>
                  <div className="truncate text-xs text-gray-400">{sel.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wide text-gray-400">Saldo</div>
                  <div className="font-bold text-brand-700">{fmt(sel.balance)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wide text-gray-400">Seumur hidup</div>
                  <div className="font-bold text-gray-800">{fmt(sel.lifetime_points)}</div>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${sel.current_tier?.gradient_from || sel.current_tier?.color}, ${sel.current_tier?.gradient_to || sel.current_tier?.color})` }}
                >
                  {sel.current_tier?.name}
                  {sel.is_override ? ' · manual' : ''}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {/* Input poin manual */}
              <form onSubmit={submitPoints} className="rounded-xl border border-gray-100 bg-white p-4">
                <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-900">
                  <Coins className="h-4 w-4 text-brand-600" /> Input Poin Manual
                </h3>
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPForm((f) => ({ ...f, direction: 'add' }))}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-semibold transition ${pForm.direction === 'add' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    <Plus className="h-4 w-4" /> Tambah
                  </button>
                  <button
                    type="button"
                    onClick={() => setPForm((f) => ({ ...f, direction: 'subtract' }))}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-semibold transition ${pForm.direction === 'subtract' ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    <Minus className="h-4 w-4" /> Kurangi
                  </button>
                </div>
                <div className="space-y-3">
                  <Input
                    label="Jumlah poin"
                    type="number"
                    min="1"
                    required
                    value={pForm.points}
                    onChange={(e) => setPForm((f) => ({ ...f, points: e.target.value }))}
                    placeholder="cth: 500"
                  />
                  <Input
                    label="Keterangan (opsional)"
                    value={pForm.description}
                    onChange={(e) => setPForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="cth: Bonus event / koreksi"
                  />
                </div>
                <Button type="submit" loading={busy} className="mt-3 w-full">
                  Simpan Poin
                </Button>
              </form>

              {/* Ubah tier manual */}
              <div className="rounded-xl border border-gray-100 bg-white p-4">
                <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-900">
                  <Crown className="h-4 w-4 text-brand-600" /> Ubah Tier Manual
                </h3>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Tier pelanggan</span>
                  <select
                    value={tierVal}
                    onChange={(e) => setTierVal(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                  >
                    <option value="">Otomatis (mengikuti poin)</option>
                    {tiers.map((t) => (
                      <option key={t.slug} value={t.slug}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="mt-1.5 text-xs text-gray-400">
                  Pilih <span className="font-medium">Otomatis</span> agar tier kembali dihitung dari poin pelanggan.
                </p>
                <Button onClick={submitTier} loading={busy} variant="outline" className="mt-3 w-full">
                  Terapkan Tier
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pengaturan Tier */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-brand-600" />
          <h2 className="font-bold text-gray-900">Pengaturan Tier</h2>
        </div>

        {message && (
          <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${message.includes('Gagal') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {message}
          </div>
        )}

        <div className="mb-5 max-w-xs">
          <Input
            label="Rupiah untuk 1 poin"
            type="number"
            min="1"
            value={rupiahPerPoint}
            onChange={(e) => setRupiahPerPoint(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-400">
            Contoh: {rupiah(Number(rupiahPerPoint) || 0)} belanja = 1 poin (sebelum bonus tier).
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {tiers.map((t, idx) => (
            <div key={t.slug} className={`rounded-2xl border border-gray-100 bg-gray-50/50 p-4 ring-1 ${TIER_META[t.slug]?.ring || 'ring-gray-200'}`}>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full border border-white shadow" style={{ background: `linear-gradient(135deg, ${t.gradient_from || t.color}, ${t.gradient_to || t.color})` }} />
                <span className="text-xs font-bold uppercase tracking-wide text-gray-400">{t.slug}</span>
                <span className="ml-auto rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">×{Number(t.multiplier).toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Nama" value={t.name} onChange={(e) => setTierField(idx, 'name', e.target.value)} />
                <Input label="Multiplier poin" type="number" step="0.05" min="1" value={t.multiplier} onChange={(e) => setTierField(idx, 'multiplier', e.target.value)} />
                <Input label="Poin minimum" type="number" min="0" value={t.min_points} onChange={(e) => setTierField(idx, 'min_points', e.target.value)} />
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Warna</span>
                  <div className="flex items-center gap-2">
                    <input type="color" value={t.color || '#cccccc'} onChange={(e) => setTierField(idx, 'color', e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-gray-300" />
                    <input type="text" value={t.color || ''} onChange={(e) => setTierField(idx, 'color', e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
                  </div>
                </label>
              </div>

              <label className="mt-3 block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Benefit (satu per baris)</span>
                <textarea
                  rows={4}
                  value={(t.benefits || []).join('\n')}
                  onChange={(e) => setBenefits(idx, e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={save} loading={saving}>
            <Save className="h-4 w-4" /> Simpan Pengaturan Tier
          </Button>
        </div>
      </div>

      {/* Top pengguna */}
      {stats?.top_users?.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-600" />
            <h2 className="font-bold text-gray-900">Pelanggan Poin Terbanyak</h2>
          </div>
          <div className="space-y-2">
            {stats.top_users.map((u, i) => (
              <div key={u.id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900">{u.name}</div>
                  <div className="truncate text-xs text-gray-400">{u.email}</div>
                </div>
                <span className="text-sm font-bold text-brand-700">{Number(u.total_earned || 0).toLocaleString('id-ID')} poin</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaksi terbaru */}
      <div>
        <h2 className="mb-3 font-bold text-gray-900">Transaksi Poin Terbaru</h2>
        {transactions.length === 0 ? (
          <EmptyState icon={Coins} title="Belum ada transaksi poin" subtitle="Poin akan tercatat otomatis saat pesanan pelanggan dikonfirmasi." />
        ) : (
          <div className="space-y-2.5">
            {transactions.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4">
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${TYPE_LABELS[item.type]?.className || 'bg-gray-100'}`}>
                  {item.type === 'spend' ? <TrendingDown className="h-4 w-4" /> : item.type === 'expire' ? <Clock className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900">{item.user?.name || 'Pengguna'}</div>
                  <div className="truncate text-xs text-gray-400">
                    {item.description || 'Transaksi poin'} · {formatDate(item.created_at)}
                    {item.booking?.booking_code ? ` · ${item.booking.booking_code}` : ''}
                  </div>
                </div>
                <div className="text-right">
                  {(() => {
                    const neg = item.points < 0 || item.type === 'spend' || item.type === 'expire'
                    return (
                      <div className={`text-sm font-bold ${neg ? 'text-gray-500' : 'text-emerald-600'}`}>
                        {neg ? '-' : '+'}{Math.abs(item.points)}
                      </div>
                    )
                  })()}
                  <Badge className={TYPE_LABELS[item.type]?.className}>{TYPE_LABELS[item.type]?.label}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
