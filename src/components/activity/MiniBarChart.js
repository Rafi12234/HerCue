import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useSettingsStore } from '../../stores/settingsStore';
import { colors } from '../../theme/colors';
import { durations, easings } from '../../theme/motion';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { AppText } from '../common/AppText';

const MAX_HEIGHT = 92;

function Bar({ value, max, label, index, accent, reduceMotion }) {
  const ratio = max > 0 ? value / max : 0;
  const height = useSharedValue(reduceMotion ? Math.max(ratio * MAX_HEIGHT, 2) : 2);

  useEffect(() => {
    const target = Math.max(ratio * MAX_HEIGHT, 2);
    height.value = reduceMotion
      ? target
      : withDelay(index * 28, withTiming(target, { duration: durations.slow, easing: easings.standard }));
  }, [ratio, index, height, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <View style={styles.column}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.bar,
            animatedStyle,
            { backgroundColor: value > 0 ? accent : colors.surfaceSunken },
          ]}
        />
      </View>
      <AppText variant="caption" color={colors.textFaint} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

/**
 * Small bar chart drawn with plain views.
 *
 * Values are labelled in text alongside the chart rather than relying on bar
 * height alone, and the axis always starts at zero so nothing is exaggerated.
 */
export function MiniBarChart({ data = [], accent = colors.accent }) {
  const reduceMotion = useSettingsStore((state) => state.reduceMotion);
  const max = Math.max(...data.map((point) => point.value), 0);

  if (data.length === 0) return null;

  return (
    <View
      style={styles.chart}
      accessibilityRole="image"
      accessibilityLabel={data.map((p) => `${p.label}: ${p.value}`).join(', ')}
    >
      {data.map((point, index) => (
        <Bar
          key={point.key}
          value={point.value}
          max={max}
          label={point.label}
          index={index}
          accent={accent}
          reduceMotion={reduceMotion}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  column: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: spacing.xs,
  },
  track: {
    height: MAX_HEIGHT,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: radii.sm,
    minHeight: 2,
  },
});
