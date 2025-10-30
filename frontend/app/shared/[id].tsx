import React, { useState, useEffect } from 'react';
import { SafeAreaView, useWindowDimensions, StyleSheet, Platform, View, TouchableOpacity, Text, Alert, Modal, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../styles/theme';
import { Header } from '../components/layout/Header';
import { WishlistInfo } from '../components/features/wishlist/WishlistInfo';
import { LoadingState } from '../components/common/LoadingState';
import { usePublicWishlistDetail } from '../hooks/usePublicWishlistDetail';
import { useRefresh } from '../context/RefreshContext';
import { WishlistContent } from '../components/features/wishlist/WishlistContent';
import { WishlistListView } from '../components/features/wishlist/WishlistListView';
import { EmptyState } from '../components/layout/EmptyState';
import { friendsAPI } from '../services/friends';
import { useAuth } from '../context/AuthContext';
import { WishlistFilters, SortOption } from '../components/features/wishlist/WishlistFilters';
import Head from 'expo-router/head';
import SharedWishlistHead from './components/SharedWishlistHead';

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
  const { refreshTimestamp } = useRefresh();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'bento' | 'list'>('list');
  const [isAlreadyFriend, setIsAlreadyFriend] = useState(false);
  const [isCheckingFriendship, setIsCheckingFriendship] = useState(true);
  const [optionsVisible, setOptionsVisible] = useState(false);

  const isAuthenticated = !!user;
  const isGuest = !isAuthenticated;

  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [selectedItemForClaim, setSelectedItemForClaim] = useState<any>(null);

  const { wishlist, items, ownerDisplayInfo, isLoading, refetch } = usePublicWishlistDetail(id as string, refreshTimestamp);

  const baseSize = Platform.OS === 'web' ? (420 / 2) : (width - (SPACING.md * 3) / 2);
  const activeColor = wishlist?.color || COLORS.cardDark;

  // Check if user is already friends with the wishlist owner
  useEffect(() => {
    const checkFriendshipStatus = async () => {
      if (!wishlist?.user_id || !user?.id) {
        setIsCheckingFriendship(false);
        return;
      }

      // Don't show add friend for own wishlist
      if (wishlist.user_id === user.id) {
        setIsAlreadyFriend(true);
        setIsCheckingFriendship(false);
        return;
      }

      try {
        const friendsWishlists = await friendsAPI.getFriendsWishlists();
        // Consider owner_id, or fall back to username
        const isFriend =
          friendsWishlists.some(w => w.owner_id === wishlist.user_id) ||
          friendsWishlists.some(w => w.owner_username === ownerDisplayInfo?.username);
        setIsAlreadyFriend(isFriend);
      } catch (error) {
        console.error('Failed to check friendship status:', error);
        setIsAlreadyFriend(false);
      } finally {
        setIsCheckingFriendship(false);
      }
    };

    if (wishlist && ownerDisplayInfo) {
      checkFriendshipStatus();
    }
  }, [wishlist, ownerDisplayInfo, user]);

  const handleAddFriend = async () => {
    if (!wishlist?.user_id) {
      Alert.alert('Error', 'Unable to add friend');
      return;
    }

    try {
      await friendsAPI.sendFriendRequest(wishlist.user_id);
      Alert.alert('Success', 'Friend request sent!');
      setIsAlreadyFriend(true); // Optimistically update UI
    } catch (error) {
      console.error('Friend request error:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const handleItemPress = (pressedItem: WishlistItem) => {
    if (id && pressedItem && pressedItem.id) {
      router.push({
        pathname: `/shared/[id]/[item]`,
        params: { id: id, item: pressedItem.id }
      });
    } else {
      console.warn("Missing id or item.id for navigation in shared view");
    }
  };

  const handleSortChange = (sortOption: SortOption) => {
    setSortBy(sortOption);
    // Apply sorting logic to items
  };

  const handleItemClaimed = () => {
    refetch(); // Refresh the wishlist data
    setSelectedItemForClaim(null);
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
          onAddItem={() => {}}
          onCancelSelection={() => {}}
        />
      );
    } else {
      return (
        <WishlistListView
          items={items}
          onItemPress={handleItemPress}
          isSelectionMode={false}
          selectedItems={[]}
          wishlistColor={wishlist?.color}
        />
      );
    }
  };

  // Determine if we should show the Add Friend button
  const shouldShowAddFriend = !isGuest &&
    !isCheckingFriendship &&
    !isAlreadyFriend &&
    wishlist?.user_id !== user?.id;

  // For guests, we can show a disabled Add button or no button at all
  const showOptionsIcon = isGuest || shouldShowAddFriend;

  const handleCreateAccount = () => router.push('/auth/register');

  return (
    <SafeAreaView style={styles.container}>

      <Head>
        <style>{`body { background: #141414 !important; }`}</style>
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content={COLORS.background} />
      </Head>

      <Header
        title={wishlist?.title || 'Shared Wishlist'}
        {...(isAuthenticated
          ? { onBack: () => (router.canGoBack() ? router.back() : router.replace('/')) }
          : {})}
        showOptions={showOptionsIcon}
        onOptionsPress={() => setOptionsVisible(true)}
        rightIcon="ellipsis-vertical"
      />

      <SharedWishlistHead
        id={id as string}
        title={wishlist?.title}
        description={wishlist?.description}
        wishlistImage={wishlist?.image}
        profileImageUrl={ownerDisplayInfo?.profileImageUrl}
        ownerName={ownerDisplayInfo?.name}
      />

      <WishlistInfo
        username={ownerDisplayInfo?.name}
        description={wishlist?.description}
        profileImage={ownerDisplayInfo?.profileImageUrl}
        showAddFriend={shouldShowAddFriend}
        onAddFriend={handleAddFriend}
        isGuest={isGuest}
        onProfilePress={() => {
          if (wishlist?.user_id) {
            router.push({
              pathname: '/shared/profile/[userId]',
              params: { userId: wishlist.user_id },
            });
          }
        }}
      />
      
{/* Sadly, removed the bento grid for now */}

{/*       
      {items && items.length > 0 && (
        <View style={styles.viewToggleContainer}>
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
        </View>
      )} 
       
*/}

      {renderMainContent()}

      {showOptionsIcon && (
        <Modal
          transparent
          visible={optionsVisible}
          animationType="fade"
          onRequestClose={() => setOptionsVisible(false)}
        >
          <Pressable style={styles.optionsOverlay} onPress={() => setOptionsVisible(false)}>
            <View style={styles.optionsMenuContainer}>
              {isGuest ? (
                <TouchableOpacity
                  style={styles.optionsMenuItem}
                  onPress={() => {
                    setOptionsVisible(false);
                    handleCreateAccount();
                  }}
                >
                  <Ionicons name="log-in-outline" size={22} color={COLORS.text.primary} />
                  <Text style={styles.optionsMenuText}>Create an account</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.optionsMenuItem}
                  onPress={() => {
                    setOptionsVisible(false);
                    handleAddFriend();
                  }}
                >
                  <Ionicons name="person-add-outline" size={22} color={COLORS.text.primary} />
                  <Text style={styles.optionsMenuText}>Add Friend</Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Modal>
      )}
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
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsMenuContainer: {
    width: 260,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm,
  },
  optionsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  optionsMenuText: {
    marginLeft: SPACING.md,
    fontSize: 16,
    color: COLORS.text.primary,
  },
});