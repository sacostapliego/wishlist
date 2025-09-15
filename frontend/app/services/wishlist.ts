import api from "./api";

export const wishlistAPI = {
    getWishlistItems: async (wishlistId: string) => {
      try {
        const response = await api.get(`/wishlist/items/${wishlistId}`);
        return response.data;
      } catch (error) {
        console.error(`Error fetching items for wishlist ${wishlistId}:`, error);
        return []; 
      }
    },  
    
    getItems: async () => {
      const response = await api.get('/wishlist/'); 
      return response.data;
    },
    
    createItem: async (item: any, image?: File) => {
      const formData = new FormData();
      
      // Add all item properties to form data
      Object.keys(item).forEach(key => {
        if (item[key] !== null && item[key] !== undefined) {
          formData.append(key, item[key].toString());
        }
      });
      
      // Append image if it exists
      if (image) {
        formData.append('image', image);
      }
      
      const response = await api.post('/wishlist/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    
    updateItem: async (id: string, item: any, image?: File) => {
      const formData = new FormData();
      
      // Add all item properties to form data
      Object.keys(item).forEach(key => {
        if (item[key] !== null && item[key] !== undefined) {
          formData.append(key, item[key].toString());
        }
      });
      
      // Append image if it exists
      if (image) {
        formData.append('image', image);
      }
      
      const response = await api.put(`/wishlist/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
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
      const response = await api.get('/wishlists/');
      return response.data;
    },
    
    getWishlist: async (id: string) => {
      const response = await api.get(`/wishlists/${id}`);
      return response.data;
    },
    
    createWishlist: async (wishlist: any) => {
      try {
        const response = await api.post('/wishlists/', wishlist);
        return response.data;
      } catch (error) {
        console.error('API Error in createWishlist:', error);
        throw error; // Make sure errors are propagated
      }
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
    },

    getPublicWishlist: async (id: string) => {
      try {
        const response = await api.get(`/wishlists/public/${id}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching public wishlist:', error);
        throw error;
      }
    },
    
    getPublicWishlistItems: async (wishlistId: string) => {
      try {
        const response = await api.get(`/wishlist/public/${wishlistId}`);
        return response.data;
      } catch (error) {
        console.error(`Error fetching items for public wishlist ${wishlistId}:`, error);
        return []; 
      }
    },
    
    getWisihlistItem: async (itemId: string) => {
      try {
        const response = await api.get(`/wishlist/${itemId}`);
        return response.data;
      } catch (error) {
        console.error(`Error fetching item ${itemId}:`, error);
        throw error;
      }
    },

    scrapeUrl: async (url: string) => {
      try {
        const response = await api.post('/wishlist/scrape-url', { url });
        return response.data;
      } catch (error) {
        console.error('Error scraping URL:', error);
        throw error; // Propagate the error for handling in the component
      }
    },

    async claimItem(itemId: string, claimData: { user_id?: string; guest_name?: string }) {
        const response = await api.post(`/wishlist/${itemId}/claim`, claimData);
        return response.data;
    },

    async unclaimItem(itemId: string, unclaimData: { user_id?: string; guest_name?: string }) {
        const response = await api.delete(`/wishlist/${itemId}/claim`, { data: unclaimData });
        return response.data;
    },
};

export default wishlistAPI;