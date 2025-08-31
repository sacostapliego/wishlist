import React, { useState } from 'react';
import { SafeAreaView, useWindowDimensions, StyleSheet, Platform, View, TouchableOpacity, Text } from 'react-native'; // Added View, TouchableOpacity, Text
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING } from '../../styles/theme';
import { API_URL } from '../../services/api';
import { Header } from '../../components/layout/Header';
import { WishlistInfo } from '../../components/wishlist/WishlistInfo';
import { LoadingState } from '../../components/common/LoadingState';
import { useWishlistDetail } from '../../hooks/useWishListDetail';
import { useRefresh } from '../../context/RefreshContext';
import { SelectionHeader } from '../../components/wishlist/SelectionHeader';
import { WishlistActions } from '../../components/wishlist/WishlistActions';
import { ItemSelectionManager } from '../../components/wishlist/ItemSelectionManager';
import { WishlistContent } from '../../components/wishlist/WishlistContent';
import { WishlistListView } from '../../components/wishlist/WishlistListView';
import { EmptyState } from '../../components/layout/EmptyState';

export default function WishlistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { refreshTimestamp } = useRefresh();

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'bento'>('list'); // State for view mode

  const baseSize = Platform.OS === 'web' ? (420 / 2) : (width - (SPACING.md * 3) / 2);
  const { wishlist, items, isLoading, refetch } = useWishlistDetail(id as string, refreshTimestamp);

  const activeColor = wishlist?.color || COLORS.cardDark;

  const handleAddItem = () => {
    router.push({
      pathname: '/home/add-item',
      params: { wishlistId: id }
    });
  };

  const handleShowDeleteConfirmation = () => {
    if (selectedItems.length > 0) {
      setDeleteConfirmVisible(true);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(i => i !== itemId));
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
      router.push({
        pathname: `/home/lists/[id]/[item]`, // Dynamic path
        params: { id: id, item: item.id } // Pass wishlistId as 'id' and itemId as 'item'
      });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  const renderMainContent = () => {
    if (!items || items.length === 0) {
      return (
        <EmptyState
          message="No items in this wishlist yet"
          actionText="Add an item"
          onAction={handleAddItem}
        />
      );
    }

    if (viewMode === 'list') {
      return (
        <WishlistListView
          items={items}
          onItemPress={handleItemPress}
          isSelectionMode={isSelectionMode}
          selectedItems={selectedItems}
          wishlistColor={wishlist?.color}
        />
      );
    } else {
      return (
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
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={wishlist?.title || 'Wishlist'}
        onBack={() => router.back()}
        showOptions={!isSelectionMode}
        onOptionsPress={() => setMenuVisible(true)}
        rightIcon="ellipsis-vertical"
      />

      {isSelectionMode && (
        <SelectionHeader
          selectedCount={selectedItems.length}
          onCancelSelection={cancelSelection}
          onDeleteSelected={handleShowDeleteConfirmation}
        />
      )}

      <WishlistInfo
        username={user?.name || user?.username}
        description={wishlist?.description}
        profileImage={user?.id ? `${API_URL}users/${user.id}/profile-image` : undefined}
        onAddPress={handleAddItem}
        hasItems={items && items.length > 0}
        onProfilePress={() =>
          router.push({
            pathname: '/home/profile',
            params: {
              userId: user?.id,
              name: user?.name || undefined,
              username: user?.username || undefined,
            },
          })
        }
      />

      {!isSelectionMode && items && items.length > 0 && (
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'list' && { ...styles.activeToggleButton, backgroundColor: activeColor, borderColor: activeColor },,
            ]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list-outline" size={20} color={viewMode === 'list' ? COLORS.white : COLORS.text.secondary} />
            <Text style={[styles.toggleButtonText, viewMode === 'list' && styles.activeToggleButtonText]}>List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'bento' && { ...styles.activeToggleButton, backgroundColor: activeColor, borderColor: activeColor },
            ]}
            onPress={() => setViewMode('bento')}
          >
            <Ionicons name="grid-outline" size={20} color={viewMode === 'bento' ? COLORS.white : COLORS.text.secondary} />
            <Text style={[styles.toggleButtonText, viewMode === 'bento' && styles.activeToggleButtonText]}>Grid</Text>
          </TouchableOpacity>
        </View>
      )}

      {renderMainContent()}

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
        confirmDeleteVisible={deleteConfirmVisible}
        setConfirmDeleteVisible={setDeleteConfirmVisible}
      />
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
  activeToggleButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
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