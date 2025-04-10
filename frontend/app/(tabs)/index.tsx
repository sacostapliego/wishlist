import { ScrollView, Text, StyleSheet, SafeAreaView, View, TouchableOpacity, Image} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FriendsListGrid from '../components/lists/FriendsListGrid';
import PersonalListStack from '../components/lists/PersonalListStack';
import { COLORS, PROFILE_RIGHT_MARGIN } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { wishlistAPI } from '../services/api.wishlist';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { API_URL } from '../services/api';

// Define the shape of your wishlist data from the API
interface WishlistApiResponse {
  id: string;
  title: string;
  description?: string;
  color?: string;
  is_public: boolean;
  item_count: number;
  created_at: string;
  updated_at?: string;
  user_id: string;
}

// Define the shape of data used by the UI component
interface WishlistData {
  id: string;
  title: string;
  itemCount: number;
  color: string;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [personalLists, setPersonalLists] = useState<WishlistData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  // display name
  const displayName = user?.name || user?.username || 'Guest';
  
  const friendsLists = [
    { id: '1', title: "Sarah's Birthday", itemCount: 12, color: '#ff7f50' },
    { id: '2', title: "John's Wedding", itemCount: 8, color: '#20b2aa' },
    { id: '3', title: "Mom's Wish List", itemCount: 5, color: '#9370db' },
    { id: '4', title: "D's Christmas", itemCount: 3, color: '#f08080' },
    { id: '5', title: "S's Birthday", itemCount: 12, color: '#ff7f50' },
    { id: '6', title: "L's Wedding", itemCount: 8, color: '#20b2aa' },
    { id: '7', title: "M's Wish List", itemCount: 5, color: '#9370db' },
    { id: '8', title: "Dad's Christmas", itemCount: 3, color: '#f08080' },
  ];

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
          color: list.color || '#ff7f50' // Default color if none is specified
        }));
        
        setPersonalLists(formattedLists);
      } catch (error) {
        console.error('Failed to fetch wishlists:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchWishlists();
  }, [user]);


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.min(insets.top, 10) }
        ]}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.userName}>Welcome, {displayName}!</Text>
          <TouchableOpacity style={styles.profileButton}>
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
        
        <FriendsListGrid 
          title="Your Friends Lists" 
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
});