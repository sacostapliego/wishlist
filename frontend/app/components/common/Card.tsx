import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../styles/theme';
import { commonStyles } from '../../styles/common';
import { CardProps } from '@/app/types/objects';

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

export default Card;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: SPACING.md,
  },
});