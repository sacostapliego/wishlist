import { LayoutShell } from '@/components/layout/LayoutShell'
import FriendsPage from '@/views/FriendsPage'

export default function Page() {
  return (
    <LayoutShell type="protected">
      <FriendsPage />
    </LayoutShell>
  )
}
