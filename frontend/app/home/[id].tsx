import React from 'react';
import { View, ScrollView, SafeAreaView, useWindowDimensions, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING } from '../styles/theme';
import { useRefresh } from '../context/RefreshContext';
import { API_URL } from '../services/api';
import { Header } from '../components/layout/Header';
import { WishlistInfo } from '../components/wishlist/WishlistInfo';
import { EmptyState } from '../components/layout/EmptyState';
import { ItemGrid } from '../components/wishlist/ItemGrid';
import { SectionHeader } from '../components/common/SectionHeader';
import { LoadingState } from '../components/common/LoadingState';
import { useWishlistDetail } from '../hooks/useWishListDetail';

export default function WishlistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { refreshTimestamp } = useRefresh();
  
  // Calculate the base size for grid items
  const baseSize = (width - (SPACING.md * 3)) / 2; // 2 columns with spacing

  const { wishlist, items, isLoading } = useWishlistDetail(id as string, refreshTimestamp);

  const handleAddItem = () => {
    router.push({
    pathname: '/home/add-item',
    params: { wishlistId: id }
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title={wishlist?.title || 'Wishlist'} 
        onBack={() => router.back()} 
        showOptions 
      />

      <WishlistInfo 
        username={user?.username || user?.name} 
        description={wishlist?.description}
        profileImage={user?.id ? `${API_URL}users/${user.id}/profile-image` : undefined}
      />

      <ScrollView 
        style={styles.itemsContainer}
        contentContainerStyle={styles.itemsContent}
      >
        <SectionHeader 
          title="Items" 
          actionIcon="add-circle" 
          onAction={handleAddItem} 
        />
        
        {!items || items.length === 0 ? (
          <EmptyState 
            message="No items in this wishlist yet" 
            actionText="Add an item"
            onAction={handleAddItem}
          />
        ) : (
          <ItemGrid 
            items={items} 
            baseSize={baseSize} 
            onItemPress={(item) => console.log('View item:', item.id)}
          />
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
  itemsContainer: {
    flex: 1,
  },
  itemsContent: {
    padding: SPACING.md,
    paddingBottom: 50, // Extra padding at bottom for scrolling
  },
});