import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import { categoryColors, colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { AppText } from '../common/AppText';

const accent = categoryColors.PERIOD;
const WEEK_OPTIONS = { weekStartsOn: 1 };
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Month grid for the Period screen.
 *
 * Confirmed days are filled; predicted days use a dashed outline so a guess can
 * never be mistaken for a fact.
 */
export function CycleCalendar({ month, confirmedDates = [], predictedDates = [], style }) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), WEEK_OPTIONS);
    const end = endOfWeek(endOfMonth(month), WEEK_OPTIONS);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const confirmed = useMemo(() => new Set(confirmedDates), [confirmedDates]);
  const predicted = useMemo(() => new Set(predictedDates), [predictedDates]);

  return (
    <View style={style}>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((label, index) => (
          <View key={`${label}-${index}`} style={styles.cell}>
            <AppText variant="caption" align="center" color={colors.textFaint}>
              {label}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, month);
          const isConfirmed = confirmed.has(key);
          const isPredicted = !isConfirmed && predicted.has(key);
          const today = isToday(day);

          return (
            <View key={key} style={styles.cell}>
              <View
                style={[
                  styles.day,
                  isConfirmed && styles.dayConfirmed,
                  isPredicted && styles.dayPredicted,
                  today && !isConfirmed && styles.dayToday,
                ]}
              >
                <AppText
                  variant={today || isConfirmed ? 'bodyStrong' : 'body'}
                  align="center"
                  color={
                    isConfirmed
                      ? '#FFFFFF'
                      : !inMonth
                        ? colors.textFaint
                        : isPredicted
                          ? accent.deep
                          : colors.textSecondary
                  }
                  style={styles.dayLabel}
                >
                  {format(day, 'd')}
                </AppText>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <LegendItem style={styles.legendConfirmed} label="Logged" />
        <LegendItem style={styles.legendPredicted} label="Estimated" />
        <LegendItem style={styles.legendToday} label="Today" />
      </View>
    </View>
  );
}

function LegendItem({ style, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, style]} />
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 3,
  },
  day: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 13,
  },
  dayConfirmed: {
    backgroundColor: accent.base,
  },
  dayPredicted: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: accent.base,
    backgroundColor: accent.tint,
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: colors.smoke,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
    marginTop: spacing.base,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendConfirmed: {
    backgroundColor: accent.base,
  },
  legendPredicted: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: accent.base,
    backgroundColor: accent.tint,
  },
  legendToday: {
    borderWidth: 1.5,
    borderColor: colors.smoke,
  },
});
