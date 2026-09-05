import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDays, addMonths, eachDayOfInterval, format, parseISO } from 'date-fns';
import { CalendarHeart, CalendarPlus, Check, Flower2, Info } from 'lucide-react-native';

import { AppHeader } from '../../src/components/common/AppHeader';
import { AppText } from '../../src/components/common/AppText';
import { Card } from '../../src/components/common/Card';
import { EmptyState } from '../../src/components/common/EmptyState';
import { QuickActionButton } from '../../src/components/common/QuickActionButton';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { RangeNavigator } from '../../src/components/activity/RangeNavigator';
import { CycleCalendar } from '../../src/components/period/CycleCalendar';
import { periodCountdownCopy } from '../../src/components/home/PeriodCard';
import { DEFAULTS } from '../../src/constants/config';
import { REMINDER_TYPES } from '../../src/constants/reminderTypes';
import { usePeriodOverview } from '../../src/hooks/usePeriodOverview';
import { careActions } from '../../src/services/care/careActions';
import { endPeriod, removeCycle } from '../../src/services/period/periodService';
import { PressableScale } from '../../src/components/common/PressableScale';
import { categoryColors, colors } from '../../src/theme/colors';
import { radii } from '../../src/theme/radii';
import { layout, spacing } from '../../src/theme/spacing';
import { formatMonthYear, formatShortDate } from '../../src/utils/dates';
import { EMPTY_COPY } from '../../src/utils/copy';

const accent = categoryColors[REMINDER_TYPES.PERIOD];

function toDateSet(startDate, endDate) {
  if (!startDate) return [];
  const start = parseISO(startDate);
  const end = endDate ? parseISO(endDate) : start;
  return eachDayOfInterval({ start, end }).map((day) => format(day, 'yyyy-MM-dd'));
}

export default function PeriodScreen() {
  const { overview, reload } = usePeriodOverview();
  const [month, setMonth] = useState(() => new Date());
  const [picker, setPicker] = useState(null);

  const history = overview?.history;
  const hasHistory = Boolean(history?.length);

  // Every recorded cycle is marked, not only the most recent one, so scrolling
  // back through the calendar shows real history.
  const confirmedDates = useMemo(
    () => (history ?? []).flatMap((cycle) => toDateSet(cycle.startDate, cycle.endDate)),
    [history]
  );

  const estimatedNextDate = overview?.estimatedNextDate ?? null;

  const predictedDates = useMemo(() => {
    if (!estimatedNextDate) return [];
    const start = parseISO(estimatedNextDate);
    const end = addDays(start, DEFAULTS.averagePeriodDurationDays - 1);
    return eachDayOfInterval({ start, end }).map((day) => format(day, 'yyyy-MM-dd'));
  }, [estimatedNextDate]);

  const handleStart = useCallback(async () => {
    const result = await careActions.startPeriod(new Date());
    await reload();
    return result;
  }, [reload]);

  const handlePickStartDate = useCallback(() => {
    setPicker({ mode: 'START', value: new Date() });
  }, []);

  const handleEndPeriod = useCallback(() => {
    setPicker({ mode: 'END', value: new Date() });
  }, []);

  const handlePicked = useCallback(
    async (event, selected) => {
      const mode = picker?.mode;
      setPicker(null);
      if (event.type === 'dismissed' || !selected || !mode) return;

      const result =
        mode === 'START'
          ? await careActions.startPeriod(selected)
          : await endPeriod(selected);

      if (!result.ok) {
        Alert.alert('Couldn’t save that', result.message ?? 'Please try again.');
        return;
      }
      await reload();
    },
    [picker, reload]
  );

  const handleEditCycle = useCallback(
    (cycle) => {
      Alert.alert(
        `${formatShortDate(cycle.startDate)}`,
        'Remove this entry? Your estimate will be recalculated.',
        [
          { text: 'Keep it', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              await removeCycle(cycle.id);
              await reload();
            },
          },
        ]
      );
    },
    [reload]
  );

  const countdown = periodCountdownCopy(estimatedNextDate);
  const latestCycle = history?.[0] ?? null;
  const needsEnd = Boolean(latestCycle && !latestCycle.endDate);

  return (
    <ScreenContainer tone="period">
      <AppHeader title="Period" subtitle="Private, kept on this device, and always an estimate." />

      <Card tint={accent.tint} style={styles.hero}>
        {estimatedNextDate ? (
          <>
            <AppText variant="overline" color={accent.deep}>
              Expected around
            </AppText>
            <AppText variant="display" numberOfLines={1} style={styles.heroDate}>
              {formatShortDate(estimatedNextDate)}
            </AppText>
            {countdown ? <AppText variant="body">{countdown}</AppText> : null}
            <View style={styles.heroMeta}>
              <AppText variant="caption" color={accent.deep}>
                {overview.isFallbackEstimate
                  ? `Based on your set average of ${overview.averageCycleLengthDays} days`
                  : `Based on your recorded average of ${overview.averageCycleLengthDays} days`}
              </AppText>
            </View>
          </>
        ) : (
          <>
            <AppText variant="overline" color={accent.deep}>
              No estimate yet
            </AppText>
            <AppText variant="h2" style={styles.heroDate}>
              Let’s begin whenever you’re ready
            </AppText>
            <AppText variant="body">{EMPTY_COPY.noPeriodHistory}</AppText>
          </>
        )}

        <QuickActionButton
          type={REMINDER_TYPES.PERIOD}
          label="Period started today"
          confirmedLabel="Logged 🌸"
          icon={Flower2}
          onPress={handleStart}
          fullWidth
          style={styles.heroAction}
        />

        <View style={styles.secondaryRow}>
          <PressableScale
            onPress={handlePickStartDate}
            haptic="press"
            scaleTo={0.97}
            style={[styles.secondary, { backgroundColor: accent.tint }]}
          >
            <CalendarPlus size={15} color={accent.deep} strokeWidth={2.3} />
            <AppText variant="caption" color={accent.deep} numberOfLines={1}>
              Another date
            </AppText>
          </PressableScale>

          {needsEnd ? (
            <PressableScale
              onPress={handleEndPeriod}
              haptic="press"
              scaleTo={0.97}
              style={[styles.secondary, { backgroundColor: accent.tint }]}
            >
              <Check size={15} color={accent.deep} strokeWidth={2.6} />
              <AppText variant="caption" color={accent.deep} numberOfLines={1}>
                Period ended
              </AppText>
            </PressableScale>
          ) : null}
        </View>
      </Card>

      {picker ? (
        <DateTimePicker
          value={picker.value}
          mode="date"
          maximumDate={new Date()}
          onChange={handlePicked}
        />
      ) : null}

      <SectionHeader title="Calendar" style={styles.section} />
      <Card>
        <RangeNavigator
          label={formatMonthYear(month)}
          onPrevious={() => setMonth((current) => addMonths(current, -1))}
          onNext={() => setMonth((current) => addMonths(current, 1))}
          canGoForward
        />
        <CycleCalendar
          month={month}
          confirmedDates={confirmedDates}
          predictedDates={predictedDates}
          style={styles.calendar}
        />
      </Card>

      <SectionHeader
        title="Cycle history"
        caption={hasHistory ? `${overview.cycleCount} recorded` : undefined}
        style={styles.section}
      />
      {hasHistory ? (
        <Card>
          {history.map((cycle, index) => (
            <PressableScale
              key={cycle.id}
              onPress={() => handleEditCycle(cycle)}
              haptic="press"
              scaleTo={0.99}
              accessibilityLabel={`Cycle starting ${formatShortDate(cycle.startDate)}`}
              style={[styles.historyRow, index > 0 && styles.historyRowDivided]}
            >
              <View style={styles.historyDates}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {cycle.endDate
                    ? `${formatShortDate(cycle.startDate)} – ${formatShortDate(cycle.endDate)}`
                    : formatShortDate(cycle.startDate)}
                </AppText>
                <AppText variant="caption">
                  {cycle.cycleLengthDays
                    ? `Cycle length ${cycle.cycleLengthDays} days`
                    : 'First recorded cycle'}
                </AppText>
              </View>
            </PressableScale>
          ))}
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={CalendarHeart}
            title="No cycles recorded yet"
            message={EMPTY_COPY.noPeriodHistory}
            tint={accent.tint}
            iconColor={accent.deep}
            compact
          />
        </Card>
      )}

      <View style={styles.disclaimer}>
        <Info size={13} color={colors.textMuted} strokeWidth={2.2} />
        <AppText variant="caption" style={styles.disclaimerText}>
          Predictions are based on the dates you record and cycles can naturally vary.
        </AppText>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: spacing.lg,
  },
  heroDate: {
    marginTop: 2,
    marginBottom: 2,
  },
  heroMeta: {
    marginTop: spacing.sm,
  },
  heroAction: {
    marginTop: spacing.lg,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  secondary: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill,
  },
  section: {
    marginTop: layout.sectionGap,
  },
  calendar: {
    marginTop: spacing.base,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  historyRowDivided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
  },
  historyDates: {
    flex: 1,
    minWidth: 0,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.base,
    paddingHorizontal: spacing.xs,
  },
  disclaimerText: {
    flex: 1,
    minWidth: 0,
  },
  notice: {
    marginTop: spacing.lg,
  },
});
