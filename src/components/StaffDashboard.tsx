import AdminPanel from './AdminPanel'

export default function StaffDashboard({ onBackToStore }: { onBackToStore: () => void }) {
  return <AdminPanel initialTab="orders" onBackToStore={onBackToStore} />
}
