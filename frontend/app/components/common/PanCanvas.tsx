import React, { useEffect, useRef, useCallback } from 'react';
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
  disableChildPressOnDrag?: boolean;
  children: (ctx: { dragging: boolean }) => React.ReactNode;
  style?: ViewStyle;
  webUseNativeScroll?: boolean; // set true to just use normal browser scroll on web
};

export const PanCanvas = ({
  width,
  height,
  overscroll = 48,
  disableChildPressOnDrag = true,
  children,
  style,
  webUseNativeScroll = false,
}: PanCanvasProps) => {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const draggingRef = useRef(false);
  const surfaceRef = useRef<View | null>(null);

  const webExtras = Platform.OS === 'web'
  ? ({ cursor: 'grab', touchAction: 'none', WebkitUserSelect: 'none' } as any)
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

  const pan = Gesture.Pan()
    .minDistance(1)
    .onBegin(() => {
      cancelAnimation(tx);
      cancelAnimation(ty);
      startX.value = tx.value;
      startY.value = ty.value;
      draggingRef.current = true;
    })
    .onUpdate(e => {
      tx.value = startX.value + e.translationX;
      ty.value = startY.value + e.translationY;
    })
    .onEnd(e => {
      const { x, y } = getClamp();
      tx.value = withDecay({ velocity: e.velocityX, clamp: x });
      ty.value = withDecay({ velocity: e.velocityY, clamp: y });
    })
    .onFinalize(() => {
      // allow presses again next frame
      requestAnimationFrame(() => {
        draggingRef.current = false;
      });
    });

  // Raw pointer fallback for web when not using native scroll
  useEffect(() => {
    if (Platform.OS !== 'web' || webUseNativeScroll) return;
    // @ts-ignore
    const node: HTMLElement | null = surfaceRef.current?._node || surfaceRef.current;
    if (!node) return;

    let pid: number | null = null;
    let lx = 0;
    let ly = 0;

    const down = (e: PointerEvent) => {
      if (pid !== null) return;
      pid = e.pointerId;
      cancelAnimation(tx);
      cancelAnimation(ty);
      startX.value = tx.value;
      startY.value = ty.value;
      lx = e.clientX;
      ly = e.clientY;
      draggingRef.current = true;
      node.setPointerCapture(pid);
    };
    const move = (e: PointerEvent) => {
      if (pid === null || e.pointerId !== pid) return;
      tx.value += e.clientX - lx;
      ty.value += e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pid) return;
      pid = null;
      draggingRef.current = false;
    };
    node.addEventListener('pointerdown', down, { passive: true });
    node.addEventListener('pointermove', move, { passive: true });
    node.addEventListener('pointerup', up, { passive: true });
    node.addEventListener('pointercancel', up, { passive: true });
    return () => {
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', up);
    };
  }, [webUseNativeScroll, tx, ty, startX, startY]);

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
      // @ts-ignore
      style={[
        { width, height },
        webExtras,
        style,
        animStyle,
    ]}
    pointerEvents={
        disableChildPressOnDrag && draggingRef.current ? 'none' : 'auto'
    }
    >
      {children({ dragging: draggingRef.current })}
    </Animated.View>
  );

  return Platform.OS === 'web' ? (
    surface
  ) : (
    <GestureDetector gesture={pan}>{surface}</GestureDetector>
  );
};