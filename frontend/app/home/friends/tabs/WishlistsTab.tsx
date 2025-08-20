import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../../styles/theme';
import { WishlistData } from '../../../types/lists';
import EmptyState from '@/app/components/friends/EmptyState';
import { useRouter } from 'expo-router';

export default function WishlistsTab({ wishlists }: { wishlists: WishlistData[] }) {
  const router = useRouter();

  const renderImageOrIcon = (source?: string | null, size = 22) => {
    if (!source) return <Ionicons name="gift-outline" size={size} color="#fff" />;
    if (source.startsWith('http')) {
      return <Image source={{ uri: source }} style={{ width: size, height: size, tintColor: '#fff' }} resizeMode="contain" />;
    }
    return <Ionicons name={source as any} size={size} color="#fff" />;
  };

  if (!wishlists?.length) {
    return (
      <View style={styles.section}>
        <EmptyState text="No friends’ lists yet" sub="Ask a friend to share a public list" />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {wishlists.map(wishlist => (
        <TouchableOpacity
          key={wishlist.id}
          style={styles.card}
          onPress={() => router.push(`/shared/${wishlist.id}`)}
        >
          <View style={[styles.cardIconStrip, { backgroundColor: wishlist.color || 'rgba(255,255,255,0.15)' }]}>
            {renderImageOrIcon(wishlist.image, 28)}
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{wishlist.title}</Text>
              <Text style={styles.cardSub}>
                {wishlist.ownerName || wishlist.ownerUsername} • {wishlist.itemCount} item{wishlist.itemCount === 1 ? '' : 's'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 4,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    minHeight: 64,
    backgroundColor: 'transparent',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    
  },
  cardIconStrip: {
    width: 64,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  cardText: { flex: 1 },
  cardTitle: { color: COLORS.text.primary, fontWeight: '700', marginBottom: 2 },
  cardSub: { color: COLORS.text.secondary, fontSize: 12 },
});