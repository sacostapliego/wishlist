import { Animated, Easing } from 'react-native';

/**
 * Utility functions for common animations
 */

/**
 * Creates a spring animation
 */
export const springAnimation = (
  animatedValue: Animated.Value | Animated.ValueXY,
  toValue: number | { x: number; y: number },
  config = { friction: 6, tension: 80 }
): Animated.CompositeAnimation => {
  return Animated.spring(animatedValue, {
    toValue,
    friction: config.friction,
    tension: config.tension,
    useNativeDriver: true,
  });
};

/**
 * Creates a timing animation
 */
export const timingAnimation = (
  animatedValue: Animated.Value | Animated.ValueXY,
  toValue: number | { x: number; y: number },
  duration = 300,
  easing = Easing.ease
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  });
};

/**
 * Creates a fading in animation
 */
export const fadeIn = (
  animatedValue: Animated.Value,
  duration = 300
): Animated.CompositeAnimation => {
  return timingAnimation(animatedValue, 1, duration);
};

/**
 * Creates a fading out animation
 */
export const fadeOut = (
  animatedValue: Animated.Value,
  duration = 300
): Animated.CompositeAnimation => {
  return timingAnimation(animatedValue, 0, duration);
};

/**
 * Creates a slide animation
 */
export const slideHorizontal = (
  animatedValue: Animated.Value,
  toValue: number,
  duration = 250
): Animated.CompositeAnimation => {
  return timingAnimation(animatedValue, toValue, duration);
};