import { StyleSheet, View } from 'react-native';
import { Wrench } from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { AppText } from './AppText';

/**
 * Honest label for a screen area that is intentionally not built yet.
 *
 * Used instead of placeholder charts or buttons that quietly do nothing, so
 * nothing on screen can be mistaken for finished functionality.
 */
export function DevelopmentNotice({ title, message, style }) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconBox}>
        <Wrench size={14} color={colors.textMuted} strokeWidth={2.1} />
      </View>
      <View style={styles.text}>
        <AppText variant="caption" color={colors.textSecondary}>
          {title}
        </AppText>
        {message ? (
          <AppText variant="caption" style={styles.message}>
            {message}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

/** Marks the isolated development preview data on Home. */
export function PreviewDataBadge({ style }) {
  return (
    <View style={[styles.badge, style]}>
      <View style={styles.dot} />
      <AppText variant="caption" color={colors.textMuted}>
        Preview data
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSunken,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  message: {
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs + 2,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSunken,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.amber,
  },
});
