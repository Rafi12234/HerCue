import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

/** Section label with an optional right-hand text action. */
export function SectionHeader({ title, caption, actionLabel, onActionPress, style }) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.titles}>
        <AppText variant="h2">{title}</AppText>
        {caption ? (
          <AppText variant="caption" style={styles.caption}>
            {caption}
          </AppText>
        ) : null}
      </View>

      {actionLabel && onActionPress ? (
        <PressableScale
          onPress={onActionPress}
          scaleTo={0.93}
          haptic="selection"
          style={styles.action}
          accessibilityLabel={actionLabel}
        >
          <AppText variant="caption" color={colors.accentDeep} style={styles.actionLabel}>
            {actionLabel}
          </AppText>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  titles: {
    flex: 1,
    minWidth: 0,
  },
  caption: {
    marginTop: 2,
  },
  action: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
  },
  actionLabel: {
    color: colors.accentDeep,
  },
});
