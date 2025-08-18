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
          style={[styles.card, { borderColor: wishlist.color || COLORS.cardDark }]}
          onPress={() => router.push(`/shared/${wishlist.id}`)}
        >
          <View style={styles.cardIcon}>{renderImageOrIcon(wishlist.image, 22)}</View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{wishlist.title}</Text>
            <Text style={styles.cardSub}>
              {wishlist.ownerName || wishlist.ownerUsername} • {wishlist.itemCount} item{wishlist.itemCount === 1 ? '' : 's'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: SPACING.sm,
  },
  cardIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardText: { flex: 1 },
  cardTitle: { color: COLORS.text.primary, fontWeight: '700', marginBottom: 2 },
  cardSub: { color: COLORS.text.secondary, fontSize: 12 },
});