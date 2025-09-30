import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../styles/theme';

interface GradientBorderInputProps extends TextInputProps {
  colors?: readonly [string, string, ...string[]];
  placeholderTextColor?: string;
}

const GradientBorderInput = ({ 
  colors = [COLORS.primary, COLORS.secondary] as const,
  placeholderTextColor = COLORS.inactive,
  style,
  ...props 
}: GradientBorderInputProps) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={placeholderTextColor}
        {...props}
      />
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 1.5 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 56,
    marginBottom: 16,
  },
  input: {
    height: '100%',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background,
    zIndex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 8,
    margin: -2,
    zIndex: -1,
  }
});

export default GradientBorderInput;