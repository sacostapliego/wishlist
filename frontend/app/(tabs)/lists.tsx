import { View, Text, StyleSheet, FlatList, Button, StatusBar } from 'react-native';

const sampleLists = [
  { id: '1', name: 'Birthday Wishlist' },
  { id: '2', name: 'Christmas Ideas' },
  { id: '3', name: 'Home Decor' },
];

export default function ListsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Lists</Text>
      
      <FlatList
        data={sampleLists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.listName}>{item.name}</Text>
          </View>
        )}
        style={styles.list}
      />
    </View>

    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  list: {
    width: '100%',
  },
  listItem: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  listName: {
    fontSize: 18,
  },
});