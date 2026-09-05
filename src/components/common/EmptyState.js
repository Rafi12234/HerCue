import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

/**
 * Gentle empty state: a small tinted icon, one warm line, and at most one
 * action. Never a full-screen illustration.
 */
export function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onActionPress,
  tint = colors.accentSoft,
  iconColor = colors.accentDeep,
  compact = false,
  style,
}) {
  return (
    <View style={[styles.container, compact && styles.compact, style]}>
      {Icon ? (
        <View style={[styles.iconBox, { backgroundColor: tint }]}>
          <Icon size={22} color={iconColor} strokeWidth={2} />
        </View>
      ) : null}

      <AppText variant="h3" align="center">
        {title}
      </AppText>

      {message ? (
        <AppText variant="body" align="center" style={styles.message}>
          {message}
        </AppText>
      ) : null}

      {actionLabel && onActionPress ? (
        <PressableScale onPress={onActionPress} scaleTo={0.94} style={styles.action}>
          <AppText variant="button" color={colors.accentDeep}>
            {actionLabel}
          </AppText>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  compact: {
    paddingVertical: spacing.lg,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    maxWidth: 300,
  },
  action: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
  },
});
