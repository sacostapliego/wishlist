import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../styles/theme';
import { Header } from '../components/layout/Header';
import { EmptyState } from '../components/layout/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { Card } from '../components/ui/Card';
import { friendsAPI, FriendRequestInfo } from '../services/friends';

export default function FriendRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<FriendRequestInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRequests = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const friendRequests = await friendsAPI.getFriendRequests();
      setRequests(friendRequests);
    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
      Alert.alert('Error', 'Failed to load friend requests');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRefresh = () => {
    fetchRequests(true);
  };

  const handleAccept = async (requestId: string) => {
    try {
      await friendsAPI.acceptFriendRequest(requestId);
      Alert.alert('Success', 'Friend request accepted!');
      // Remove from list
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const handleDecline = async (requestId: string) => {
    Alert.alert(
      'Decline Friend Request',
      'Are you sure you want to decline this friend request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendsAPI.declineFriendRequest(requestId);
              // Remove from list
              setRequests(prev => prev.filter(req => req.id !== requestId));
            } catch (error) {
              console.error('Failed to decline friend request:', error);
              Alert.alert('Error', 'Failed to decline friend request');
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Friend Requests" onBack={() => router.back()} />
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Friend Requests" onBack={() => router.back()} />

      {requests.length === 0 ? (
        <EmptyState
          message="No friend requests"
        />
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          <Text style={styles.subtitle}>
            {requests.length} pending {requests.length === 1 ? 'request' : 'requests'}
          </Text>

          {requests.map((request) => (
            <Card key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={24} color={COLORS.text.primary} />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>
                      {request.name || request.username}
                    </Text>
                    <Text style={styles.userUsername}>@{request.username}</Text>
                    <Text style={styles.requestTime}>
                      {new Date(request.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.declineButton]}
                  onPress={() => handleDecline(request.id)}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.acceptButton]}
                  onPress={() => handleAccept(request.id)}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  subtitle: {
    color: COLORS.text.secondary,
    fontSize: 16,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  requestCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.cardDark,
  },
  requestHeader: {
    marginBottom: SPACING.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  requestTime: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  acceptButton: {
  },
  declineButton: {
    backgroundColor: COLORS.error,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});