// frontend/app/screens/AddScreen.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AddScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New</Text>
      
      <TouchableOpacity style={styles.option}>
        <Ionicons name="add-circle" size={24} color="#0891b2" />
        <Text style={styles.optionText}>Create New List</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.option}>
        <Ionicons name="gift" size={24} color="#0891b2" />
        <Text style={styles.optionText}>Add Item to List</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  optionText: {
    fontSize: 18,
    marginLeft: 12,
  },
});