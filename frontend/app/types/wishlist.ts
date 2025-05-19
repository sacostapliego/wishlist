export interface WishlistInfoProps {
  username?: string;
  description?: string;
  profileImage?: string;
  onAddPress?: () => void;
  hasItems?: boolean;
}

export interface WishlistItemDetails {
    id: string;
    name: string;
    description?: string;
    price?: number;
    url?: string;
    image?: string;
}

export default function wishlists() {
}