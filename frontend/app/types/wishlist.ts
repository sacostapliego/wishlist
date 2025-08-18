export interface WishlistInfoProps {
  username?: string;
  description?: string;
  profileImage?: string;
  onAddPress?: () => void;
  hasItems?: boolean;
  onProfilePress?: () => void;
  showAddFriend?: boolean;
  onAddFriend?: () => void;
}

export interface WishlistItemDetails {
    id: string;
    name: string;
    description?: string;
    price?: number;
    url?: string;
    image?: string;
    priority?: number;
}

export type WishlistItem = {
  id: string;
  name: string;
  image?: string;
  price?: number;
  priority: number;
};

export interface WishlistOptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onSelectItems: () => void;
  onShare: () => void;
}

export interface WishlistActionsProps {
  wishlistId: string;
  menuVisible: boolean;
  onMenuClose: () => void;
  onEnterSelectionMode: () => void;
  refetchItems: () => void;
}

export interface WishlistContentProps {
  items: WishlistItem[];
  baseSize: number;
  isSelectionMode: boolean;
  selectedItems: string[];
  onItemPress: (item: WishlistItem) => void;
  onAddItem: () => void;
  onCancelSelection: () => void;
  wishlistColor?: string;
}

export interface WishlistListViewProps {
  items: WishlistItem[];
  onItemPress?: (item: WishlistItem) => void;
  isSelectionMode: boolean;
  selectedItems: string[];
  wishlistColor?: string; 
}


export default function wishlists() {
}