import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      // After logout, redirect to login
      router.replace('/auth/login');
    } catch (error) {
      Alert.alert('Logout Error', 'Failed to log out. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.settingsList}>
        <TouchableOpacity 
          style={[styles.settingItem, styles.logoutItem]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={24} color="#ef4444" />
          <Text style={[styles.settingText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    marginTop: 12,
    textAlign: 'center',
    color: COLORS.text.primary,
  },
  settingsList: {
    width: '100%',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardDark,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  settingText: {
    fontSize: 18,
    marginLeft: 12,
    flex: 1,
    color: COLORS.text.primary,
  },
  arrow: {
    marginLeft: 'auto',
  },
  logoutItem: {
    marginTop: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  logoutText: {
    color: '#ef4444',
  }
});