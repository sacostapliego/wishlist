import { LayoutShell } from '@/components/layout/LayoutShell'
import AllClaimedItemsPage from '@/views/AllClaimedItemsPage'

export default function Page() {
  return (
    <LayoutShell type="protected">
      <AllClaimedItemsPage />
    </LayoutShell>
  )
}
