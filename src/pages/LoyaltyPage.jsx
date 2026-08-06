import { useEffect, useState } from 'react';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Clock,
  Crown,
  Medal,
  Award,
  Gem,
  Sparkles,
  Lock,
  Check,
} from 'lucide-react';
import api from '../lib/api';
import { formatDate } from '../lib/format';
import { PageLoader, EmptyState } from '../components/ui';

const TIER_ICONS = { medal: Medal, award: Award, crown: Crown, gem: Gem };
const TIER_BG = {
  bronze: '/loyalty/bronze.webp',
  silver: '/loyalty/silver.webp',
  gold: '/loyalty/gold.webp',
  platinum: '/loyalty/platinum.webp',
};

// Warna emas untuk teks & progress di kartu
const GOLD_TEXT = 'linear-gradient(180deg, #FCEBAE 0%, #EBC64B 46%, #C6902A 100%)';
const GOLD_BAR = 'linear-gradient(90deg, #C6902A 0%, #F3D778 55%, #FCEBAE 100%)';

const TYPE_META = {
  earn: { label: 'Diperoleh', icon: TrendingUp, ring: 'bg-emerald-50 text-emerald-600', sign: '+', amount: 'text-emerald-600' },
  spend: { label: 'Dibelanjakan', icon: TrendingDown, ring: 'bg-blue-50 text-blue-600', sign: '-', amount: 'text-blue-600' },
  expire: { label: 'Kadaluarsa', icon: Clock, ring: 'bg-gray-100 text-gray-500', sign: '-', amount: 'text-gray-400' },
  adjust: { label: 'Penyesuaian', icon: Sparkles, ring: 'bg-amber-50 text-amber-600', sign: '+', amount: 'text-amber-600' },
};

export default function LoyaltyPage() {
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/loyalty/balance').then((res) => setBalance(res.data)),
      api.get('/loyalty/history', { params: { per_page: 50 } }).then((res) => setHistory(res.data.data)),
      api.get('/loyalty/tiers').then((res) => setTiers(res.data.tiers || [])).catch(() => setTiers([])),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const currentTier = balance?.current_tier;
  const nextTier = balance?.next_tier;
  const lifetime = balance?.lifetime_points ?? 0;
  const slug = currentTier?.slug ?? 'bronze';
  const CurrentIcon = TIER_ICONS[currentTier?.icon] || Crown;
  const fmt = (n) => Number(n ?? 0).toLocaleString('id-ID');

  return (
    <div className="space-y-6">
      {/* ===== Kartu Poin (gaya kartu kredit) ===== */}
      <div className="relative min-h-[230px] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-amber-500/20 sm:aspect-[1831/859] sm:min-h-0">
        <img src={TIER_BG[slug] || TIER_BG.bronze} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {/* scrim gelap (kiri + bawah) agar teks terbaca di semua warna tier */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(100deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.6) 34%, rgba(0,0,0,0.15) 58%, rgba(0,0,0,0) 80%)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 26%, rgba(0,0,0,0) 52%)' }}
        />

        <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6 lg:p-8">
          {/* atas: badge tier + ikon tier */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 rounded-full border border-amber-300/50 bg-black/40 px-3.5 py-1.5 backdrop-blur-sm">
              <CurrentIcon className="h-4 w-4 text-amber-300" />
              <span className="text-sm font-semibold tracking-wide text-amber-100">{currentTier?.name ?? 'Member'}</span>
            </div>
            <CurrentIcon
              className="h-9 w-9 text-amber-300 sm:h-11 sm:w-11"
              style={{ filter: 'drop-shadow(0 0 14px rgba(240,195,60,0.65))' }}
            />
          </div>

          {/* tengah: poin tersedia */}
          <div className="py-2">
            <div
              className="text-[2.75rem] font-black leading-none tabular-nums sm:text-5xl lg:text-6xl"
              style={{ background: GOLD_TEXT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
            >
              {fmt(balance?.balance)}
            </div>
            <div className="mt-1.5 text-sm text-amber-100/70 sm:text-base">Poin tersedia</div>
          </div>

          {/* bawah: progress ke tier berikutnya */}
          <div>
            {nextTier ? (
              <>
                <div className="h-px w-full bg-gradient-to-r from-amber-300/5 via-amber-300/40 to-amber-300/5" />
                <div className="mt-3 flex items-center justify-between text-xs text-amber-100/80 sm:text-sm">
                  <span>Total poin seumur hidup: {fmt(lifetime)}</span>
                  <span className="font-semibold text-amber-200">{fmt(nextTier.min_points)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${balance?.progress_percent ?? 0}%`, background: GOLD_BAR, boxShadow: '0 0 10px rgba(243,215,120,0.5)' }}
                  />
                </div>
                <div className="mt-2 text-xs text-amber-100/70 sm:text-sm">
                  <span className="font-semibold text-amber-200">{fmt(balance?.points_to_next_tier)} poin</span> lagi untuk naik ke {nextTier.name}
                </div>
              </>
            ) : (
              <>
                <div className="h-px w-full bg-gradient-to-r from-amber-300/5 via-amber-300/40 to-amber-300/5" />
                <div className="mt-3 flex items-center gap-2 text-sm text-amber-100/85">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  Total {fmt(lifetime)} poin · Tier tertinggi tercapai. Terima kasih atas loyalitas Anda!
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ===== Statistik (glossy & timbul) ===== */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile icon={TrendingUp} tone="bg-emerald-100 text-emerald-600" label="Diperoleh" value={balance?.total_earned} sign="+" />
        <StatTile icon={TrendingDown} tone="bg-blue-100 text-blue-600" label="Dibelanjakan" value={balance?.total_spent} sign="-" />
        <StatTile icon={Coins} tone="bg-amber-100 text-amber-600" label="Seumur hidup" value={lifetime} />
      </div>

      {/* ===== Ketentuan poin per tier (elegan) ===== */}
      {tiers.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900">Tingkatan &amp; Keuntungan</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {tiers.map((t) => {
              const unlocked = lifetime >= (t.min_points ?? 0);
              const active = currentTier?.slug === t.slug;
              return <TierCard key={t.slug} tier={t} active={active} unlocked={unlocked} fmt={fmt} />;
            })}
          </div>
        </div>
      )}

      {/* ===== Riwayat ===== */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-gray-900">Riwayat Poin</h2>
        {history.length === 0 ? (
          <EmptyState icon={Coins} title="Belum ada riwayat poin" subtitle="Poin akan diberikan otomatis setelah pesanan Anda dikonfirmasi." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {history.map((item, idx) => {
              const meta = TYPE_META[item.type] || TYPE_META.adjust;
              const Icon = meta.icon;
              return (
                <div key={item.id} className={`flex items-center gap-4 p-4 ${idx > 0 ? 'border-t border-gray-50' : ''}`}>
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${meta.ring}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="truncate font-medium text-gray-900">{item.description || 'Transaksi poin'}</span>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {formatDate(item.created_at)}
                      {item.booking?.booking_code && ` · ${item.booking.booking_code}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${meta.amount}`}>{meta.sign}{fmt(item.points)}</div>
                    <div className="text-[11px] text-gray-400">Saldo {fmt(item.balance_after)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// hex -> rgba dengan alpha
function hexA(hex, a) {
  const h = (hex || '#cccccc').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// Kartu tier elegan: medali gradient, tint warna halus, aksen terbaca, timbul
function TierCard({ tier: t, active, unlocked, fmt }) {
  const Icon = TIER_ICONS[t.icon] || Medal;
  const from = t.gradient_from || t.color;
  const to = t.gradient_to || t.color;
  const accent = to; // warna gelap tier → kontras baik untuk teks/aksen (silver/platinum aman)

  return (
    <div
      className="group relative overflow-hidden rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: active
          ? `linear-gradient(160deg, ${hexA(accent, 0.16)} 0%, #ffffff 58%)`
          : `linear-gradient(160deg, ${hexA(accent, 0.07)} 0%, #ffffff 62%)`,
        border: `1px solid ${active ? hexA(accent, 0.55) : 'rgba(0,0,0,0.06)'}`,
        boxShadow: active
          ? `0 22px 48px -20px ${hexA(accent, 0.6)}, inset 0 1px 0 rgba(255,255,255,0.85)`
          : '0 14px 32px -18px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.85)',
      }}
    >
      {/* cahaya lembut warna tier di pojok */}
      <span
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-60 blur-2xl"
        style={{ background: hexA(accent, active ? 0.35 : 0.18) }}
      />

      <div className="relative flex items-start gap-4">
        {/* medali */}
        <span
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-white ring-2 ring-white"
          style={{ background: `linear-gradient(140deg, ${from}, ${to})`, boxShadow: `0 10px 22px -8px ${hexA(accent, 0.75)}` }}
        >
          <Icon style={{ width: 24, height: 24 }} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-gray-900">{t.name}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: hexA(accent, 0.14), color: accent }}
            >
              ×{Number(t.multiplier).toFixed(2)}
            </span>
          </div>
          <div className="mt-0.5 text-xs font-medium text-gray-400">≥ {fmt(t.min_points)} poin</div>
        </div>

        {/* status */}
        {active ? (
          <span className="rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">Tier Anda</span>
        ) : unlocked ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: hexA(accent, 0.12) }}>
            <Check className="h-4 w-4" style={{ color: accent }} />
          </span>
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <Lock className="h-3.5 w-3.5 text-gray-400" />
          </span>
        )}
      </div>

      <ul className="relative mt-4 space-y-2 border-t pt-4" style={{ borderColor: hexA(accent, 0.14) }}>
        {(t.benefits || []).map((b, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px] leading-snug text-gray-600">
            <span
              className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
              style={{ background: hexA(accent, 0.14) }}
            >
              <Check className="h-2.5 w-2.5" style={{ color: accent }} strokeWidth={3} />
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatTile({ icon: Icon, tone, label, value, sign }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-b from-white to-gray-50 p-3.5 text-center sm:p-4"
      style={{ boxShadow: '0 10px 24px -12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.9)' }}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent" />
      <div className="relative">
        <div className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
          <Icon style={{ width: 18, height: 18 }} />
        </div>
        <div className="text-lg font-bold text-gray-900 sm:text-xl">
          {sign || ''}{Number(value ?? 0).toLocaleString('id-ID')}
        </div>
        <div className="text-[11px] text-gray-500 sm:text-xs">{label}</div>
      </div>
    </div>
  );
}
