import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, Pencil, Pill, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '../../src/components/common/AppHeader';
import { AppText } from '../../src/components/common/AppText';
import { Card } from '../../src/components/common/Card';
import { EmptyState } from '../../src/components/common/EmptyState';
import { IconButton } from '../../src/components/common/IconButton';
import { PressableScale } from '../../src/components/common/PressableScale';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { SettingsRow } from '../../src/components/common/SettingsRow';
import { useDashboard } from '../../src/hooks/useDashboard';
import { OCCURRENCE_STATUS } from '../../src/constants/statuses';
import { StatusBadge } from '../../src/components/common/StatusBadge';
import { listMedicines, setActive } from '../../src/services/medicine/medicineService';
import { categoryColors, colors } from '../../src/theme/colors';
import { radii } from '../../src/theme/radii';
import { layout, spacing } from '../../src/theme/spacing';
import { formatClock, formatScheduleTime } from '../../src/utils/dates';
import { EMPTY_COPY } from '../../src/utils/copy';
import { LOG_CATEGORY, logger } from '../../src/utils/logger';

const accent = categoryColors.MEDICINE;

function describeSchedules(schedules) {
  if (!schedules?.length) return 'No times set';
  const times = schedules.map((schedule) => formatScheduleTime(schedule.timeOfDay)).join(' · ');
  const repeat = schedules[0].repeatType === 'DAYS_OF_WEEK' ? 'selected days' : 'every day';
  return `${times} · ${repeat}`;
}

export default function MedicineListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data } = useDashboard();
  const doses = data.medicine?.doses ?? [];

  const [medicines, setMedicines] = useState([]);

  const load = useCallback(async () => {
    try {
      setMedicines(await listMedicines());
    } catch (error) {
      logger.error(LOG_CATEGORY.DB, 'Could not load medicines', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleToggle = useCallback(
    async (medicine) => {
      await setActive(medicine.id, !medicine.active);
      await load();
    },
    [load]
  );

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
        subtitle="Only what you add — HerCue never suggests a medicine or a dose."
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

      {medicines.length > 0 ? (
        <>
          <SectionHeader
            title="All medicines"
            caption={`${medicines.length} saved`}
            style={styles.section}
          />
          <Card padded={false} style={styles.listCard}>
            {medicines.map((medicine, index) => (
              <SettingsRow
                key={medicine.id}
                icon={Pill}
                label={medicine.name}
                description={[medicine.dosage, describeSchedules(medicine.schedules)]
                  .filter(Boolean)
                  .join(' · ')}
                toggleValue={medicine.active}
                onToggle={() => handleToggle(medicine)}
                iconTint={accent.tint}
                iconColor={accent.deep}
                isLast={index === medicines.length - 1}
              />
            ))}
          </Card>

          <Card padded={false} style={[styles.listCard, styles.editCard]}>
            {medicines.map((medicine, index) => (
              <SettingsRow
                key={`edit-${medicine.id}`}
                icon={Pencil}
                label={`Edit ${medicine.name}`}
                description="Times, dose, instructions and dates"
                onPress={() => router.push(`/medicine/form?id=${medicine.id}`)}
                iconTint={accent.tint}
                iconColor={accent.deep}
                isLast={index === medicines.length - 1}
              />
            ))}
          </Card>
        </>
      ) : null}

      <PressableScale
        onPress={() => router.push('/medicine/form')}
        haptic="press"
        scaleTo={0.97}
        style={[styles.add, { backgroundColor: accent.base }]}
      >
        <Plus size={18} color="#FFFFFF" strokeWidth={2.6} />
        <AppText variant="button" color="#FFFFFF">
          Add a medicine
        </AppText>
      </PressableScale>
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
  section: {
    marginTop: layout.sectionGap,
  },
  editCard: {
    marginTop: spacing.sm,
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
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: layout.sectionGap,
    paddingVertical: spacing.base,
    borderRadius: radii.pill,
  },
});
