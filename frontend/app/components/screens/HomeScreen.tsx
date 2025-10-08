import { ScrollView, Text, StyleSheet, SafeAreaView, View, TouchableOpacity, Image} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import FriendsListGrid from '@/app/components/features/lists/FriendsListGrid';
import PersonalListStack from '@/app/components/features/lists/PersonalListStack';
import { COLORS, PROFILE_RIGHT_MARGIN, SPACING } from '@/app/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { wishlistAPI } from '@/app/services/wishlist';
import { useAuth } from '@/app/context/AuthContext';
import { useEffect, useState } from 'react';
import { API_URL } from '@/app/services/api';
import { WishlistApiResponse, WishlistData } from '@/app/types/lists';
import { useRefresh } from '@/app/context/RefreshContext';
import friendsAPI from '@/app/services/friends';
import { StatusBar } from 'expo-status-bar';
import Head from 'expo-router/head';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { refreshTimestamp } = useRefresh();
  const [personalLists, setPersonalLists] = useState<WishlistData[]>([]);
  const [friendsLists, setFriendsLists] = useState<WishlistData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  // display name
  const displayName = user?.name || user?.username || 'Guest';
  
  // Friends lists
  useEffect(() => {
    async function fetchFriendsLists() {
      if (!user) return;
      
      try {
        const friendsWishlists = await friendsAPI.getFriendsWishlists();
        
        // Format the API response to match WishlistData interface
        const formattedLists: WishlistData[] = friendsWishlists.map((list) => ({
          id: list.id,
          title: list.title,
          itemCount: list.item_count || 0,
          color: list.color || '#ff7f50',
          image: list.image, 
          ownerName: list.owner_name,
          ownerUsername: list.owner_username
        }));
        
        setFriendsLists(formattedLists);
      } catch (error) {
        console.error('Failed to fetch friends wishlists:', error);
        setFriendsLists([]);
      }
    }
    
    fetchFriendsLists();
  }, [user, refreshTimestamp]);

  // Personal lists
  useEffect(() => {
    async function fetchWishlists() {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const wishlists: WishlistApiResponse[] = await wishlistAPI.getWishlists();
        
        // Map API response to the format expected by PersonalListStack
        const formattedLists: WishlistData[] = wishlists.map((list: WishlistApiResponse) => ({
          id: list.id,
          title: list.title,
          itemCount: list.item_count || 0,
          color: list.color || '#ff7f50', // Default color if none is specified
          image: list.image, // Default image if none is specified
        }));
        
        setPersonalLists(formattedLists);
      } catch (error) {
        console.error('Failed to fetch wishlists:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchWishlists();
  }, [user, refreshTimestamp]);


  return (
    <SafeAreaView style={styles.container}>
      <Head>
        <meta name="theme-color" content={COLORS.background} />
      </Head>
      <StatusBar style="dark" backgroundColor={COLORS.background} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.min(insets.top, 10) }
        ]}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.userName}>Welcome, {displayName}!</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/home/profile')}>
              {user?.id && !imageLoadError ? (
                <Image 
                  source={{ uri: `${API_URL}users/${user.id}/profile-image` }} 
                  style={styles.profileImage} 
                  onError={(e) => {
                    setImageLoadError(true);
                  }}
                />
              ) : (
                <Ionicons 
                  name="person-circle-outline" 
                  size={48} 
                  color={COLORS.text.primary} 
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        <FriendsListGrid 
          title="Friends Lists" 
          lists={friendsLists}
          maxItems={6}
        />
        <PersonalListStack 
          title="My Lists" 
          lists={personalLists}
          containerStyle={{ marginTop: 10 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  profileButton: {
    padding: 7,
    marginRight: PROFILE_RIGHT_MARGIN,

  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileImage: {
    width: 55,
    height: 55,
    borderRadius: 202,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  addFriendButton: {
    padding: SPACING.xs,
  },
});