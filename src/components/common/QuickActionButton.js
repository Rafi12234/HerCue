import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { categoryColors } from '../../theme/colors';
import { pressScale } from '../../theme/motion';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';
import { SparkleBurst } from './SparkleBurst';

const CONFIRMATION_HOLD_MS = 1600;

/**
 * Pill button for Home confirmations ("Drank", "I ate", "I went").
 *
 * Handles the whole success moment itself: disables while writing, swaps to a
 * check with confirmation copy, fires a petal burst, then settles back.
 * Double taps are ignored while a write is in flight.
 */
export function QuickActionButton({
  type,
  label,
  confirmedLabel = 'Noted',
  icon: Icon,
  onPress,
  disabled = false,
  fullWidth = false,
  style,
}) {
  const accent = categoryColors[type] ?? categoryColors.WATER;
  const [state, setState] = useState('idle');
  const [burst, setBurst] = useState(0);
  const resetTimer = useRef(null);
  const mounted = useRef(true);

  useEffect(
    () => () => {
      mounted.current = false;
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    []
  );

  const handlePress = useCallback(async () => {
    if (state !== 'idle' || disabled) return;
    setState('saving');

    try {
      const result = await onPress?.();
      if (!mounted.current) return;

      if (result && result.ok === false) {
        setState('idle');
        return;
      }

      setState('confirmed');
      setBurst((value) => value + 1);
      resetTimer.current = setTimeout(() => {
        if (mounted.current) setState('idle');
      }, CONFIRMATION_HOLD_MS);
    } catch {
      if (mounted.current) setState('idle');
    }
  }, [state, disabled, onPress]);

  const isConfirmed = state === 'confirmed';
  const isSaving = state === 'saving';

  return (
    <View style={[fullWidth && styles.fullWidth, style]}>
      <PressableScale
        onPress={handlePress}
        disabled={disabled || isSaving}
        scaleTo={pressScale.button}
        haptic="press"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || isSaving }}
        style={[
          styles.button,
          fullWidth && styles.fullWidth,
          { backgroundColor: isConfirmed ? accent.tint : accent.base },
        ]}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : isConfirmed ? (
          <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut} style={styles.content}>
            <Check size={16} color={accent.deep} strokeWidth={2.8} />
            <AppText variant="button" color={accent.deep} numberOfLines={1}>
              {confirmedLabel}
            </AppText>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(160)} style={styles.content}>
            {Icon ? <Icon size={16} color="#FFFFFF" strokeWidth={2.4} /> : null}
            <AppText variant="button" color="#FFFFFF" numberOfLines={1}>
              {label}
            </AppText>
          </Animated.View>
        )}
      </PressableScale>

      <SparkleBurst trigger={burst} color={accent.base} />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 40,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.base,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
});
