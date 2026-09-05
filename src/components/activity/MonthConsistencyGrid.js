import { StyleSheet, View } from 'react-native';
import { getDate, getDay, parseISO } from 'date-fns';

import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { AppText } from '../common/AppText';

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Monday-first column for a JS `getDay()` value. */
function columnFor(day) {
  return (day + 6) % 7;
}

/**
 * Month consistency grid.
 *
 * Intensity encodes how many confirmations that day held, and the count is also
 * rendered as text — colour alone is not an accessible signal (doc 08 §10).
 */
export function MonthConsistencyGrid({ buckets = [], accent = colors.accent, type = null }) {
  if (buckets.length === 0) return null;

  const countFor = (bucket) =>
    type ? (bucket.byType?.[type]?.completed ?? 0) : bucket.counts.completed;

  const max = Math.max(...buckets.map(countFor), 0);
  const leadingBlanks = columnFor(getDay(parseISO(buckets[0].key)));

  return (
    <View>
      <View style={styles.header}>
        {WEEKDAY_LABELS.map((label, index) => (
          <View key={`${label}-${index}`} style={styles.cell}>
            <AppText variant="caption" color={colors.textFaint}>
              {label}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {Array.from({ length: leadingBlanks }).map((_, index) => (
          <View key={`blank-${index}`} style={styles.cell} />
        ))}

        {buckets.map((bucket) => {
          const count = countFor(bucket);
          const intensity = max > 0 ? count / max : 0;

          return (
            <View key={bucket.key} style={styles.cell}>
              <View
                style={[
                  styles.day,
                  {
                    backgroundColor:
                      count > 0 ? accent : colors.surfaceSunken,
                    opacity: count > 0 ? 0.35 + intensity * 0.65 : 1,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  color={count > 0 ? '#FFFFFF' : colors.textFaint}
                  numberOfLines={1}
                >
                  {getDate(parseISO(bucket.key))}
                </AppText>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.xs,
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: '86%',
    aspectRatio: 1,
    maxHeight: 34,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
