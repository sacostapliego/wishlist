import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  ActivityIndicator 
} from 'react-native';
import { COLORS, SPACING } from '../../styles/theme';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'transparent';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Reusable button component with multiple variants
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  disabled = false,
  loading = false,
}: ButtonProps) {
  // Button styles based on variant
  const buttonStyles = {
    primary: {
      backgroundColor: COLORS.primary,
      borderWidth: 0,
    },
    secondary: {
      backgroundColor: COLORS.secondary,
      borderWidth: 0,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: COLORS.primary,
    },
    transparent: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
  };

  // Text color based on variant
  const textColor = {
    primary: 'white',
    secondary: 'white',
    outline: COLORS.primary,
    transparent: 'white',
  };

  // Size styles
  const sizeStyles = {
    small: {
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.md,
      fontSize: 14,
    },
    medium: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      fontSize: 16,
    },
    large: {
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.xl,
      fontSize: 18,
    },
  };

  // Icon size based on button size
  const iconSize = {
    small: 16,
    medium: 20,
    large: 24,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        buttonStyles[variant],
        sizeStyles[size],
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor[variant]} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={iconSize[size]}
              color={textColor[variant]}
              style={styles.iconLeft}
            />
          )}
          <Text
            style={[
              styles.text,
              { color: textColor[variant], fontSize: sizeStyles[size].fontSize },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={iconSize[size]}
              color={textColor[variant]}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

export default Button;

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  text: {
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  iconLeft: {
    marginRight: SPACING.xs,
  },
  iconRight: {
    marginLeft: SPACING.xs,
  },
});