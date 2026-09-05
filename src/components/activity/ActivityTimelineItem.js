import { StyleSheet, View } from 'react-native';

import { CategoryGlyph } from '../common/CategoryGlyph';
import { AppText } from '../common/AppText';
import { StatusBadge } from '../common/StatusBadge';
import { categoryColors, colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { formatClock } from '../../utils/dates';

/** One row of the Day timeline: when it happened, what it was, how it ended. */
export function ActivityTimelineItem({ item, isLast = false }) {
  const accent = categoryColors[item.type] ?? categoryColors.WATER;

  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={[styles.dot, { backgroundColor: accent.base }]} />
        {isLast ? null : <View style={styles.line} />}
      </View>

      <View style={styles.body}>
        <View style={styles.headline}>
          <AppText variant="caption" color={colors.textFaint} style={styles.time}>
            {formatClock(item.occurredAt)}
          </AppText>
          <CategoryGlyph type={item.type} size={14} color={accent.deep} />
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.label}>
            {item.typeLabel}
          </AppText>
          <StatusBadge status={item.status} compact />
        </View>

        <AppText variant="caption" numberOfLines={1}>
          {item.actionLabel}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rail: {
    alignItems: 'center',
    width: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  line: {
    flex: 1,
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingBottom: spacing.base,
  },
  headline: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  time: {
    fontVariant: ['tabular-nums'],
  },
  label: {
    flexShrink: 1,
    minWidth: 0,
  },
});
