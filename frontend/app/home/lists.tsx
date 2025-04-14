import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING } from '../styles/theme';
import { wishlistAPI } from '../services/wishlist';
import { WishlistApiResponse } from '../types/lists';
import Toast from 'react-native-toast-message';
import { useRefresh } from '../context/RefreshContext';

export default function ListsScreen() {
  const router = useRouter();
  const [wishlists, setWishlists] = useState<WishlistApiResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedWishlist, setSelectedWishlist] = useState<WishlistApiResponse | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const { refreshTimestamp, triggerRefresh } = useRefresh(); // Use refresh context

  // Fetch wishlists on component mount
  useEffect(() => {
    fetchWishlists();
  }, [refreshTimestamp]);

  const fetchWishlists = async () => {
    setIsLoading(true);
    try {
      const response = await wishlistAPI.getWishlists();
      setWishlists(response);
    } catch (error) {
      console.error('Failed to fetch wishlists:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load your wishlists'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWishlist = () => {
    router.push('/home/create-wishlist');
  };

   const handleOpenMenu = (wishlist: WishlistApiResponse) => {
    setSelectedWishlist(wishlist);
    setShowMenu(true);
  };


  const renderWishlists = () => {
    return wishlists.map((item) => {
      const itemColor = item.color || '#ff7f50'; // Default color if none specified
      return (
        <TouchableOpacity 
          key={item.id}
          style={[styles.listItem, { borderLeftColor: itemColor, borderLeftWidth: 5 }]}
          onPress={() => {
            console.log("Navigating to wishlist:", item.id);
          router.push({
            pathname: "/home/[id]",
            params: { id: item.id }
          });
          }}

        >
          <View style={styles.listContent}>
            <View style={styles.listTextContainer}>
              <Text style={styles.listName}>{item.title}</Text>
              <Text style={styles.listDetails}>
                {item.description ? `${item.description.substring(0, 50)}${item.description.length > 50 ? '...' : ''}` : ''}
              </Text>
              <Text style={styles.itemCount}>{item.item_count || 0} items</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.text.secondary} />
          </View>
        </TouchableOpacity>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>My Lists</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleCreateWishlist}
        >
          <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : wishlists.length > 0 ? (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContentContainer}
        >
          {renderWishlists()}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="list" size={64} color={COLORS.inactive} />
          <Text style={styles.emptyText}>You don't have any lists yet</Text>
          <TouchableOpacity 
            style={styles.createButton} 
            onPress={handleCreateWishlist}
          >
            <Text style={styles.createButtonText}>Create a Wishlist</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  addButton: {
    padding: SPACING.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  listContentContainer: {
    padding: SPACING.md,
  },
  listItem: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 8,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  listContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  listTextContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  listName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  listDetails: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  itemCount: {
    fontSize: 12,
    color: COLORS.text.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});