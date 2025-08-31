import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Platform, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDecay,
  cancelAnimation,
} from 'react-native-reanimated';

type PanCanvasProps = {
  width: number;
  height: number;
  overscroll?: number;
  dragSuppressThreshold?: number; // px before we treat pointer as drag
  children: (ctx: { dragging: boolean }) => React.ReactNode;
  style?: ViewStyle;
  webUseNativeScroll?: boolean;
};

export const PanCanvas = ({
  width,
  height,
  overscroll = 48,
  dragSuppressThreshold = 6,
  children,
  style,
  webUseNativeScroll = false,
}: PanCanvasProps) => {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // dragging == user moved beyond threshold (only then disable clicks)
  const [dragging, setDragging] = useState(false);
  const surfaceRef = useRef<View | null>(null);

  const webExtras =
    Platform.OS === 'web'
      ? ({
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          WebkitUserSelect: 'none',
        } as any)
      : null;

  const getClamp = useCallback(() => {
    const sw = typeof window !== 'undefined' ? window.innerWidth : 0;
    const sh = typeof window !== 'undefined' ? window.innerHeight : 0;
    const minX = Math.min(0, sw - width - overscroll);
    const maxX = overscroll;
    const minY = Math.min(0, sh - height - overscroll);
    const maxY = overscroll;
    return { x: [minX, maxX] as [number, number], y: [minY, maxY] as [number, number] };
  }, [width, height, overscroll]);

  // Native (apps) pan
  const pan = Gesture.Pan()
    .minDistance(1)
    .onBegin(() => {
      cancelAnimation(tx);
      cancelAnimation(ty);
      startX.value = tx.value;
      startY.value = ty.value;
      setDragging(false);
    })
    .onUpdate(e => {
      tx.value = startX.value + e.translationX;
      ty.value = startY.value + e.translationY;
      if (!dragging && (Math.abs(e.translationX) > dragSuppressThreshold || Math.abs(e.translationY) > dragSuppressThreshold)) {
        setDragging(true);
      }
    })
    .onEnd(e => {
      const { x, y } = getClamp();
      tx.value = withDecay({ velocity: e.velocityX, clamp: x });
      ty.value = withDecay({ velocity: e.velocityY, clamp: y });
      // keep dragging true through inertia
    })
    .onFinalize(() => {
      // allow next tap after frame
      requestAnimationFrame(() => setDragging(false));
    });

  // Web pointer fallback (desktop & mobile web) when not using native scroll
  useEffect(() => {
    if (Platform.OS !== 'web' || webUseNativeScroll) return;
    // @ts-ignore
    const node: HTMLElement | null = surfaceRef.current?._node || surfaceRef.current;
    if (!node) return;

    let pid: number | null = null;
    let originX = 0;
    let originY = 0;
    let lastX = 0;
    let lastY = 0;
    let moved = false;
    let draggingActive = false;

    const down = (e: PointerEvent) => {
      if (pid !== null) return;
      pid = e.pointerId;
      cancelAnimation(tx);
      cancelAnimation(ty);
      startX.value = tx.value;
      startY.value = ty.value;
      originX = lastX = e.clientX;
      originY = lastY = e.clientY;
      moved = false;
      draggingActive = false;
      setDragging(false);
      // Do NOT capture yet; only after threshold
    };

    const move = (e: PointerEvent) => {
      if (pid === null || e.pointerId !== pid) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (dx !== 0 || dy !== 0) moved = true;
      tx.value += dx;
      ty.value += dy;
      lastX = e.clientX;
      lastY = e.clientY;

      if (!draggingActive) {
        const totalDx = e.clientX - originX;
        const totalDy = e.clientY - originY;
        if (Math.abs(totalDx) > dragSuppressThreshold || Math.abs(totalDy) > dragSuppressThreshold) {
          draggingActive = true;
          setDragging(true);
          node.setPointerCapture(pid);
        }
      }
    };

    const end = (e: PointerEvent) => {
      if (pid === null || e.pointerId !== pid) return;
      pid = null;
      if (draggingActive) {
        // inertia not implemented in pure pointer fallback (optional)
        // allow click again
        requestAnimationFrame(() => setDragging(false));
      } else {
        setDragging(false);
      }
    };

    node.addEventListener('pointerdown', down, { passive: true });
    node.addEventListener('pointermove', move, { passive: true });
    node.addEventListener('pointerup', end, { passive: true });
    node.addEventListener('pointercancel', end, { passive: true });

    return () => {
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', end);
      node.removeEventListener('pointercancel', end);
    };
  }, [webUseNativeScroll, dragSuppressThreshold, tx, ty, startX, startY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  if (Platform.OS === 'web' && webUseNativeScroll) {
    return (
      <View
        // @ts-ignore
        style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        <View style={{ width, height }}>{children({ dragging: false })}</View>
      </View>
    );
  }

  const surface = (
     <Animated.View
      ref={surfaceRef}
      style={[
        { width, height },
        webExtras,
        style,
        animStyle,
      ]}
    >
      {children({ dragging })}
    </Animated.View>
  );

  return Platform.OS === 'web' ? (
    surface
  ) : (
    <GestureDetector gesture={pan}>{surface}</GestureDetector>
  );
};