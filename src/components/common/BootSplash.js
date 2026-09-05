import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { AppText } from './AppText';

/**
 * Brief hold between the native splash and Home.
 *
 * Local bootstrap is fast, so this is a soft fade rather than a loading
 * spinner — the user should never see a blank or half-populated first frame.
 */
export function BootSplash() {
  const progress = useSharedValue(0);
  const tagline = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: duration.slow, easing: easing.entrance });
    tagline.value = withDelay(180, withTiming(1, { duration: duration.slow }));
  }, [progress, tagline]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.9 + progress.value * 0.1 }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({ opacity: tagline.value * 0.9 }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.mark, markStyle]}>
        <AppText variant="display" color={colors.accentDeep}>
          H
        </AppText>
      </Animated.View>

      <Animated.View style={taglineStyle}>
        <AppText variant="caption" align="center">
          getting your day ready
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    backgroundColor: colors.background,
  },
  mark: {
    width: 76,
    height: 76,
    borderRadius: radii.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
});
