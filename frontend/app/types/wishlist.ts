export interface WishlistInfoProps {
  username?: string;
  description?: string;
  profileImage?: string;
  showAddButton?: boolean;
  onAddPress?: () => void;
}