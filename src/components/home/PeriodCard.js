import { StyleSheet, View } from 'react-native';
import { ChevronRight, Flower2 } from 'lucide-react-native';

import { REMINDER_TYPES } from '../../constants/reminderTypes';
import { categoryColors, colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { daysBetweenCalendarDates, formatShortDate } from '../../utils/dates';
import { EMPTY_COPY } from '../../utils/copy';
import { AppText } from '../common/AppText';
import { PressableScale } from '../common/PressableScale';
import { CareCard } from './CareCard';

const accent = categoryColors[REMINDER_TYPES.PERIOD];

/**
 * Estimate wording per `docs/09_PERIOD_TRACKER_SPEC.md` §7 — always
 * "expected around", never "late" and never a guaranteed date.
 */
export function periodCountdownCopy(estimatedNextDate, now = new Date()) {
  if (!estimatedNextDate) return null;

  const days = daysBetweenCalendarDates(now, estimatedNextDate);
  if (days === null) return null;
  if (days === 0) return 'Expected around today';
  if (days > 0) return `Expected in about ${days} ${days === 1 ? 'day' : 'days'}`;
  return 'The estimate has passed — log the new start date whenever it begins.';
}

export function PeriodCard({ period, onOpenPeriod, highlightTrigger, style }) {
  const hasHistory = Boolean(period?.lastStartDate);
  const countdown = periodCountdownCopy(period?.estimatedNextDate);

  return (
    <CareCard
      type={REMINDER_TYPES.PERIOD}
      title="Period"
      subtitle={
        hasHistory
          ? `Last started ${formatShortDate(period.lastStartDate)}`
          : 'Not tracked yet'
      }
      highlightTrigger={highlightTrigger}
      style={style}
      onPress={onOpenPeriod}
      trailing={<ChevronRight size={18} color={colors.textFaint} />}
      footer={
        <PressableScale
          onPress={onOpenPeriod}
          scaleTo={0.98}
          haptic="selection"
          style={styles.link}
          accessibilityLabel="Open period tracking"
        >
          <Flower2 size={15} color={accent.deep} strokeWidth={2.2} />
          <AppText variant="button" color={accent.deep}>
            {hasHistory ? 'Open period' : 'Start tracking'}
          </AppText>
        </PressableScale>
      }
    >
      {period?.estimatedNextDate ? (
        <View style={styles.estimate}>
          <AppText variant="overline" color={accent.deep}>
            Expected around
          </AppText>
          <AppText variant="metric" numberOfLines={1} style={styles.date}>
            {formatShortDate(period.estimatedNextDate)}
          </AppText>
          {countdown ? (
            <AppText variant="caption" numberOfLines={2}>
              {countdown}
            </AppText>
          ) : null}
        </View>
      ) : (
        <AppText variant="body">
          {hasHistory
            ? 'One more cycle and HerCue can estimate the next one.'
            : EMPTY_COPY.noPeriodHistory}
        </AppText>
      )}
    </CareCard>
  );
}

const styles = StyleSheet.create({
  estimate: {
    padding: spacing.base,
    borderRadius: radii.lg,
    backgroundColor: accent.tint,
  },
  date: {
    marginTop: 2,
    marginBottom: 2,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill,
    backgroundColor: accent.tint,
  },
});
