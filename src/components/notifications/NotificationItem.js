import { StyleSheet, View } from 'react-native';

import { STATUS_LABELS } from '../../constants/statuses';
import { categoryColors, colors, statusColors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { formatClock } from '../../utils/dates';
import { AppText } from '../common/AppText';
import { CategoryGlyph } from '../common/CategoryGlyph';
import { PressableScale } from '../common/PressableScale';

/** One row in the notification inbox. */
export function NotificationItem({ item, onPress, onLongPress, isLast = false }) {
  const accent = categoryColors[item.type] ?? categoryColors.WATER;
  const status = statusColors[item.status] ?? statusColors.PENDING;

  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      scaleTo={0.99}
      haptic="selection"
      style={[styles.row, isLast && styles.rowLast]}
      accessibilityLabel={`${item.title}. ${item.isRead ? 'Read' : 'Unread'}`}
    >
      <View style={[styles.iconBox, { backgroundColor: accent.tint }]}>
        <CategoryGlyph type={item.type} size={16} color={accent.deep} strokeWidth={2.2} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <AppText
            variant={item.isRead ? 'body' : 'bodyStrong'}
            numberOfLines={1}
            style={styles.title}
          >
            {item.title}
          </AppText>
          <AppText variant="caption" style={styles.time}>
            {formatClock(item.deliveredAt)}
          </AppText>
        </View>

        <AppText variant="caption" numberOfLines={2}>
          {item.body}
        </AppText>

        {item.status ? (
          <View style={[styles.statusPill, { backgroundColor: status.tint }]}>
            <AppText variant="caption" color={status.deep} numberOfLines={1}>
              {STATUS_LABELS[item.status] ?? item.status}
            </AppText>
          </View>
        ) : null}
      </View>

      {!item.isRead ? <View style={[styles.unread, { backgroundColor: accent.base }]} /> : null}
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
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs + 2,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
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
