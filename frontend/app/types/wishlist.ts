export interface WishlistInfoProps {
  username?: string;
  description?: string;
  profileImage?: string;
  onAddPress?: () => void;
  hasItems?: boolean;
}