import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

interface Props {
  message?: string;
  animatedStyle?: any;
}

export default function SuccessBanner({ message, animatedStyle }: Props) {
  if (!message) return null;
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 50,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  text: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});