import { ScrollView, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ListGrid from '../components/lists/ListGrid';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  
  const friendsLists = [
    { id: '1', title: "Sarah's Birthday", itemCount: 12 },
    { id: '2', title: "John's Wedding", itemCount: 8 },
    { id: '3', title: "Mom's ", itemCount: 5 },
    
  ];

  const personalLists = [
    { id: '1', title: "My Birthday", itemCount: 15 },
    { id: '2', title: "Christmas 2024", itemCount: 20 },
    { id: '3', title: "Home Decor", itemCount: 7 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top }
        ]}
      >
        <Text style={styles.userName}>Welcome, Steven!</Text>
        
        <ListGrid 
          title="Friends" 
          lists={friendsLists}
          maxItems={6}
        />
        
        <ListGrid 
          title="My Lists" 
          lists={personalLists}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    padding: 5,
  },
});