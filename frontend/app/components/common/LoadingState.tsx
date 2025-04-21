import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../../styles/theme';

type LoadingStateProps = {
  fullscreen?: boolean;
  size?: 'small' | 'large';
  color?: string;
};

export const LoadingState = ({ 
  fullscreen = true, 
  size = 'large',
  color = COLORS.primary
}: LoadingStateProps) => {
  return (
    <View style={[styles.loadingContainer, fullscreen && styles.fullscreen]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

export default LoadingState;

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullscreen: {
    flex: 1,
  },
});