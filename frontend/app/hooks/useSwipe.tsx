import { useRef, useState } from 'react';
import { PanResponder, Animated } from 'react-native';

interface UseSwipeProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
  resetAfterSwipe?: boolean;
}

/**
 * Hook to handle swipe gestures
 */
export const useSwipe = ({
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 120,
  resetAfterSwipe = true,
}: UseSwipeProps = {}) => {
  const position = useRef(new Animated.ValueXY()).current;
  const [isAnimating, setIsAnimating] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (isAnimating) return;
        position.setValue({ x: gestureState.dx, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isAnimating) return;
        
        console.log("Gesture dx:", gestureState.dx, "Threshold:", swipeThreshold);
        
        if (gestureState.dx > swipeThreshold && onSwipeRight) {
          console.log("RIGHT SWIPE DETECTED");
          completeSwipeAnimation(250, onSwipeRight);
        } else if (gestureState.dx < -swipeThreshold && onSwipeLeft) {
          console.log("LEFT SWIPE DETECTED");
          completeSwipeAnimation(-250, onSwipeLeft);
        } else {
          resetPosition();
        }
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const completeSwipeAnimation = (toValue: number, callback?: () => void) => {
    setIsAnimating(true);
    Animated.timing(position, {
      toValue: { x: toValue, y: 0 },
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (callback) callback();
      if (resetAfterSwipe) {
        position.setValue({ x: 0, y: 0 });
      }
      setIsAnimating(false);
    });
  };

  const resetPosition = () => {
    setIsAnimating(true);
    Animated.timing(position, {
      toValue: { x: 0, y: 0 },
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsAnimating(false);
    });
  };

  return {
    position,
    panHandlers: panResponder.panHandlers,
    resetPosition,
    isAnimating,
  };
};