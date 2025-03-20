import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '../../styles/theme';
import { commonStyles } from '../../styles/common';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  color?: string;
}

/**
 * A reusable card component with consistent styling
 */
export function Card({ children, style, color = COLORS.card }: CardProps) {
  return (
    <View 
      style={[
        styles.card, 
        { backgroundColor: color },
        commonStyles.shadow,
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: SPACING.md,
  },
});