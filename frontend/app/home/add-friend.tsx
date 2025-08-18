import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../styles/theme';
import { Header } from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { friendsAPI } from '../services/friends';

export default function AddFriendScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const result = await friendsAPI.searchUser(searchQuery.trim());
      setSearchResult(result);
    } catch (error) {
      Alert.alert('Error', 'User not found');
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async () => {
    if (!searchResult) return;
    
    setIsAddingFriend(true);
    try {
      await friendsAPI.sendFriendRequest(searchResult.id);
      Alert.alert('Success', 'Friend request sent!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to send friend request');
    } finally {
      setIsAddingFriend(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Add Friend" onBack={() => router.back()} />
      
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username..."
            placeholderTextColor={COLORS.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={handleSearch}
            disabled={isSearching}
          >
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {searchResult && (
          <View style={styles.resultCard}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color={COLORS.text.secondary} />
              </View>
              <View>
                <Text style={styles.userName}>{searchResult.name || searchResult.username}</Text>
                <Text style={styles.userHandle}>@{searchResult.username}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddFriend}
              disabled={isAddingFriend}
            >
              <Text style={styles.addButtonText}>
                {isAddingFriend ? 'Adding...' : 'Add Friend'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  searchContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.cardDark,
    borderRadius: 8,
    padding: SPACING.sm,
    color: COLORS.text.primary,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: { color: COLORS.text.primary, fontWeight: '600' },
  userHandle: { color: COLORS.text.secondary, fontSize: 12 },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
});