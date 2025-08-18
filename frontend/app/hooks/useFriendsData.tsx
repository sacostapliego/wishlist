import { useCallback, useEffect, useState } from 'react';
import friendsAPI, {
  FriendRequestInfo,
  FriendWishlistResponse,
  FriendInfo,
} from '../services/friends';
import { WishlistData } from '../types/lists';

export function useFriendsData() {
  const [wishlists, setWishlists] = useState<WishlistData[]>([]);
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [requests, setRequests] = useState<FriendRequestInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const wishlistResponses: FriendWishlistResponse[] = await friendsAPI.getFriendsWishlists();
      setWishlists(
        wishlistResponses.map(wishlist => ({
          id: wishlist.id,
          title: wishlist.title,
          itemCount: wishlist.item_count || 0,
          color: wishlist.color || '#ff7f50',
          image: wishlist.image,
          ownerName: wishlist.owner_name,
          ownerUsername: wishlist.owner_username,
        }))
      );

      const friendsList = await friendsAPI.getFriendsList();
      setFriends(friendsList);

      const friendRequests = await friendsAPI.getFriendRequests();
      setRequests(friendRequests);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const accept = async (id: string) => {
    await friendsAPI.acceptFriendRequest(id);
    await loadData();
  };

  const decline = async (id: string) => {
    await friendsAPI.declineFriendRequest(id);
    await loadData();
  };

  return { wishlists, friends, requests, refreshing, reload: loadData, accept, decline };
}