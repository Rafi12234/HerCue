import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { layout, spacing } from '../../theme/spacing';
import { haptics } from '../../utils/haptics';
import { AppText } from '../common/AppText';

const INDICATOR_INSET = 6;

function TabItem({ icon: Icon, label, isFocused, onPress, onLongPress, accessibilityLabel }) {
  const focus = useSharedValue(isFocused ? 1 : 0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const target = isFocused ? 1 : 0;
    focus.value = reduceMotion ? target : withTiming(target, { duration: duration.base });
  }, [isFocused, reduceMotion, focus]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + focus.value * 0.06 }, { translateY: -focus.value * 1.5 }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + focus.value * 0.45,
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tab}
      hitSlop={6}
    >
      <Animated.View style={iconStyle}>
        <Icon
          size={20}
          color={isFocused ? colors.accentDeep : colors.textMuted}
          strokeWidth={isFocused ? 2.4 : 2}
        />
      </Animated.View>
      <Animated.View style={labelStyle}>
        <AppText
          variant="caption"
          color={isFocused ? colors.accentDeep : colors.textMuted}
          numberOfLines={1}
          style={styles.label}
        >
          {label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Floating tab bar with a soft indicator that slides to the active tab.
 *
 * Kept intentionally calm — the tab change itself should not feel like an
 * event, only the destination should.
 */
export function TabBar({ state, descriptors, navigation, items }) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const reduceMotion = useReducedMotion();
  const offset = useSharedValue(0);

  const tabCount = state.routes.length;
  const tabWidth = barWidth > 0 ? (barWidth - INDICATOR_INSET * 2) / tabCount : 0;

  useEffect(() => {
    const target = state.index * tabWidth;
    offset.value = reduceMotion ? target : withSpring(target, springs.snappy);
  }, [state.index, tabWidth, reduceMotion, offset]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: tabWidth,
    transform: [{ translateX: offset.value }],
  }));

  return (
    <View
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar} onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}>
        {tabWidth > 0 ? <Animated.View style={[styles.indicator, indicatorStyle]} /> : null}

        {state.routes.map((route, index) => {
          const item = items[route.name];
          if (!item) return null;

          const isFocused = state.index === index;
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (isFocused || event.defaultPrevented) return;
            haptics.selection();
            navigation.navigate(route.name);
          };

          return (
            <TabItem
              key={route.key}
              icon={item.icon}
              label={item.label}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={() =>
                navigation.emit({ type: 'tabLongPress', target: route.key })
              }
              accessibilityLabel={options.tabBarAccessibilityLabel}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.base,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: INDICATOR_INSET,
    minHeight: layout.tabBarHeight,
    borderRadius: radii.xxl,
    backgroundColor: 'rgba(255, 252, 249, 0.96)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.floating,
  },
  indicator: {
    position: 'absolute',
    top: INDICATOR_INSET,
    bottom: INDICATOR_INSET,
    left: INDICATOR_INSET,
    borderRadius: radii.xl,
    backgroundColor: colors.accentSoft,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
  },
  label: {
    fontSize: 10.5,
    textAlign: 'center',
  },
});
