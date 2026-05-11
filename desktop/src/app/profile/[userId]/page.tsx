import { LayoutShell } from '@/components/layout/LayoutShell'
import ProfilePage from '@/views/ProfilePage'

type Props = {
  params: Promise<{ userId: string }>
}

export default async function Page({ params }: Props) {
  const { userId } = await params
  return (
    <LayoutShell type="public">
      <ProfilePage userId={userId} />
    </LayoutShell>
  )
}
