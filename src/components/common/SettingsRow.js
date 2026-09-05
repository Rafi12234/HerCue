import { StyleSheet, Switch, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

/**
 * One settings row.
 *
 * `state` is how HerCue stays honest about unfinished work: a row marked
 * `soon` renders a plain badge and is not pressable, instead of looking like a
 * working control.
 */
export function SettingsRow({
  icon: Icon,
  label,
  description,
  value,
  onPress,
  toggleValue,
  onToggle,
  state = 'ready',
  iconTint = colors.accentSoft,
  iconColor = colors.accentDeep,
  destructive = false,
  isLast = false,
}) {
  const isSoon = state === 'soon';
  const hasToggle = typeof onToggle === 'function';
  const isPressable = !isSoon && !hasToggle && typeof onPress === 'function';

  const content = (
    <View style={[styles.row, isLast && styles.rowLast]}>
      {Icon ? (
        <View
          style={[
            styles.iconBox,
            { backgroundColor: destructive ? colors.emberSoft : iconTint },
          ]}
        >
          <Icon size={17} color={destructive ? colors.ember : iconColor} strokeWidth={2.1} />
        </View>
      ) : null}

      <View style={styles.labels}>
        <AppText
          variant="bodyStrong"
          numberOfLines={2}
          color={destructive ? colors.ember : undefined}
        >
          {label}
        </AppText>
        {description ? (
          <AppText variant="caption" style={styles.description} numberOfLines={3}>
            {description}
          </AppText>
        ) : null}
      </View>

      <View style={styles.trailing}>
        {isSoon ? (
          <View style={styles.soonBadge}>
            <AppText variant="caption" color={colors.textMuted}>
              Soon
            </AppText>
          </View>
        ) : hasToggle ? (
          <Switch
            value={Boolean(toggleValue)}
            onValueChange={onToggle}
            trackColor={{ false: colors.surfaceSunken, true: colors.accent }}
            thumbColor={colors.surface}
            accessibilityLabel={label}
          />
        ) : (
          <>
            {value ? (
              <AppText variant="caption" numberOfLines={1} style={styles.value}>
                {value}
              </AppText>
            ) : null}
            {isPressable ? <ChevronRight size={17} color={colors.textFaint} /> : null}
          </>
        )}
      </View>
    </View>
  );

  if (!isPressable) {
    return <View style={isSoon && styles.dimmed}>{content}</View>;
  }

  return (
    <PressableScale onPress={onPress} scaleTo={0.99} haptic="selection">
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md + 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  dimmed: {
    opacity: 0.62,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labels: {
    flex: 1,
    minWidth: 0,
  },
  description: {
    marginTop: 2,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
    maxWidth: '42%',
  },
  value: {
    textAlign: 'right',
    flexShrink: 1,
  },
  soonBadge: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSunken,
  },
});
