import api from "./api";

export const wishlistAPI = {
    getItems: async () => {
      const response = await api.get('/wishlist');
      return response.data;
    },
    
    createItem: async (item: any) => {
      const response = await api.post('/wishlist', item);
      return response.data;
    },
    
    updateItem: async (id: string, item: any) => {
      const response = await api.put(`/wishlist/${id}`, item);
      return response.data;
    },
    
    deleteItem: async (id: string) => {
      const response = await api.delete(`/wishlist/${id}`);
      return response.data;
    },
    
    getUserWishlist: async (userId: string) => {
      const response = await api.get(`/wishlist/user/${userId}`);
      return response.data;
    },

    getWishlists: async () => {
      const response = await api.get('/wishlists');
      return response.data;
    },
    
    getWishlist: async (id: string) => {
      const response = await api.get(`/wishlists/${id}`);
      return response.data;
    },
    
    createWishlist: async (wishlist: any) => {
      const response = await api.post('/wishlists', wishlist);
      return response.data;
    },
    
    updateWishlist: async (id: string, wishlist: any) => {
      const response = await api.put(`/wishlists/${id}`, wishlist);
      return response.data;
    },
    
    deleteWishlist: async (id: string) => {
      const response = await api.delete(`/wishlists/${id}`);
      return response.data;
    },
    
    getUserWishlists: async (userId: string) => {
      const response = await api.get(`/wishlists/user/${userId}`);
      return response.data;
    }
  };

export default wishlistAPI;