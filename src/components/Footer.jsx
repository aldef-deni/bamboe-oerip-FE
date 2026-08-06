import { Link } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'

export default function Footer() {
  const settings = useSettings()
  return (
    <footer className="mt-16 border-t border-brand-100 bg-brand-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <img src="/logo-landsc.png" alt="Villa Box" className="mb-4 h-16 w-auto max-w-[220px]" />
          <p className="max-w-md text-sm leading-relaxed text-gray-600">
            <span className="font-semibold text-brand-700">Villabox Bamboe Oerip</span> menghadirkan pengalaman
            menginap istimewa di villa, homestay, dan properti pilihan dengan sentuhan alami khas bambu. Nikmati
            kenyamanan, privasi, dan ketenangan di setiap unit kami — didukung proses pemesanan yang mudah, harga
            transparan, serta pelayanan yang ramah dan tepercaya.
          </p>
          {settings.site_tagline && (
            <p className="mt-3 text-sm font-medium italic text-gold-700">“{settings.site_tagline}”</p>
          )}
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Jelajahi</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <Link to="/villas" className="hover:text-brand-700">
                Cari Villa
              </Link>
            </li>
            <li>
              <Link to="/tentang-bamboe-oerip" className="hover:text-brand-700">
                Tentang Bamboe Oerip
              </Link>
            </li>
            <li>
              <Link to="/profile/pesanan" className="hover:text-brand-700">
                Pesanan Saya
              </Link>
            </li>
            <li>
              <Link to="/profile/wishlist" className="hover:text-brand-700">
                Wishlist
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Kontak</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            {settings.contact_email && <li>{settings.contact_email}</li>}
            {settings.contact_phone && <li>{settings.contact_phone}</li>}
            {settings.address && <li>{settings.address}</li>}
          </ul>
        </div>
      </div>
      <div
        className="py-4 text-center text-xs font-medium text-white"
        style={{ background: 'linear-gradient(90deg, #143a26 0%, #1e5c3c 50%, #143a26 100%)' }}
      >
        © {new Date().getFullYear()} {settings.site_name || 'Villa Box'}. Semua hak dilindungi.
      </div>
    </footer>
  )
}
