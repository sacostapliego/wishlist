import { View, Text, StyleSheet } from 'react-native';

export default function FriendsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Friends & Family Lists</Text>
      <Text>Lists shared with you will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});