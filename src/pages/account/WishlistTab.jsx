import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import api from '../../lib/api'
import VillaCard from '../../components/VillaCard'
import { PageLoader, EmptyState, Button } from '../../components/ui'

export default function WishlistTab() {
  const [villas, setVillas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/wishlist')
      .then((res) => setVillas(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  if (villas.length === 0)
    return (
      <EmptyState
        icon={Heart}
        title="Wishlist masih kosong"
        subtitle="Simpan villa favoritmu untuk dilihat kembali nanti."
        action={
          <Button as={Link} to="/villas">
            Jelajahi Villa
          </Button>
        }
      />
    )

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {villas.map((v) => (
        <VillaCard key={v.id} villa={v} />
      ))}
    </div>
  )
}
