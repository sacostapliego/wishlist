import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../styles/theme';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
  const { logout, user } = useAuth();
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

  const navigateToEditProfile = () => {
    router.replace('/auth/edit-user');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.settingsList}>
        {/* Profile Settings Section */}
        <View>
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={navigateToEditProfile}
          >
            <Ionicons name="person" size={24} color={COLORS.text.primary} />
            <Text style={styles.settingText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        {/* Account Actions Section */}
        <View>
          <TouchableOpacity 
            style={[styles.settingItem, styles.logoutItem]} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={24} color="#ef4444" />
            <Text style={[styles.settingText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  settingsList: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.xs,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  settingText: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: SPACING.md,
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