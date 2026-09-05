import { StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { REMINDER_TYPES } from '../../constants/reminderTypes';
import { OCCURRENCE_STATUS } from '../../constants/statuses';
import { categoryColors, colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { formatClock } from '../../utils/dates';
import { EMPTY_COPY } from '../../utils/copy';
import { AppText } from '../common/AppText';
import { PressableScale } from '../common/PressableScale';
import { StatusBadge } from '../common/StatusBadge';
import { CareCard } from './CareCard';

const accent = categoryColors[REMINDER_TYPES.MEDICINE];

function DoseRow({ dose, isLast }) {
  const isDone = dose.status === OCCURRENCE_STATUS.COMPLETED;

  return (
    <View style={[styles.doseRow, !isLast && styles.doseDivider]}>
      <AppText
        variant="caption"
        color={isDone ? colors.textMuted : accent.deep}
        style={styles.doseTime}
      >
        {formatClock(dose.scheduledAt)}
      </AppText>

      <View style={styles.doseInfo}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {dose.name}
        </AppText>
        {dose.dosage || dose.instruction ? (
          <AppText variant="caption" numberOfLines={1}>
            {[dose.dosage, dose.instruction].filter(Boolean).join(' · ')}
          </AppText>
        ) : null}
      </View>

      <StatusBadge
        status={dose.status}
        label={isDone ? 'Taken' : 'Upcoming'}
        style={styles.doseStatus}
      />
    </View>
  );
}

/**
 * Deliberately calm — medicine is not framed as a warning. The quick action
 * opens today's list rather than completing every dose at once.
 */
export function MedicineCard({ medicine, onOpenList, highlightTrigger, style }) {
  const hasDoses = Boolean(medicine?.doses?.length);

  return (
    <CareCard
      type={REMINDER_TYPES.MEDICINE}
      title="Medicine"
      subtitle={
        hasDoses
          ? `${medicine.takenCount} of ${medicine.scheduledCount} taken today`
          : 'Nothing scheduled today'
      }
      highlightTrigger={highlightTrigger}
      style={style}
      footer={
        <PressableScale
          onPress={onOpenList}
          scaleTo={0.98}
          haptic="selection"
          style={styles.link}
          accessibilityLabel="Open medicine list"
        >
          <AppText variant="button" color={accent.deep}>
            {hasDoses ? 'View all medicines' : 'Manage medicines'}
          </AppText>
          <ChevronRight size={16} color={accent.deep} strokeWidth={2.4} />
        </PressableScale>
      }
    >
      {hasDoses ? (
        <View style={styles.doses}>
          {medicine.doses.map((dose, index) => (
            <DoseRow key={dose.id} dose={dose} isLast={index === medicine.doses.length - 1} />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <AppText variant="body">{EMPTY_COPY.noMedicines}</AppText>
        </View>
      )}
    </CareCard>
  );
}

const styles = StyleSheet.create({
  doses: {
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
  },
  doseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  doseDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  doseTime: {
    width: 62,
    flexShrink: 0,
  },
  doseInfo: {
    flex: 1,
    minWidth: 0,
  },
  doseStatus: {
    flexShrink: 0,
  },
  empty: {
    paddingVertical: spacing.sm,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill,
    backgroundColor: accent.tint,
  },
});
