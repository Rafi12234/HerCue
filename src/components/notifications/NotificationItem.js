import { StyleSheet, View } from 'react-native';

import { categoryColors, colors, statusColors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { formatClock } from '../../utils/dates';
import { AppText } from '../common/AppText';
import { CategoryGlyph } from '../common/CategoryGlyph';
import { PressableScale } from '../common/PressableScale';

/**
 * One row in the notification inbox.
 *
 * Built now so Phase 9 only has to supply rows — nothing is rendered until
 * real notification history exists.
 */
export function NotificationItem({ item, onPress, isLast = false }) {
  const accent = categoryColors[item.type] ?? categoryColors.WATER;
  const status = statusColors[item.status] ?? statusColors.PENDING;

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.99}
      haptic="selection"
      style={[styles.row, isLast && styles.rowLast]}
      accessibilityLabel={item.title}
    >
      <View style={[styles.iconBox, { backgroundColor: accent.tint }]}>
        <CategoryGlyph type={item.type} size={16} color={accent.deep} strokeWidth={2.2} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.title}>
            {item.title}
          </AppText>
          <AppText variant="caption" style={styles.time}>
            {formatClock(item.deliveredAt)}
          </AppText>
        </View>

        <AppText variant="caption" numberOfLines={2}>
          {item.body}
        </AppText>
      </View>

      {!item.isRead ? <View style={[styles.unread, { backgroundColor: status.base }]} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  time: {
    flexShrink: 0,
  },
  unread: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginTop: spacing.sm,
    flexShrink: 0,
  },
});
