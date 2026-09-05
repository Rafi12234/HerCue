import { StyleSheet, View } from 'react-native';

import { REMINDER_TYPE_LIST, REMINDER_TYPE_META } from '../../constants/reminderTypes';
import { categoryColors, colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { AppText } from '../common/AppText';
import { CategoryGlyph } from '../common/CategoryGlyph';

function Metric({ label, value, tone = colors.textPrimary }) {
  return (
    <View style={styles.metric}>
      <AppText variant="metricSmall" color={tone} numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="caption" color={colors.textFaint} numberOfLines={2}>
        {label}
      </AppText>
    </View>
  );
}

/** Headline counts plus a per-category breakdown, all from stored rows. */
export function RangeSummary({ summary }) {
  const rate = summary.completionRate;
  const activeTypes = REMINDER_TYPE_LIST.filter((type) => summary.byType[type]?.total > 0);

  return (
    <View style={styles.container}>
      <View style={styles.metrics}>
        <Metric label="Confirmed" value={summary.totals.completed} />
        <Metric label="Missed" value={summary.totals.missed} tone={colors.ember} />
        <Metric label="Skipped" value={summary.totals.skipped} tone={colors.textMuted} />
        <Metric
          label="Routine completed"
          value={rate === null ? '—' : `${Math.round(rate * 100)}%`}
          tone={colors.accentDeep}
        />
      </View>

      {activeTypes.length > 0 ? (
        <View style={styles.breakdown}>
          {activeTypes.map((type) => {
            const accent = categoryColors[type];
            const counts = summary.byType[type];
            return (
              <View key={type} style={[styles.chip, { backgroundColor: accent.tint }]}>
                <CategoryGlyph type={type} size={13} color={accent.deep} />
                <AppText variant="caption" color={accent.deep} numberOfLines={1}>
                  {`${REMINDER_TYPE_META[type].label} ${counts.completed}`}
                </AppText>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.base,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.base,
  },
  metric: {
    width: '50%',
    paddingRight: spacing.sm,
  },
  breakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 1,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.pill,
  },
});
