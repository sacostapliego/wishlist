import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  SafeAreaView,
  useWindowDimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING } from '../styles/theme';
import { wishlistAPI } from '../services/wishlist';
import Toast from 'react-native-toast-message';
import { useRefresh } from '../context/RefreshContext';
import { WishlistApiResponse } from '../types/lists';
import { API_URL } from '../services/api';

type WishlistItem = {
  id: string;
  name: string;
  image?: string;
  price?: number;
  priority: number;
};

export default function WishlistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { refreshTimestamp } = useRefresh();
  
  const [wishlist, setWishlist] = useState<WishlistApiResponse | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate the base size for grid items
  const baseSize = (width - (SPACING.md * 3)) / 2; // 2 columns with spacing

  useEffect(() => {
    if (id) {
      fetchWishlistDetails();
    }
  }, [id, refreshTimestamp]);

  const fetchWishlistDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch wishlist details
      const wishlistData = await wishlistAPI.getWishlist(id);
      setWishlist(wishlistData);
      
      // Fetch items in this wishlist
      const itemsData = await wishlistAPI.getItems(); 
      
      // Filter items for this wishlist
      const filteredItems = itemsData.filter(
        (item: any) => item.wishlist_id === id
      );
      
      setItems(filteredItems);
    } catch (error) {
      console.error('Failed to fetch wishlist details:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load wishlist details'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Size multiplier based on priority (0-5)
  const getSizeMultiplier = (priority: number) => {
    switch(priority) {
      case 0: return 1;    // base size
      case 1: return 1.05; // slightly larger
      case 2: return 1.1;
      case 3: return 1.15;
      case 4: return 1.2;
      case 5: return 1.3;  // largest
      default: return 1;
    }
  };

  // Calculate item size based on priority
  const getItemSize = (priority: number) => {
    return baseSize * getSizeMultiplier(priority);
  };

  // Format price with currency symbol
  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '';
    return `$${price.toFixed(2)}`;
  };

  const getItemImageUrl = (itemId: string): string => {
    if (!itemId) return '';
    return `${API_URL}wishlist/${itemId}/image`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>{wishlist?.title || 'Wishlist'}</Text>
        </View>
        <TouchableOpacity style={styles.optionsButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.wishlistInfo}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{user?.username || user?.name || 'User'}</Text>
        </View>
        {wishlist?.description && (
          <Text style={styles.description}>{wishlist.description}</Text>
        )}
      </View>

      <ScrollView 
        style={styles.itemsContainer}
        contentContainerStyle={styles.itemsContent}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Items</Text>
          <TouchableOpacity 
            style={styles.addItemButton}
            onPress={() => router.push('/home/add-item')}
          >
            <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        
        {!items || items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="gift-outline" size={64} color={COLORS.inactive} />
            <Text style={styles.emptyText}>No items in this wishlist yet</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/home/add-item')}
            >
              <Text style={styles.addButtonText}>Add an item</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.itemsGrid}>
            {items.map((item) => {
              const itemSize = getItemSize(item.priority);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    { 
                      width: itemSize,
                      height: itemSize,
                    }
                  ]}
                  onPress={() => {
                    console.log('View item:', item.id);
                  }}
                >
                  {item.id && item.image ? (
                    <Image 
                      source={{ uri: `${API_URL}wishlist/${item.id}/image` }} 
                      style={styles.itemImage}
                      resizeMode="cover"
                      onError={(e) => {
                        console.log('Image load error:', e.nativeEvent.error);
                      }}
                    />
                  ) : (
                    <View style={styles.noImage}>
                      <Ionicons name="image-outline" size={32} color={COLORS.inactive} />
                    </View>
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    {item.price !== undefined && (
                      <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  optionsButton: {
    padding: SPACING.xs,
  },
  wishlistInfo: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: SPACING.sm,
  },
  profilePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  description: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  itemsContainer: {
    flex: 1,
  },
  itemsContent: {
    padding: SPACING.md,
    paddingBottom: 100, // Extra padding at bottom for scrolling
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  addItemButton: {
    padding: SPACING.xs,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemCard: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 12,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '70%',
  },
  noImage: {
    width: '100%',
    height: '70%',
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    padding: SPACING.xs,
    height: '30%',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  itemPrice: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});