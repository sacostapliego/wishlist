import { LayoutShell } from '@/components/layout/LayoutShell'
import ProfilePage from '@/views/ProfilePage'

export default function Page() {
  return (
    <LayoutShell type="public">
      <ProfilePage />
    </LayoutShell>
  )
}
