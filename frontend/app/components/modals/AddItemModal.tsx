import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface AddModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddModal({ visible, onClose }: AddModalProps) {
  const router = useRouter();

  const handleCreateWishlist = () => {
    onClose(); // Close the modal first
    router.push('/home/create-wishlist'); // Navigate to the create wishlist page
  };

  const handleAddItem = () => {
    onClose(); // Close the modal first
    router.push('/home/add-item'); // Navigate to add item page
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.option}
            onPress={handleCreateWishlist}
          >
            <Ionicons name="add-circle" size={24} color="#0891b2" />
            <Text style={styles.optionText}>Create New List</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.option}
            onPress={handleAddItem}
          >
            <Ionicons name="gift" size={24} color="#0891b2" />
            <Text style={styles.optionText}>Add Item to List</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '100%',
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