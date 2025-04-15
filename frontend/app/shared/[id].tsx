import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity,
  Image,
  useWindowDimensions
} from 'react-native';
import { COLORS, SPACING } from '../styles/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { wishlistAPI } from '../services/wishlist';
import Toast from 'react-native-toast-message';

type WishlistItem = {
  id: string;
  name: string;
  image?: string;
  price?: number;
  priority: number;
};

export default function SharedWishlistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  const [wishlist, setWishlist] = useState<any | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate the base size for grid items
  const baseSize = (width - (SPACING.md * 3)) / 2; // 2 columns with spacing

  useEffect(() => {
    if (id) {
      fetchWishlistItems();
    }
  }, [id]);

  const fetchWishlistItems = async () => {
    setIsLoading(true);
    try {
      // Public access only - no auth needed
      const wishlistData = await wishlistAPI.getPublicWishlist(id);
      const itemsData = await wishlistAPI.getPublicWishlistItems(id);
      
      setWishlist(wishlistData);
      setItems(itemsData);
    } catch (error) {
      console.error('Failed to fetch wishlist details:', error);
      setError("This wishlist doesn't exist or is private");
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !wishlist) {
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
            <Text style={styles.title}>Wishlist Not Found</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.inactive} />
          <Text style={styles.errorText}>{error || "This wishlist couldn't be loaded"}</Text>
          <Text style={styles.errorSubtext}>It might be private or no longer exists</Text>
          
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => router.replace('/auth')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
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
          <Text style={styles.title}>{wishlist.title}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.wishlistInfo}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>Shared Wishlist</Text>
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
        </View>
        
        {!items || items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="gift-outline" size={64} color={COLORS.inactive} />
            <Text style={styles.emptyText}>No items in this wishlist yet</Text>
          </View>
        ) : (
          <View style={styles.itemsGrid}>
            {items.map(item => {
              const size = getItemSize(item.priority);
              return (
                <View 
                  key={item.id} 
                  style={[
                    styles.itemCard,
                    { 
                      width: size,
                      height: size * 1.5, // Aspect ratio 1:1.5
                    }
                  ]}
                >
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                  ) : (
                    <View style={styles.noImage}>
                      <Ionicons name="image-outline" size={30} color={COLORS.inactive} />
                    </View>
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                    {item.price && <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>}
                  </View>
                </View>
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
  placeholder: {
    width: 40, // Same width as back button for alignment
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
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
    resizeMode: 'cover',
  },
  noImage: {
    width: '100%',
    height: '70%',
    backgroundColor: COLORS.cardDark,
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
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    marginTop: SPACING.lg,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});