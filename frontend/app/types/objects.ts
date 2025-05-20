import { Ionicons } from "@expo/vector-icons";
import { ViewStyle } from "react-native";
import { WishlistItem } from "./wishlist";

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export interface ShareLinkModalProps {
  visible: boolean;
  shareUrl: string | null;
  onClose: () => void;
}

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  color?: string;
}

export interface IconWithBadgeProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  badgeCount?: number;
  badgeColor?: string;
}

export type BentoGridProps = {
  items: WishlistItem[];
  baseSize: number;
  onItemPress?: (item: WishlistItem) => void;
  selectedItems?: string[];
  selectionMode?: boolean;
  wishlistColor?: string;
};

export interface SelectionHeaderProps {
  selectedCount: number;
  onCancelSelection: () => void;
  onDeleteSelected: () => void;
}

export default function objects () {}