import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '../../hooks/useReducedMotion';
import { colors } from '../../theme/colors';
import { duration, springs } from '../../theme/motion';
import { radii } from '../../theme/radii';
import { shadows } from '../../theme/shadows';
import { spacing } from '../../theme/spacing';
import { haptics } from '../../utils/haptics';
import { AppText } from './AppText';

const TRACK_PADDING = 4;

/** Pill filter with an indicator that glides between options. */
export function AnimatedSegmentedControl({ options, value, onChange, style }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const reduceMotion = useReducedMotion();
  const offset = useSharedValue(0);

  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );
  const segmentWidth = trackWidth > 0 ? (trackWidth - TRACK_PADDING * 2) / options.length : 0;

  useEffect(() => {
    const target = activeIndex * segmentWidth;
    offset.value = reduceMotion
      ? target
      : withSpring(target, springs.snappy);
  }, [activeIndex, segmentWidth, reduceMotion, offset]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: offset.value }],
  }));

  return (
    <View
      style={[styles.track, style]}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      accessibilityRole="tablist"
    >
      {segmentWidth > 0 ? <Animated.View style={[styles.indicator, indicatorStyle]} /> : null}

      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              if (isActive) return;
              haptics.selection();
              onChange?.(option.value);
            }}
            style={styles.segment}
          >
            <AppText
              variant={isActive ? 'bodyStrong' : 'body'}
              color={isActive ? colors.textPrimary : colors.textMuted}
              numberOfLines={1}
              style={styles.segmentLabel}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Crossfades content when the selected segment changes. */
export function SegmentedContent({ segmentKey, children, style }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withTiming(1, { duration: duration.base });
  }, [segmentKey, reduceMotion, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 8 }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: TRACK_PADDING,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  indicator: {
    position: 'absolute',
    top: TRACK_PADDING,
    left: TRACK_PADDING,
    bottom: TRACK_PADDING,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },
  segment: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
  },
  segmentLabel: {
    textAlign: 'center',
  },
});
