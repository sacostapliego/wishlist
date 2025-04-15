import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../styles/theme';

interface DeviceFrameProps {
  children: React.ReactNode;
}

export default function DeviceFrame({ children }: DeviceFrameProps) {
  // Only apply the frame on web platform
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.frame}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    height: '100%',
},
  frame: {
    width: 430,
    height: 932,
    overflow: 'hidden',
    borderColor: '#000',
  },
});