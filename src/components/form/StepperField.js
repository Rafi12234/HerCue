import { StyleSheet, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { AppText } from '../common/AppText';
import { PressableScale } from '../common/PressableScale';

/** Stepper for interval and goal values — no free-text entry to validate. */
export function StepperField({
  label,
  value,
  onChange,
  min = 1,
  max = 999,
  step = 1,
  format = (v) => String(v),
  tint = colors.accentSoft,
  accent = colors.accentDeep,
}) {
  const clamp = (next) => Math.min(max, Math.max(min, next));

  return (
    <View style={styles.field}>
      {label ? (
        <AppText variant="caption" color={colors.textMuted} style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <View style={[styles.control, { backgroundColor: tint }]}>
        <PressableScale
          onPress={() => onChange(clamp(value - step))}
          disabled={value <= min}
          haptic="press"
          scaleTo={0.9}
          style={styles.button}
          accessibilityLabel={`Decrease ${label ?? 'value'}`}
        >
          <Minus size={16} color={value <= min ? colors.textFaint : accent} strokeWidth={2.6} />
        </PressableScale>

        <AppText variant="bodyStrong" color={accent} numberOfLines={1} style={styles.value}>
          {format(value)}
        </AppText>

        <PressableScale
          onPress={() => onChange(clamp(value + step))}
          disabled={value >= max}
          haptic="press"
          scaleTo={0.9}
          style={styles.button}
          accessibilityLabel={`Increase ${label ?? 'value'}`}
        >
          <Plus size={16} color={value >= max ? colors.textFaint : accent} strokeWidth={2.6} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  label: {
    marginLeft: 2,
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  button: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    flex: 1,
    minWidth: 0,
    textAlign: 'center',
  },
});
