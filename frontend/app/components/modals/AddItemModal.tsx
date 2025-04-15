import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/app/styles/theme';

interface AddModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddModal({ visible, onClose }: AddModalProps) {
  const router = useRouter();
  
  if (!visible) return null;

  const handleCreateWishlist = () => {
    onClose(); // Close the modal first
    router.push('/home/create-wishlist'); // Navigate to the create wishlist page
  };

  const handleAddItem = () => {
    onClose(); // Close the modal first
    router.push('/home/add-item'); // Navigate to add item page
  };

  return (
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
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    backgroundColor: COLORS.background, 
    padding: 20,
    borderRadius: 12,
    width: '100%',
    borderColor: COLORS.cardDark,
    borderWidth: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardDark, 
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  optionText: {
    fontSize: 18,
    marginLeft: 12,
    color: COLORS.text.primary, 
  },
});