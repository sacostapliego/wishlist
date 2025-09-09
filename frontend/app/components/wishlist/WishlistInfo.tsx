import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, COLORS } from '@/app/styles/theme';
import { WishlistInfoProps } from '@/app/types/wishlist';

export const WishlistInfo = ({ 
  username, 
  description, 
  profileImage,
  onAddPress,
  hasItems = false,
  onProfilePress,
  showAddFriend = false,
  onAddFriend,
  isGuest = false
}: WishlistInfoProps) => {
  const hasDescription = description && description.trim().length > 0;
  const hasActionButtons = (showAddFriend && onAddFriend) || (onAddPress && hasItems);
  
  return (
    <View style={styles.wishlistInfo}>
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={onProfilePress}
          disabled={!onProfilePress}
          style={[
            styles.userInfo,
            !hasActionButtons && !hasDescription && styles.userInfoNoMargin
          ]}
          activeOpacity={0.7}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Ionicons name="person" size={18} color="#fff" />
            </View>
          )}
          <Text style={styles.username}>{username || 'User'}</Text>
        </TouchableOpacity>

        {hasActionButtons && (
          <View style={styles.actionButtons}>
            {/* Add Friend button - shown when showAddFriend is true */}
            {showAddFriend && onAddFriend && (
              <TouchableOpacity onPress={onAddFriend} style={styles.addFriendButton}>
                <Ionicons name="person-add-outline" size={20} color="#fff" />
                <Text style={styles.addFriendText}>Add Friend</Text>
              </TouchableOpacity>
            )}

            {/* Add item button - only shown when there are items and onAddPress exists */}
            {onAddPress && hasItems && (
              <TouchableOpacity onPress={onAddPress} style={styles.actionButton}>
                <Ionicons name="add-circle-outline" size={28} color={'white'} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      
      {hasDescription && (
        <Text style={styles.description}>{description}</Text>
      )}
    </View>
  );
};

export default WishlistInfo;

const styles = StyleSheet.create({
  wishlistInfo: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48, // Ensure consistent height
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    flex: 1,
  },
  userInfoNoMargin: {
    marginBottom: 0,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: SPACING.md,
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.xs,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  addFriendText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});