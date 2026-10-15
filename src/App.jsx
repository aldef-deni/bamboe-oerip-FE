import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { ProtectedRoute, AdminRoute, OwnerRoute } from './components/ProtectedRoute'

import Home from './pages/Home'
import Villas from './pages/Villas'
import VillaDetail from './pages/VillaDetail'
import PromosPage from './pages/PromosPage'
import About from './pages/About'
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import Register from './pages/Register'
import Checkout from './pages/Checkout'
import BookingDetail from './pages/BookingDetail'
import AccountLayout from './pages/account/AccountLayout'
import ProfileTab from './pages/account/ProfileTab'
import BookingsTab from './pages/account/BookingsTab'
import WishlistTab from './pages/account/WishlistTab'
import NotFound from './pages/NotFound'

import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminVillas from './pages/admin/Villas'
import AdminVillaForm from './pages/admin/VillaForm'
import AdminBookings from './pages/admin/Bookings'
import AdminPayments from './pages/admin/Payments'
import AdminAmenities from './pages/admin/Amenities'
import AdminPromos from './pages/admin/Promos'
import AdminCustomers from './pages/admin/Customers'
import AdminUsers from './pages/admin/Users'
import AdminReports from './pages/admin/Reports'
import AdminSettings from './pages/admin/Settings'
import LoyaltyPage from './pages/LoyaltyPage'
import AdminLoyalty from './pages/admin/Loyalty'
import AdminProfile from './pages/admin/Profile'
import AdminOwners from './pages/admin/Owners'

import OwnerLogin from './pages/owner/OwnerLogin'
import OwnerLayout from './pages/owner/OwnerLayout'
import OwnerDashboard from './pages/owner/Dashboard'
import OwnerProperties from './pages/owner/Properties'
import OwnerPropertyForm from './pages/owner/PropertyForm'
import OwnerBookings from './pages/owner/Bookings'
import OwnerBookingDetail from './pages/owner/BookingDetail'
import OwnerReviews from './pages/owner/Reviews'
import OwnerReports from './pages/owner/Reports'

// Build target: 'customer' (situs pemesanan), 'admin' (dashboard pengelola),
// 'owner' (ekstranet owner properti), atau 'all' (gabungan — pengembangan lokal).
const TARGET = import.meta.env.VITE_APP_TARGET || 'all'

// Bagian admin (dipakai di build 'admin' & 'all')
function adminSection() {
  return (
    <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
      <Route index element={<AdminDashboard />} />
      <Route path="villas" element={<AdminVillas />} />
      <Route path="villas/new" element={<AdminVillaForm />} />
      <Route path="villas/:id/edit" element={<AdminVillaForm />} />
      <Route path="bookings" element={<AdminBookings />} />
      <Route path="payments" element={<AdminPayments />} />
      <Route path="amenities" element={<AdminAmenities />} />
      <Route path="promos" element={<AdminPromos />} />
      <Route path="reports" element={<AdminReports />} />
      <Route path="users" element={<AdminCustomers />} />
      <Route path="loyalty" element={<AdminLoyalty />} />
      <Route path="pengelola" element={<AdminUsers />} />
      <Route path="owners" element={<AdminOwners />} />
      {/* redirect URL lama agar bookmark tetap jalan */}
      <Route path="customers" element={<Navigate to="/admin/users" replace />} />
      <Route path="settings" element={<AdminSettings />} />
      <Route path="profile" element={<AdminProfile />} />
    </Route>
  )
}

// Ekstranet owner (dipakai di build 'owner' & 'all'). Tanpa halaman daftar —
// akun owner hanya dibuat superadmin dari panel kelola (/admin/owners).
function ownerSection() {
  return (
    <Route path="/owner" element={<OwnerRoute><OwnerLayout /></OwnerRoute>}>
      <Route index element={<OwnerDashboard />} />
      <Route path="properties" element={<OwnerProperties />} />
      <Route path="properties/new" element={<OwnerPropertyForm />} />
      <Route path="properties/:id/edit" element={<OwnerPropertyForm />} />
      <Route path="bookings" element={<OwnerBookings />} />
      <Route path="bookings/:id" element={<OwnerBookingDetail />} />
      <Route path="reviews" element={<OwnerReviews />} />
      <Route path="reports" element={<OwnerReports />} />
      <Route path="profile" element={<AdminProfile />} />
      <Route path="*" element={<Navigate to="/owner" replace />} />
    </Route>
  )
}

// Bagian customer (dipakai di build 'customer' & 'all')
function customerSection() {
  return (
    <Route element={<Layout />}>
      <Route path="/" element={<Home />} />
      <Route path="/villas" element={<Villas />} />
      <Route path="/villa/:slug" element={<VillaDetail />} />
      <Route path="/promo" element={<PromosPage />} />
      <Route path="/tentang-bamboe-oerip" element={<About />} />
      <Route path="/about" element={<Navigate to="/tentang-bamboe-oerip" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/checkout/:slug" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><AccountLayout /></ProtectedRoute>}>
        <Route index element={<ProfileTab />} />
        <Route path="pesanan" element={<BookingsTab />} />
        <Route path="wishlist" element={<WishlistTab />} />
        <Route path="loyalty" element={<LoyaltyPage />} />
      </Route>
      {/* redirect rute lama ke tab akun */}
      <Route path="/bookings" element={<Navigate to="/profile/pesanan" replace />} />
      <Route path="/wishlist" element={<Navigate to="/profile/wishlist" replace />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  )
}

export default function App() {
  // Dashboard pengelola khusus (kelola.bamboeoerip.com)
  if (TARGET === 'admin') {
    return (
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        {adminSection()}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    )
  }

  // Ekstranet owner (owner.bamboeoerip.com)
  if (TARGET === 'owner') {
    return (
      <Routes>
        <Route path="/login" element={<OwnerLogin />} />
        {ownerSection()}
        <Route path="*" element={<Navigate to="/owner" replace />} />
      </Routes>
    )
  }

  // Situs pemesanan customer (bamboeoerip.com / dev.bamboeoerip.com)
  if (TARGET === 'customer') {
    return <Routes>{customerSection()}</Routes>
  }

  // Gabungan untuk pengembangan lokal
  return (
    <Routes>
      {customerSection()}
      {adminSection()}
      <Route path="/owner/login" element={<OwnerLogin />} />
      {ownerSection()}
    </Routes>
  )
}
