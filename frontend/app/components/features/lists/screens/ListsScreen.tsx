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
import { SPACING, COLORS } from '@/app/styles/theme';
import { wishlistAPI } from '@/app/services/wishlist';
import { WishlistApiResponse } from '@/app/types/lists';
import Toast from 'react-native-toast-message';
import { useRefresh } from '@/app/context/RefreshContext';
import { useAppNavigation } from '@/app/hooks/useAppNavigation';

export default function ListsScreen() {
  const router = useRouter();
  const [wishlists, setWishlists] = useState<WishlistApiResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { refreshTimestamp, triggerRefresh } = useRefresh();
  const { navigateBack } = useAppNavigation();

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

  const renderWishlists = () => {
  return wishlists.map((item) => {
    const itemColor = item.color || '#ff7f50';
    return (
      <TouchableOpacity 
        key={item.id}
        style={styles.listItem}
        onPress={() => {
          router.push(`/home/lists/${item.id}`);
        }}
      >
        <View style={[styles.colorStrip, { backgroundColor: itemColor }]}>
          <Ionicons name="gift-outline" size={28} color="#fff" />
        </View>
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
           onPress={() => navigateBack('/home')}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>My Lists</Text>
        <TouchableOpacity 
          onPress={handleCreateWishlist}
        >
          <Ionicons name="add-circle-outline" size={28} color={'#ffffffff'} />
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
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 4,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  colorStrip: {
    width: 64,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  listContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.cardDarkLight,
  },
  listTextContainer: {
    flex: 1,
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