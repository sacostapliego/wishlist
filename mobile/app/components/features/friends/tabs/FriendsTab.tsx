import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING } from '@/app/styles/theme';
import EmptyState from '@/app/components/features/friends/EmptyState';
import Avatar from '@/app/components/features/friends/Avatar';
import { FriendInfo } from '@/app/services/friends';

export default function FriendsTab({ friends }: { friends: FriendInfo[] }) {
  const router = useRouter();

  if (!friends?.length) {
    return (
      <View style={styles.section}>
        <EmptyState text="No friends yet" sub="Send a friend request to get started">
          <TouchableOpacity style={styles.cta} onPress={() => router.push('/home/add-friend')}>
            <Ionicons name="person-add-outline" size={18} color="#fff" />
            <Text style={styles.ctaText}>Add Friend</Text>
          </TouchableOpacity>
        </EmptyState>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {friends.map(friend => (
        <TouchableOpacity
          key={friend.id}
          style={styles.card}
          onPress={() =>
            router.push({
              pathname: '/home/friends/[userId]',
              params: { userId: friend.id, name: friend.name, username: friend.username },
            })
          }
        >
          <Avatar userId={friend.id} />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{friend.name || friend.username}</Text>
            <Text style={styles.cardSub}>@{friend.username}</Text>
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
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.md, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: SPACING.sm,
  },
  cardText: { flex: 1 },
  cardTitle: { color: COLORS.text.primary, fontWeight: '700', marginBottom: 2 },
  cardSub: { color: COLORS.text.secondary, fontSize: 12 },
  cta: {
    marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: COLORS.primary,
  },
  ctaText: { color: '#fff', fontWeight: '700' },
});