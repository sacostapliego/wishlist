import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { commonStyles } from '@/app/styles/common';
import { SPACING } from '../../styles/theme';

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  showTitle?: boolean;
}

/**
 * A reusable section component with an optional title
 */
export function Section({ 
  title, 
  children, 
  containerStyle, 
  titleStyle,
  showTitle = true
}: SectionProps) {
  return (
    <View style={[styles.container, containerStyle]}>
    {showTitle && title && <Text style={[commonStyles.sectionTitle, titleStyle]}>{title}</Text>}
    {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
});