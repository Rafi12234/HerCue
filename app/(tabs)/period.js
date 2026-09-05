import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { addDays, addMonths, eachDayOfInterval, format, parseISO } from 'date-fns';
import { CalendarHeart, Flower2, Info } from 'lucide-react-native';

import { AppHeader } from '../../src/components/common/AppHeader';
import { AppText } from '../../src/components/common/AppText';
import { Card } from '../../src/components/common/Card';
import { DevelopmentNotice } from '../../src/components/common/DevelopmentNotice';
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
import { categoryColors, colors } from '../../src/theme/colors';
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

  const countdown = periodCountdownCopy(estimatedNextDate);

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
      </Card>

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
            <View
              key={cycle.id}
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
            </View>
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

      <DevelopmentNotice
        title="End dates, editing and expected-period reminders come later"
        message="Cycle starts and the next-date estimate are saved on this device now."
        style={styles.notice}
      />
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
