import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '@/app/styles/theme';
import { useAuth } from '@/app/context/AuthContext';
import { API_URL } from '@/app/services/api';
import { Header } from '@/app/components/layout/Header';
import { useLocalSearchParams } from 'expo-router';
import { PublicUserDetailsResponse } from '@/app/services/user';
import userAPI from '@/app/services/user';
import { SizeCards } from '@/app/components/features/profile/SizeCards';
import wishlistAPI from '@/app/services/wishlist';

interface PublicWishlist {
  id: string;
  title: string;
  description?: string;
  color?: string;
  item_count: number;
  image?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { userId, name: paramName, username: paramUsername } =
    useLocalSearchParams<{ userId?: string; name?: string; username?: string }>();

  const isSelf = !userId || userId === user?.id;
  const [publicUser, setPublicUser] = useState<PublicUserDetailsResponse | null>(null);
  const [publicWishlists, setPublicWishlists] = useState<PublicWishlist[]>([]);
  const [loadingWishlists, setLoadingWishlists] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (isSelf || !userId) {
        setPublicUser(null);
        setPublicWishlists([]);
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

  // Load public wishlists for non-self profiles
  useEffect(() => {
    let active = true;
    const loadWishlists = async () => {
      if (isSelf || !userId) {
        setPublicWishlists([]);
        return;
      }
      
      setLoadingWishlists(true);
      try {
        const wishlists = await wishlistAPI.getUserWishlists(userId);
        // Filter only public wishlists
        const publicOnly = wishlists.filter((w: any) => w.is_public);
        if (active) setPublicWishlists(publicOnly);
      } catch (error) {
        console.error('Error loading public wishlists:', error);
        if (active) setPublicWishlists([]);
      } finally {
        if (active) setLoadingWishlists(false);
      }
    };
    
    loadWishlists();
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

  const renderImageOrIcon = (source?: string | null, size = 22) => {
    if (!source) return <Ionicons name="gift-outline" size={size} color="#fff" />;
    if (source.startsWith('http')) {
      return <Image source={{ uri: source }} style={{ width: size, height: size, tintColor: '#fff' }} resizeMode="contain" />;
    }
    return <Ionicons name={source as any} size={size} color="#fff" />;
  };

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
              <TouchableOpacity onPress={() => router.push('/home/edit-preferences')} style={styles.actionButton}>
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

        {/* Public Wishlists Section - Only show for non-self profiles */}
        {!isSelf && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Public Wishlists</Text>
            {loadingWishlists ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Loading wishlists...</Text>
              </View>
            ) : publicWishlists.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No public wishlists</Text>
                <Text style={styles.emptySubtext}>This user hasn't shared any wishlists yet</Text>
              </View>
            ) : (
              <View style={styles.wishlistsContainer}>
                {publicWishlists.map(wishlist => (
                  <TouchableOpacity
                    key={wishlist.id}
                    style={styles.wishlistCard}
                    onPress={() => router.push(`/shared/${wishlist.id}`)}
                  >
                    <View style={[styles.wishlistIconStrip, { backgroundColor: wishlist.color || 'rgba(255,255,255,0.15)' }]}>
                      {renderImageOrIcon(wishlist.image, 28)}
                    </View>
                    <View style={styles.wishlistContent}>
                      <View style={styles.wishlistText}>
                        <Text style={styles.wishlistTitle}>{wishlist.title}</Text>
                        <Text style={styles.wishlistSub}>
                          {wishlist.item_count} item{wishlist.item_count === 1 ? '' : 's'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
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
  
  // Wishlist styles
  wishlistsContainer: { gap: SPACING.md },
  wishlistCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 4,
    overflow: 'hidden',
    minHeight: 64,
    backgroundColor: 'transparent',
  },
  wishlistContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: COLORS.cardDarkLight,
  },
  wishlistIconStrip: {
    width: 64,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  wishlistText: { flex: 1 },
  wishlistTitle: { color: COLORS.text.primary, fontWeight: '700', marginBottom: 2 },
  wishlistSub: { color: COLORS.text.secondary, fontSize: 12 },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardDark,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});