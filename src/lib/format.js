export const rupiah = (value) => {
  const n = Number(value || 0)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const formatDateTime = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const nightsBetween = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0
  const a = new Date(checkIn)
  const b = new Date(checkOut)
  const diff = Math.round((b - a) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

export const STATUS_LABELS = {
  pending: 'Menunggu Pembayaran',
  awaiting_verification: 'Menunggu',
  confirmed: 'Sukses',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  rejected: 'Ditolak',
}

export const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  awaiting_verification: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-brand-100 text-brand-700',
  cancelled: 'bg-gray-200 text-gray-600',
  rejected: 'bg-red-100 text-red-700',
}
