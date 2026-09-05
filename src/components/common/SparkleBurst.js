import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { duration, easing } from '../../theme/motion';

const PETALS = [
  { angle: -70, distance: 26, size: 5, delay: 0 },
  { angle: -20, distance: 32, size: 4, delay: 40 },
  { angle: 30, distance: 24, size: 5.5, delay: 20 },
  { angle: 80, distance: 30, size: 4, delay: 60 },
  { angle: 140, distance: 22, size: 4.5, delay: 30 },
];

function Petal({ angle, distance, size, delay, color, trigger }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!trigger) return;
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: duration.slow, easing: easing.standard }),
        withTiming(0, { duration: duration.fast })
      )
    );
  }, [trigger, delay, progress]);

  const style = useAnimatedStyle(() => {
    const radians = (angle * Math.PI) / 180;
    const travel = progress.value * distance;
    return {
      opacity: progress.value,
      transform: [
        { translateX: Math.cos(radians) * travel },
        { translateY: Math.sin(radians) * travel },
        { scale: 0.6 + progress.value * 0.6 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.petal,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

/**
 * Small one-shot petal burst for successful confirmations.
 * Bump `trigger` to replay; it never loops on its own.
 */
export const SparkleBurst = memo(function SparkleBurst({ trigger = 0, color, style }) {
  return (
    <View pointerEvents="none" style={[styles.container, style]}>
      {PETALS.map((petal, index) => (
        <Petal key={index} {...petal} color={color} trigger={trigger} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petal: {
    position: 'absolute',
  },
});
