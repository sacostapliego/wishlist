import { WishlistItem, WishlistItemDetails } from "./wishlist";

export interface ItemActionsMenuProps {
  itemId: string;
  wishlistId: string;
  itemName: string;
  menuVisible: boolean;
  onMenuClose: () => void;
  onItemDeleted: () => void;
  onError?: (message: string) => void;
}

export interface ItemDetailContentProps {
  item: WishlistItemDetails;
  wishlistColor?: string;
  onOpenUrl: () => void;
  onCopyUrl: () => void;
  claimingContent?: React.ReactNode;
}

export interface ItemOptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export type ItemGridProps = {
  items: WishlistItem[];
  baseSize: number;
  onItemPress?: (item: WishlistItem) => void;
  showPrice?: boolean;
  selectedItems?: string[];
  selectionMode?: boolean;
  wishlistColor?: string;
};

export interface ItemSelectionManagerProps {
  selectedItems: string[];
  onItemsDeleted: () => void;
  refetchItems: () => void;
  confirmDeleteVisible: boolean;
  setConfirmDeleteVisible: (visible: boolean) => void;
}

export default function item() {}