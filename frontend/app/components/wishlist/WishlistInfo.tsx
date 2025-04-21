import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../styles/theme';
import { WishlistInfoProps } from '@/app/types/wishlist';

export const WishlistInfo = ({ 
  username, 
  description, 
  profileImage,
  onAddPress,
  hasItems = false,
}: WishlistInfoProps) => {
  const hasDescription = description && description.trim().length > 0;
  
  return (
    <View style={styles.wishlistInfo}>
      <View style={styles.topRow}>
        <View style={styles.userInfo}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Ionicons name="person" size={18} color="#fff" />
            </View>
          )}
          <Text style={styles.username}>{username || 'User'}</Text>
        </View>
        
        {/* Add button - only shown when there are items */}
        {onAddPress && hasItems ? (
          <TouchableOpacity onPress={onAddPress} style={styles.actionButton}>
            <Ionicons name="add-circle" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {hasDescription ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wishlistInfo: {
    padding: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  actionButton: {
    padding: SPACING.xs,
  }
});