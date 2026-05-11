import { LayoutShell } from '@/components/layout/LayoutShell'
import SettingsPage from '@/views/SettingsPage'

export default function Page() {
  return (
    <LayoutShell type="protected">
      <SettingsPage />
    </LayoutShell>
  )
}
