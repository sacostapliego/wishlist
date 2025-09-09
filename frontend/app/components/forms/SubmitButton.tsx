import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import { AUTH_COLORS } from '../../styles/theme';

interface Props {
  isLoading: boolean;
  didSucceed: boolean;
  onPress: () => void;
  disabled?: boolean;
  buttonScaleStyle: any;
  successScale: any;
  idleLabel?: string;
  successLabel?: string;
  successIcon?: string;
}

export function SubmitButton({
  isLoading,
  didSucceed,
  onPress,
  disabled,
  buttonScaleStyle,
  successScale,
  idleLabel = 'Submit',
  successLabel = 'Success',
  successIcon = 'checkmark-circle',
}: Props) {
  return (
    <Animated.View style={buttonScaleStyle}>
      <TouchableOpacity
        style={[
          styles.button,
          didSucceed && styles.buttonSuccess,
          (isLoading || disabled) && styles.buttonDisabled,
        ]}
        onPress={onPress}
        disabled={isLoading || disabled}
        activeOpacity={0.85}
      >
        {isLoading && !didSucceed && <ActivityIndicator color="white" size="small" />}
        {!isLoading && !didSucceed && <Text style={styles.buttonText}>{idleLabel}</Text>}
        {didSucceed && (
          <Animated.View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              transform: [
                {
                  scale: successScale.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                },
              ],
            }}
          >
            <Ionicons name={successIcon as any} size={22} color="white" style={{ marginRight: 6 }} />
            <Text style={styles.buttonText}>{successLabel}</Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: AUTH_COLORS.primary,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonSuccess: { backgroundColor: AUTH_COLORS.primary },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});