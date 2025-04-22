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
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.squareOption}
            onPress={handleCreateWishlist}
          >
            <Ionicons name="add-circle" size={36} color="white" />
            <Text style={styles.optionText}>Create List</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.squareOption}
            onPress={handleAddItem}
          >
            <Ionicons name="gift" size={36} color="white" />
            <Text style={styles.optionText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    backgroundColor: COLORS.background, 
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    width: '100%',
    height: '25%',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    height: '90%',
  },
  squareOption: {
    alignItems: 'center',
    justifyContent: 'center', 
    padding: 20,
    borderRadius: 12,
    width: '35%',
    aspectRatio: 1,
    borderColor: 'white',
    borderWidth: 1,
    backgroundColor: '#282828',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
});