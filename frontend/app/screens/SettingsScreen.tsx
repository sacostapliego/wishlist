import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.settingsList}>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="person" size={24} color="#64748b" />
          <Text style={styles.settingText}>Account</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748b" style={styles.arrow} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="notifications" size={24} color="#64748b" />
          <Text style={styles.settingText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748b" style={styles.arrow} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="color-palette" size={24} color="#64748b" />
          <Text style={styles.settingText}>Appearance</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748b" style={styles.arrow} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="help-circle" size={24} color="#64748b" />
          <Text style={styles.settingText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748b" style={styles.arrow} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.settingItem, styles.logoutItem]}>
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  settingsList: {
    width: '100%',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  settingText: {
    fontSize: 18,
    marginLeft: 12,
    flex: 1,
  },
  arrow: {
    marginLeft: 'auto',
  },
  logoutItem: {
    marginTop: 20,
  },
  logoutText: {
    color: '#ef4444',
  }
});