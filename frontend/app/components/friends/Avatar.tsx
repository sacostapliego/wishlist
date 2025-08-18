import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../services/api';

export default function Avatar({
  userId,
  size = 38,
  fallbackIcon = 'person-circle-outline' as const,
}: {
  userId?: string;
  size?: number;
  fallbackIcon?: any;
}) {
  const [error, setError] = useState(false);
  const radius = size / 2;

  if (!userId || error) {
    return (
      <View style={[styles.icon, { width: size, height: size, borderRadius: radius }]}>
        <Ionicons name={fallbackIcon} size={size * 0.58} color="#fff" />
      </View>
    );
  }

  return (
    <View style={[styles.icon, { width: size, height: size, borderRadius: radius }]}>
      <Image
        source={{ uri: `${API_URL}users/${userId}/profile-image` }}
        style={{ width: size, height: size, borderRadius: radius }}
        onError={() => setError(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});