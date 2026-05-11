import type { Metadata } from 'next'
import { LayoutShell } from '@/components/layout/LayoutShell'
import ItemPage from '@/views/ItemPage'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/'

type Props = {
  params: Promise<{ id: string; itemId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, itemId } = await params

  try {
    const res = await fetch(`${API_URL}wishlist/public/${id}`, { cache: 'no-store' })
    if (!res.ok) return { title: 'Item' }

    const items = await res.json()
    const item = items.find((i: { id: string }) => i.id === itemId)

    if (!item) return { title: 'Item' }

    const ogImage = item.image ? `${API_URL}${item.image}` : '/favicon.png'

    return {
      title: item.name,
      description: item.description ?? 'View this item',
      openGraph: {
        title: item.name,
        description: item.description ?? 'View this item',
        images: [ogImage],
      },
      twitter: {
        card: 'summary_large_image',
      },
    }
  } catch {
    return { title: 'Item' }
  }
}

export default async function Page({ params }: Props) {
  const { id, itemId } = await params
  return (
    <LayoutShell type="public">
      <ItemPage wishlistId={id} itemId={itemId} />
    </LayoutShell>
  )
}
