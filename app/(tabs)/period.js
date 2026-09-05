import { useMemo, useState } from 'react';
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
import { useDashboard } from '../../src/hooks/useDashboard';
import { careActions } from '../../src/services/care/careActions';
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
  const { data } = useDashboard();
  const period = data.period;
  const [month, setMonth] = useState(() => new Date());

  const confirmedDates = useMemo(
    () => toDateSet(period.lastStartDate, period.lastEndDate),
    [period.lastStartDate, period.lastEndDate]
  );

  const predictedDates = useMemo(() => {
    if (!period.estimatedNextDate) return [];
    const start = parseISO(period.estimatedNextDate);
    const end = addDays(start, DEFAULTS.averagePeriodDurationDays - 1);
    return eachDayOfInterval({ start, end }).map((day) => format(day, 'yyyy-MM-dd'));
  }, [period.estimatedNextDate]);

  const countdown = periodCountdownCopy(period.estimatedNextDate);
  const hasHistory = Boolean(period.lastStartDate);

  return (
    <ScreenContainer tone="period">
      <AppHeader title="Period" subtitle="Private, kept on this device, and always an estimate." />

      <Card tint={accent.tint} style={styles.hero}>
        {period.estimatedNextDate ? (
          <>
            <AppText variant="overline" color={accent.deep}>
              Expected around
            </AppText>
            <AppText variant="display" numberOfLines={1} style={styles.heroDate}>
              {formatShortDate(period.estimatedNextDate)}
            </AppText>
            {countdown ? <AppText variant="body">{countdown}</AppText> : null}
            {period.averageCycleLengthDays ? (
              <View style={styles.heroMeta}>
                <AppText variant="caption" color={accent.deep}>
                  {`Based on an average ${period.averageCycleLengthDays}-day cycle`}
                </AppText>
              </View>
            ) : null}
          </>
        ) : (
          <>
            <AppText variant="overline" color={accent.deep}>
              No estimate yet
            </AppText>
            <AppText variant="h2" style={styles.heroDate}>
              {hasHistory ? 'One more cycle to go' : 'Let’s begin whenever you’re ready'}
            </AppText>
            <AppText variant="body">
              {hasHistory
                ? 'After the next start date, HerCue can estimate the following one.'
                : EMPTY_COPY.noPeriodHistory}
            </AppText>
          </>
        )}

        <QuickActionButton
          type={REMINDER_TYPES.PERIOD}
          label="Period started today"
          confirmedLabel="Logged 🌸"
          icon={Flower2}
          onPress={() => careActions.startPeriod(new Date())}
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

      <SectionHeader title="Cycle history" style={styles.section} />
      {hasHistory ? (
        <Card>
          <View style={styles.historyRow}>
            <View style={styles.historyDates}>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {period.lastEndDate
                  ? `${formatShortDate(period.lastStartDate)} – ${formatShortDate(period.lastEndDate)}`
                  : formatShortDate(period.lastStartDate)}
              </AppText>
              <AppText variant="caption">
                {period.averageCycleLengthDays
                  ? `Average cycle ${period.averageCycleLengthDays} days`
                  : 'Cycle length available after the next start date'}
              </AppText>
            </View>
            <View style={styles.historyCount}>
              <AppText variant="caption" color={accent.deep}>
                {`${period.cycleCount} recorded`}
              </AppText>
            </View>
          </View>
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
        title="Cycle storage and estimates arrive in a later update"
        message="Editing history, end dates and gentle expected-period reminders come with the period module."
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
  },
  historyDates: {
    flex: 1,
    minWidth: 0,
  },
  historyCount: {
    flexShrink: 0,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.pill,
    backgroundColor: accent.tint,
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
