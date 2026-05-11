import { LayoutShell } from '@/components/layout/LayoutShell'
import HomePage from '@/views/HomePage'

export default function Page() {
  return (
    <LayoutShell type="protected">
      <HomePage />
    </LayoutShell>
  )
}
