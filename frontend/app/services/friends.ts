import api from './api';

export interface FriendWishlistResponse {
  id: string;
  title: string;
  description?: string;
  color?: string;
  item_count: number;
  owner_name: string;
  owner_username: string;
  image?: string;
}

export interface UserSearchResponse {
  id: string;
  username: string;
  name?: string;
}

export interface FriendRequestInfo {
  id: string;
  user_id: string;
  username: string;
  name?: string;
  created_at: string;
}

export interface FriendInfo {
  id: string;
  username: string;
  name?: string;
}

export const friendsAPI = {
  async searchUser(username: string): Promise<UserSearchResponse> {
    try {
      const response = await api.get(`/friends/search?username=${encodeURIComponent(username)}`);
      return response.data;
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('User not found');
    }
  },

  async sendFriendRequest(friendId: string) {
    try {
      const response = await api.post('/friends/request', { friendId });
      return response.data;
    } catch (error) {
      console.error('Friend request error:', error);
      throw new Error('Failed to send friend request');
    }
  },

  async getFriendRequests(): Promise<FriendRequestInfo[]> {
    try {
      const response = await api.get('/friends/requests');
      return response.data;
    } catch (error) {
      console.error('Get friend requests error:', error);
      throw new Error('Failed to fetch friend requests');
    }
  },

  async acceptFriendRequest(requestId: string) {
    try {
      const response = await api.post(`/friends/requests/${requestId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Accept friend request error:', error);
      throw new Error('Failed to accept friend request');
    }
  },

  async declineFriendRequest(requestId: string) {
    try {
      const response = await api.post(`/friends/requests/${requestId}/decline`);
      return response.data;
    } catch (error) {
      console.error('Decline friend request error:', error);
      throw new Error('Failed to decline friend request');
    }
  },

  async getFriendsWishlists(): Promise<FriendWishlistResponse[]> {
    try {
      const response = await api.get('/friends/wishlists');
      return response.data;
    } catch (error) {
      console.error('Friends wishlists error:', error);
      return [];
    }
  },

  async getFriendsList(): Promise<FriendInfo[]> {
    try {
      const response = await api.get('/friends/list');
      const wl: FriendWishlistResponse[] = await friendsAPI.getFriendsWishlists();
      console.log('Friends wishlists:', wl.map(x => ({ id: x.id, image: x.image })));
      return response.data;
    } catch (error) {
      console.error('Friends list error:', error);
      return [];
    }
  },

  async checkFriendshipStatus(userId: string): Promise<boolean> {
    try {
      const friendsWishlists = await this.getFriendsWishlists();
      return friendsWishlists.some(wishlist =>
        wishlist.id === userId || false
      );
    } catch (error) {
      console.error('Failed to check friendship status:', error);
      return false;
    }
  }
};



export default friendsAPI;