import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../services/api';
import { Header } from '../components/layout/Header';
import { useLocalSearchParams } from 'expo-router';


export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { userId, name: paramName, username: paramUsername } = useLocalSearchParams<{ userId?: string; name?: string; username?: string }>();

  const viewedUserId = userId || user?.id || null;
  const isSelf = !userId || userId === user?.id;

  // Keep sizes/preferences as dummy data for now
  const sizes = { shoe: '10 US', shirt: 'L', pants: '32x32', hat: 'M' };
  const preferences = {
    favoriteStores: ['Nike', 'Uniqlo', 'Target'],
    interests: ['RPG games', 'Coffee', 'Hiking'],
    favoriteColors: ['Navy', 'Forest Green', '#FF7F50'],
    platforms: ['PlayStation', 'PC'],
  };

  const profileImage = viewedUserId ? `${API_URL}users/${viewedUserId}/profile-image` : null;
  const displayName = isSelf
    ? (user?.name || user?.username || 'Guest')
    : (paramName || paramUsername || 'User');

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Profile" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <View style={styles.avatarWrapper}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={42} color={COLORS.text.secondary} />
              </View>
            )}
          </View>
          <Text style={styles.name}>{displayName}</Text>
          {!isSelf && paramUsername ? <Text style={styles.username}>@{paramUsername}</Text> : null}
          {isSelf && user?.username ? <Text style={styles.username}>@{user.username}</Text> : null}

          {isSelf && (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => router.push('/auth/edit-user')} style={styles.actionButton}>
                <Ionicons name="create-outline" size={18} color="#fff" />
                <Text style={styles.actionText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sizes</Text>
          <View style={styles.card}>
            <InfoRow label="Shoe" value={sizes.shoe} />
            <InfoRow label="Shirt" value={sizes.shirt} />
            <InfoRow label="Pants" value={sizes.pants} />
            <InfoRow label="Hat" value={sizes.hat} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <InfoRow label="Favorite Stores" value={preferences.favoriteStores.join(', ')} />
            <InfoRow label="Interests" value={preferences.interests.join(', ')} />
            <InfoRow label="Favorite Colors" value={preferences.favoriteColors.join(', ')} />
            <InfoRow label="Platforms" value={preferences.platforms.join(', ')} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.lg },
  headerCard: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 22, fontWeight: 'bold', color: COLORS.text.primary, marginTop: SPACING.xs },
  username: { fontSize: 14, color: COLORS.text.secondary, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 10, marginTop: SPACING.md },
  actionButton: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontWeight: '600' },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { color: COLORS.text.primary, fontWeight: 'bold', fontSize: 16, marginBottom: SPACING.sm },
  card: { backgroundColor: COLORS.cardDark, borderRadius: 12, padding: SPACING.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, gap: 12 },
  rowLabel: { color: COLORS.text.secondary },
  rowValue: { color: COLORS.text.primary, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
});