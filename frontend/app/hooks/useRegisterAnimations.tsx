import { useRef, useState, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

export function useRegisterAnimations(onSuccess?: () => void, successDelay = 800) {
  const [errorMessage, setErrorMessage] = useState('');
  const [didSucceed, setDidSucceed] = useState(false);

  const successScale = useRef(new Animated.Value(0)).current;
  const errorSlideY = useRef(new Animated.Value(-80)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const hideError = () => {
    Animated.timing(errorSlideY, {
      toValue: -80,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setErrorMessage(''));
  };

  const showError = useCallback((msg: string) => {
    setDidSucceed(false);
    setErrorMessage(msg);
    Animated.timing(errorSlideY, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
      easing: Easing.out(Easing.ease),
    }).start();

    // Auto-hide
    setTimeout(hideError, 4000);

    // Subtle button shake
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.97, duration: 60, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1.02, duration: 60, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [buttonScale, errorSlideY]);

  const triggerSuccess = useCallback(() => {
    setErrorMessage('');
    setDidSucceed(true);
    Animated.spring(successScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 12,
      bounciness: 6,
    }).start();
    if (onSuccess) {
      setTimeout(() => onSuccess(), successDelay);
    }
  }, [onSuccess, successDelay, successScale]);

  return {
    // state
    errorMessage,
    didSucceed,
    // actions
    showError,
    triggerSuccess,
    // animated styles
    errorBannerStyle: { transform: [{ translateY: errorSlideY }] },
    buttonScaleStyle: { transform: [{ scale: buttonScale }] },
    successScale,
  };
}

export default useRegisterAnimations;