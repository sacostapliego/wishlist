import type { Metadata } from 'next'
import { LayoutShell } from '@/components/layout/LayoutShell'
import WishlistPage from '@/views/WishlistPage'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  try {
    const res = await fetch(`${API_URL}wishlists/public/${id}`, { cache: 'no-store' })
    if (!res.ok) return { title: 'Wishlist' }

    const wishlist = await res.json()
    const ownerId = wishlist.user_id || wishlist.owner_id
    const ownerName = wishlist.owner_name || wishlist.owner_username || 'Unknown'

    let ogImage: string
    if (wishlist.thumbnail_type === 'image' && wishlist.thumbnail_image) {
      ogImage = `${API_URL.replace(/\/$/, '')}/wishlists/${id}/thumbnail`
    } else {
      ogImage = `${API_URL.replace(/\/$/, '')}/users/${ownerId}/profile-image`
    }

    return {
      title: wishlist.title,
      description: wishlist.description ?? `${ownerName}'s wishlist`,
      openGraph: {
        title: wishlist.title,
        description: wishlist.description ?? `${ownerName}'s wishlist`,
        images: [ogImage],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
      },
    }
  } catch {
    return { title: 'Wishlist' }
  }
}

export default async function Page({ params }: Props) {
  const { id } = await params
  return (
    <LayoutShell type="public">
      <WishlistPage id={id} />
    </LayoutShell>
  )
}
