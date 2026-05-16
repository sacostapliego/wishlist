import { cookies } from 'next/headers'
import { LayoutShell } from '@/components/layout/LayoutShell'
import HomePage from '@/views/HomePage'
import { LandingLayout } from '@/components/landing/LandingLayout'
import { LandingContent } from '@/components/landing/LandingContent'

export default async function Page() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (token) {
    return (
      <LayoutShell type="protected">
        <HomePage />
      </LayoutShell>
    )
  }

  return (
    <LandingLayout>
      <LandingContent />
    </LandingLayout>
  )
}
