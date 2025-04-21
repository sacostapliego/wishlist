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

export default Section;

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
});