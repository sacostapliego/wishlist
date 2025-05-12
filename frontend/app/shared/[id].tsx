import React, { useState } from 'react';
import { SafeAreaView, useWindowDimensions, StyleSheet, Platform, View, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../styles/theme';
import { API_URL } from '../services/api'; // Keep for image URLs if items have them
import { Header } from '../components/layout/Header';
import { WishlistInfo } from '../components/wishlist/WishlistInfo';
import { LoadingState } from '../components/common/LoadingState';
import { usePublicWishlistDetail } from '../hooks/usePublicWishlistDetail'; // Adjust path if needed
import { useRefresh } from '../context/RefreshContext'; // Keep if manual refresh is desired
import { WishlistContent } from '../components/wishlist/WishlistContent';
import { WishlistListView } from '../components/wishlist/WishlistListView';
import { EmptyState } from '../components/layout/EmptyState';

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
  const { refreshTimestamp } = useRefresh(); // For potential manual refresh

  const [viewMode, setViewMode] = useState<'bento' | 'list'>('bento');

  // Use the new hook for public data
  const { wishlist, items, ownerDisplayInfo, isLoading, refetch } = usePublicWishlistDetail(id as string, refreshTimestamp);

  const baseSize = Platform.OS === 'web' ? (420 / 2) : (width - (SPACING.md * 3) / 2);
  const activeColor = wishlist?.color || COLORS.cardDark;

  console.log('Wishlist:', ownerDisplayInfo?.profileImageUrl);

  const handleItemPress = (item: WishlistItem) => {
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (!wishlist && !isLoading) {
    return (
        <SafeAreaView style={styles.container}>
            <Header
                title="Not Found"
                onBack={() => router.canGoBack() ? router.back() : router.replace('/')}
            />
            <EmptyState
                message="This wishlist could not be loaded. It might be private or no longer available."
            />
        </SafeAreaView>
    );
  }

  const renderMainContent = () => {
    if (!items || items.length === 0) {
      return (
        <EmptyState
          message="This wishlist is empty."
          // No actionText or onAction for public view
        />
      );
    }

    if (viewMode === 'bento') {
      return (
        <WishlistContent
          items={items}
          baseSize={baseSize}
          isSelectionMode={false} 
          selectedItems={[]}    
          onItemPress={handleItemPress}
          wishlistColor={wishlist?.color}
          onAddItem={() => {}} // Pass empty function instead of undefined
          onCancelSelection={() => {}} // Pass empty function
        />
      );
    } else {
      return (
        <WishlistListView
          items={items}
          onItemPress={handleItemPress} // Or undefined
          isSelectionMode={false} // Not in selection mode
          selectedItems={[]}    // No selected items
          wishlistColor={wishlist?.color}
        />
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={wishlist?.title || 'Shared Wishlist'}
        onBack={() => router.canGoBack() ? router.back() : router.replace('/auth/login')} // Generic back or home
      />

      <WishlistInfo
        username={ownerDisplayInfo?.name || wishlist?.title || "Someone's Wishlist"} // Fallback username
        description={wishlist?.description}
        profileImage={ownerDisplayInfo?.profileImageUrl} // WishlistInfo needs to handle undefined
        
        hasItems={items && items.length > 0}
      />
      {/* View toggle can remain if items exist */}
      {items && items.length > 0 && (
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'bento' && {backgroundColor: activeColor, borderColor: activeColor },
            ]}
            onPress={() => setViewMode('bento')}
          >
            <Ionicons name="grid-outline" size={20} color={viewMode === 'bento' ? COLORS.white : COLORS.text.secondary} />
            <Text style={[styles.toggleButtonText, viewMode === 'bento' && styles.activeToggleButtonText]}>Grid</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'list' && {backgroundColor: activeColor, borderColor: activeColor },
            ]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list-outline" size={20} color={viewMode === 'list' ? COLORS.white : COLORS.text.secondary} />
            <Text style={[styles.toggleButtonText, viewMode === 'list' && styles.activeToggleButtonText]}>List</Text>
          </TouchableOpacity>
        </View>
      )}

      {renderMainContent()}
    </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: SPACING.sm,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.text.secondary,
    marginHorizontal: SPACING.sm / 2,
  },
  toggleButtonText: {
    marginLeft: SPACING.xs,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  activeToggleButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});