import { LayoutShell } from '@/components/layout/LayoutShell'
import AllWishlistsPage from '@/views/AllWishlistsPage'

export default function Page() {
  return (
    <LayoutShell type="protected">
      <AllWishlistsPage type="friends" />
    </LayoutShell>
  )
}
