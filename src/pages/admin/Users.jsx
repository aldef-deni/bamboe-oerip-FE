import UsersTable from './UsersTable'

export default function AdminUsers() {
  return <UsersTable role="admin" title="Pengelola" subtitle="Akun admin / pengelola sistem." showBookings={false} />
}
