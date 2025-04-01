import { ScrollView, Text, StyleSheet, SafeAreaView, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FriendsListGrid from '../components/lists/FriendsListGrid';
import PersonalListStack from '../components/lists/PersonalListStack';
import { COLORS } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  
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

  const personalLists = [
    { id: '1', title: "Sarah's Birthday", itemCount: 12, color: '#ff7f50' },
    { id: '2', title: "John's Wedding", itemCount: 8, color: '#20b2aa' },
    { id: '3', title: "Mom's Wish List", itemCount: 5, color: '#9370db' },
    { id: '4', title: "D's Christmas", itemCount: 3, color: '#f08080' },
    { id: '5', title: "S's Birthday", itemCount: 12, color: '#ff7f50' },
    { id: '6', title: "L's Wedding", itemCount: 8, color: '#20b2aa' },
    { id: '7', title: "M's Wish List", itemCount: 5, color: '#9370db' },
    { id: '8', title: "Dad's Christmas", itemCount: 3, color: '#f08080' },
  ];

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.min(insets.top, 10) }
        ]}
      >
        <View style= {styles.headerContainer}>
          <Text style={styles.userName}>Welcome, Steven!</Text>
          <TouchableOpacity style = {styles.profileButton}>
            <Ionicons name="person-circle-outline" size={48} color={COLORS.text.primary} style={styles.profileButton} />
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
          containerStyle={{ marginTop:10 }}
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
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
});