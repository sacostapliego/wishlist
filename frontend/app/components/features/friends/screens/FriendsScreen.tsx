import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SPACING, COLORS } from '@/app/styles/theme';

import TabButton from '@/app/components/features/friends/TabButton';
import { useFriendsData } from '@/app/hooks/useFriendsData';
import WishlistsTab from '../tabs/WishlistsTab';
import FriendsTab from '../tabs/FriendsTab';
import RequestsTab from '../tabs/RequestsTab';

import Header from '@/app/components/layout/Header';

type TabKey = 'wishlists' | 'friends' | 'requests';

export default function FriendsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('wishlists');

  const { wishlists, friends, requests, refreshing, reload, accept, decline } = useFriendsData();

  return (
    <View style={styles.container}>
      <Header
        title="Friends & Family"
        onBack={() => router.back()}
        showOptions
        rightIcon="person-add-outline"
        onOptionsPress={() => router.push('/home/add-friend')}
      />

      <View style={styles.tabs}>
        <TabButton label="Wishlists" icon="gift-outline" active={activeTab === 'wishlists'} onPress={() => setActiveTab('wishlists')} />
        <TabButton label="Friends" icon="people-outline" active={activeTab === 'friends'} onPress={() => setActiveTab('friends')} />
        <TabButton label="Requests" icon="person-add-outline" active={activeTab === 'requests'} onPress={() => setActiveTab('requests')} />
      </View>

      <ScrollView
        style={styles.body}
        refreshControl={<RefreshControl tintColor={COLORS.text.secondary} refreshing={refreshing} onRefresh={reload} />}
      >
        {activeTab === 'wishlists' && <WishlistsTab wishlists={wishlists} />}
        {activeTab === 'friends' && <FriendsTab friends={friends} />}
        {activeTab === 'requests' && <RequestsTab requests={requests} onAccept={accept} onDecline={decline} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text.primary },
  tabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    justifyContent: 'center',
  },
  body: { flex: 1 },
});