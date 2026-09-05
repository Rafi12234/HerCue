import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors } from '../../theme/colors';
import { springs } from '../../theme/motion';
import { radii } from '../../theme/radii';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Progress track that eases to its new value rather than jumping.
 *
 * Width is animated in points (measured via onLayout) so the fill stays smooth
 * on the UI thread instead of re-laying out on every frame.
 */
export function ProgressBar({
  value = 0,
  trackColor = colors.surfaceSunken,
  fillColor = colors.accent,
  height = 8,
  style,
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const reduceMotion = useReducedMotion();
  const width = useSharedValue(0);

  const clamped = Math.max(0, Math.min(1, value));

  useEffect(() => {
    const target = trackWidth * clamped;
    width.value = reduceMotion ? target : withSpring(target, springs.gentle);
  }, [clamped, trackWidth, reduceMotion, width]);

  const fillStyle = useAnimatedStyle(() => ({ width: width.value }));

  return (
    <View
      style={[styles.track, { backgroundColor: trackColor, height, borderRadius: height / 2 }, style]}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: fillColor, height, borderRadius: height / 2 },
          fillStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: radii.pill,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
