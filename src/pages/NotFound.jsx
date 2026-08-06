import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-brand-600">404</h1>
      <p className="mt-3 text-lg font-semibold text-gray-800">Halaman tidak ditemukan</p>
      <p className="mt-1 text-sm text-gray-500">Halaman yang Anda cari mungkin sudah dipindahkan atau tidak ada.</p>
      <Button as={Link} to="/" className="mt-6">
        Kembali ke Beranda
      </Button>
    </div>
  )
}
