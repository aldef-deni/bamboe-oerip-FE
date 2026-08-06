import { Star } from 'lucide-react'

export default function StarRating({ value = 0, size = 16, showValue = false, count }) {
  const rounded = Math.round(Number(value))
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            style={{ width: size, height: size }}
            className={i <= rounded ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}
          />
        ))}
      </span>
      {showValue && (
        <span className="text-sm font-medium text-gray-700">
          {Number(value).toFixed(1)}
          {count != null && <span className="text-gray-400"> ({count})</span>}
        </span>
      )}
    </span>
  )
}
