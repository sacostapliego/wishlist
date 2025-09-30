import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../../styles/theme';
import EmptyState from '@/app/components/features/friends/EmptyState';
import Avatar from '@/app/components/features/friends/Avatar';
import { FriendRequestInfo } from '../../../services/friends';

export default function RequestsTab({
  requests,
  onAccept,
  onDecline,
}: {
  requests: FriendRequestInfo[];
  onAccept: (id: string) => void | Promise<void>;
  onDecline: (id: string) => void | Promise<void>;
}) {
  if (!requests?.length) {
    return (
      <View style={styles.section}>
        <EmptyState text="No pending requests" sub="Friend requests sent to you will appear here" />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {requests.map(request => (
        <View key={request.id} style={styles.card}>
          <Avatar userId={request.user_id} fallbackIcon="person-add-outline" />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{request.name || request.username}</Text>
            <Text style={styles.cardSub}>@{request.username}</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, styles.accept]} onPress={() => onAccept(request.id)}>
              <Ionicons name="checkmark" size={16} color="#0a0" />
              <Text style={styles.actionText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.decline]} onPress={() => onDecline(request.id)}>
              <Ionicons name="close" size={16} color="#a00" />
              <Text style={styles.actionText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

/*
If you already have a friend-requests hook or functions elsewhere,
you can import and use them here directly instead of passing props:

  // Replace the props with your own hook
  import useFriendRequests from '<<your-path>>'; // update this path
  export default function RequestsTab() {
    const { requests, acceptFriendRequest, declineFriendRequest } = useFriendRequests();
    ...
    onPress={() => acceptFriendRequest(request.id)}
    onPress={() => declineFriendRequest(request.id)}
  }

This keeps the logic contained within the tab.
*/

const styles = StyleSheet.create({
  section: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.md, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: SPACING.sm,
  },
  cardText: { flex: 1 },
  cardTitle: { color: COLORS.text.primary, fontWeight: '700', marginBottom: 2 },
  cardSub: { color: COLORS.text.secondary, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  accept: {}, decline: {},
  actionText: { color: COLORS.text.primary, fontWeight: '600' },
});