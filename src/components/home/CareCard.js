import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '../../hooks/useReducedMotion';
import { categoryColors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { AppText } from '../common/AppText';
import { Card } from '../common/Card';
import { CategoryIcon } from '../common/CategoryIcon';

/**
 * Shared shell for the five Home care cards.
 *
 * `highlightTrigger` is bumped when the hero card is tapped, so the matching
 * card answers with a short glow instead of the hero navigating nowhere.
 */
export function CareCard({
  type,
  title,
  subtitle,
  trailing,
  children,
  footer,
  highlightTrigger = 0,
  onPress,
  compact = false,
  style,
}) {
  const accent = categoryColors[type] ?? categoryColors.WATER;
  const reduceMotion = useReducedMotion();
  const highlight = useSharedValue(0);

  useEffect(() => {
    if (!highlightTrigger || reduceMotion) return;
    highlight.value = withSequence(
      withTiming(1, { duration: duration.fast, easing: easing.standard }),
      withTiming(0, { duration: duration.lazy })
    );
  }, [highlightTrigger, reduceMotion, highlight]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: highlight.value,
  }));

  return (
    <Animated.View style={style}>
      <Card
        onPress={onPress}
        style={compact ? styles.compactCard : undefined}
        accessibilityLabel={title}
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: accent.tint }, glowStyle]}
        />

        <View style={styles.header}>
          <CategoryIcon type={type} size={compact ? 'sm' : 'md'} />

          <View style={styles.titles}>
            <AppText variant={compact ? 'h3' : 'h2'} numberOfLines={1}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="caption" numberOfLines={2} style={styles.subtitle}>
                {subtitle}
              </AppText>
            ) : null}
          </View>

          {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
        </View>

        {children ? <View style={styles.body}>{children}</View> : null}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  compactCard: {
    padding: spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titles: {
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    marginTop: 1,
  },
  trailing: {
    flexShrink: 0,
    maxWidth: '46%',
    alignItems: 'flex-end',
  },
  body: {
    marginTop: spacing.base,
  },
  footer: {
    marginTop: spacing.base,
  },
});
