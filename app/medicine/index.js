import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Pill } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '../../src/components/common/AppHeader';
import { AppText } from '../../src/components/common/AppText';
import { Card } from '../../src/components/common/Card';
import { DevelopmentNotice } from '../../src/components/common/DevelopmentNotice';
import { EmptyState } from '../../src/components/common/EmptyState';
import { IconButton } from '../../src/components/common/IconButton';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { useDashboard } from '../../src/hooks/useDashboard';
import { OCCURRENCE_STATUS } from '../../src/constants/statuses';
import { StatusBadge } from '../../src/components/common/StatusBadge';
import { categoryColors, colors } from '../../src/theme/colors';
import { layout, spacing } from '../../src/theme/spacing';
import { formatClock } from '../../src/utils/dates';
import { EMPTY_COPY } from '../../src/utils/copy';

const accent = categoryColors.MEDICINE;

/**
 * Medicine list shell.
 *
 * Reached from Home so the card's entry point is real. Adding and editing
 * medicines belongs to the medicine module, and is shown here as an explicit
 * development state rather than a button that does nothing.
 */
export default function MedicineListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data } = useDashboard();
  const doses = data.medicine?.doses ?? [];

  return (
    <ScreenContainer tone="home" contentContainerStyle={{ paddingBottom: spacing.xxxl + insets.bottom }}>
      <View style={styles.backRow}>
        <IconButton
          icon={ChevronLeft}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        />
      </View>

      <AppHeader
        title="Medicines"
        subtitle="What is scheduled today, and everything you have added."
      />

      <SectionHeader title="Today" />
      {doses.length > 0 ? (
        <Card padded={false} style={styles.listCard}>
          {doses.map((dose, index) => (
            <View
              key={dose.id}
              style={[styles.row, index === doses.length - 1 && styles.rowLast]}
            >
              <AppText variant="caption" color={accent.deep} style={styles.time}>
                {formatClock(dose.scheduledAt)}
              </AppText>

              <View style={styles.info}>
                <AppText variant="bodyStrong" numberOfLines={2}>
                  {dose.name}
                </AppText>
                {dose.dosage || dose.instruction ? (
                  <AppText variant="caption" numberOfLines={2}>
                    {[dose.dosage, dose.instruction].filter(Boolean).join(' · ')}
                  </AppText>
                ) : null}
              </View>

              <StatusBadge
                status={dose.status}
                label={dose.status === OCCURRENCE_STATUS.COMPLETED ? 'Taken' : 'Upcoming'}
                style={styles.badge}
              />
            </View>
          ))}
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={Pill}
            title={EMPTY_COPY.noMedicines}
            message="Add a medicine whenever you need one and it will show up here."
            tint={accent.tint}
            iconColor={accent.deep}
            compact
          />
        </Card>
      )}

      <DevelopmentNotice
        title="Adding and editing medicines arrives in a later update"
        message="Names, dosages, times and repeat days come with the medicine module, together with Taken, Snooze and Skip."
        style={styles.notice}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: 'row',
    marginBottom: spacing.base,
  },
  listCard: {
    paddingHorizontal: layout.cardPadding,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  time: {
    width: 62,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  badge: {
    flexShrink: 0,
  },
  notice: {
    marginTop: spacing.lg,
  },
});
