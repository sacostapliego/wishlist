import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/theme';

interface IconWithBadgeProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  badgeCount?: number;
  badgeColor?: string;
}

/**
 * Icon component with optional badge counter
 */
export function IconWithBadge({
  name,
  size = 24,
  color = 'white',
  badgeCount,
  badgeColor = COLORS.primary,
}: IconWithBadgeProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={name} size={size} color={color} />
      {badgeCount != null && badgeCount > 0 && (
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});