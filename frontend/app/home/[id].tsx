import React, { useState } from 'react';
import { SafeAreaView, useWindowDimensions, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING } from '../styles/theme';
import { API_URL } from '../services/api';
import { Header } from '../components/layout/Header';
import { WishlistInfo } from '../components/wishlist/WishlistInfo';
import { LoadingState } from '../components/common/LoadingState';
import { useWishlistDetail } from '../hooks/useWishListDetail';
import { useRefresh } from '../context/RefreshContext';
import { SelectionHeader } from '../components/wishlist/SelectionHeader';
import { WishlistActions } from '../components/wishlist/WishlistActions';
import { ItemSelectionManager } from '../components/wishlist/ItemSelectionManager';
import { WishlistContent } from '../components/wishlist/WishlistContent';

export default function WishlistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { refreshTimestamp } = useRefresh();

  // UI state
  const [menuVisible, setMenuVisible] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Calculate the base size for grid items
  const baseSize = Platform.OS === 'web' ? (420 / 2) : (width - (SPACING.md * 3) / 2);
  const { wishlist, items, isLoading, refetch } = useWishlistDetail(id as string, refreshTimestamp);

  const handleAddItem = () => {
    router.push({
      pathname: '/home/add-item',
      params: { wishlistId: id }
    });
  };

  const toggleItemSelection = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedItems([]);
  };

  const handleItemPress = (item: any) => {
    if (isSelectionMode) {
      toggleItemSelection(item.id);
    } else {
    }
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
        onBack={() => router.replace('/home/lists')} 
        showOptions={!isSelectionMode}
        onOptionsPress={() => setMenuVisible(true)}
        rightIcon="ellipsis-vertical"
      />
      
      {isSelectionMode && (
        <SelectionHeader
          selectedCount={selectedItems.length}
          onCancelSelection={cancelSelection}
          onDeleteSelected={() => setSelectedItems([])}
        />
      )}
      
      <WishlistInfo 
        username={user?.username || user?.name} 
        description={wishlist?.description}
        profileImage={user?.id ? `${API_URL}users/${user.id}/profile-image` : undefined}
        onAddPress={handleAddItem} 
        hasItems={items && items.length > 0}
      />

      <WishlistContent
        items={items}
        baseSize={baseSize}
        isSelectionMode={isSelectionMode}
        selectedItems={selectedItems}
        onItemPress={handleItemPress}
        onAddItem={handleAddItem}
        onCancelSelection={cancelSelection}
        wishlistColor={wishlist?.color}
      />

      <WishlistActions
        wishlistId={id as string}
        menuVisible={menuVisible}
        onMenuClose={() => setMenuVisible(false)}
        onEnterSelectionMode={() => setIsSelectionMode(true)}
        refetchItems={refetch}
      />

      <ItemSelectionManager
        selectedItems={selectedItems}
        onItemsDeleted={cancelSelection}
        refetchItems={refetch}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  }
});