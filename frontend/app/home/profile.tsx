import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../services/api';
import { Header } from '../components/layout/Header';
import { useLocalSearchParams } from 'expo-router';
import { PublicUserDetailsResponse } from '../services/user';
import userAPI from '../services/user';
import { SizeCards } from '../components/features/profile/SizeCards';


export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { userId, name: paramName, username: paramUsername } =
    useLocalSearchParams<{ userId?: string; name?: string; username?: string }>();

  const isSelf = !userId || userId === user?.id;
  const [publicUser, setPublicUser] = useState<PublicUserDetailsResponse | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (isSelf || !userId) {
        setPublicUser(null);
        return;
      }
      try {
        const data = await userAPI.getPublicUserDetails(userId);
        if (active) setPublicUser(data);
      } catch {
        if (active) setPublicUser(null);
      }
    };
    load();
    return () => { active = false; };
  }, [userId, isSelf]);

  const target = isSelf ? user : publicUser;

  const sizeValues = {
    shoe_size: target?.shoe_size,
    shirt_size: target?.shirt_size,
    pants_size: target?.pants_size,
    hat_size: target?.hat_size,
    ring_size: target?.ring_size,
    dress_size: target?.dress_size,
    jacket_size: target?.jacket_size,
  };


  const profileImage = target?.id ? `${API_URL}users/${target.id}/profile-image` : null;
  const displayName = isSelf
    ? (user?.name || user?.username || 'Guest')
    : (paramName || target?.name || paramUsername || target?.username || 'User');

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
                <Text style={styles.actionText}>Edit Preferences</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sizes</Text>
          <SizeCards values={sizeValues} />
        </View>
      </ScrollView>
    </SafeAreaView>
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