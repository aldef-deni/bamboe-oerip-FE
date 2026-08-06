import UsersTable from './UsersTable'

export default function AdminCustomers() {
  return (
    <UsersTable
      role="user"
      title="Pengguna"
      subtitle="Semua pengguna yang telah mendaftar."
      showBookings
      allowDelete
    />
  )
}
