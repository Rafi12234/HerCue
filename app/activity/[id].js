import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { AppHeader } from '../../src/components/common/AppHeader';
import { AppText } from '../../src/components/common/AppText';
import { Card } from '../../src/components/common/Card';
import { CategoryIcon } from '../../src/components/common/CategoryIcon';
import { EmptyState } from '../../src/components/common/EmptyState';
import { IconButton } from '../../src/components/common/IconButton';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { StatusBadge } from '../../src/components/common/StatusBadge';
import { REMINDER_TYPE_META } from '../../src/constants/reminderTypes';
import { ACTIVITY_ACTION_LABELS } from '../../src/constants/statuses';
import { getActivityById } from '../../src/database/repositories/activityRepository';
import { getMedicine } from '../../src/database/repositories/medicineRepository';
import { categoryColors, colors } from '../../src/theme/colors';
import { layout, spacing } from '../../src/theme/spacing';
import { formatClock, formatFullDate } from '../../src/utils/dates';

const SOURCE_LABELS = {
  REMINDER_ACTION: 'From a reminder',
  MANUAL: 'Logged by you',
  SYSTEM: 'Recorded automatically',
};

function Row({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <AppText variant="caption" color={colors.textMuted} style={styles.rowLabel}>
        {label}
      </AppText>
      <AppText variant="body" numberOfLines={2} style={styles.rowValue}>
        {value}
      </AppText>
    </View>
  );
}

/** Read-only detail for one recorded activity (doc 08 §12). */
export default function ActivityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [activity, setActivity] = useState(null);
  const [medicine, setMedicine] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    (async () => {
      const found = await getActivityById(String(id));
      setActivity(found);
      setStatus(found ? 'ready' : 'missing');
      if (found?.medicineId) setMedicine(await getMedicine(found.medicineId));
    })();
  }, [id]);

  const accent = activity ? (categoryColors[activity.type] ?? categoryColors.WATER) : null;

  return (
    <ScreenContainer tone="activity">
      <View style={styles.backRow}>
        <IconButton icon={ChevronLeft} onPress={() => router.back()} accessibilityLabel="Go back" />
      </View>

      {status === 'missing' ? (
        <Card>
          <EmptyState
            title="That entry is no longer here"
            message="It may have been removed when data was cleared."
          />
        </Card>
      ) : activity ? (
        <>
          <AppHeader
            title={REMINDER_TYPE_META[activity.type]?.label ?? activity.type}
            subtitle={formatFullDate(activity.occurredAt)}
          />

          <Card tint={accent.tint} style={styles.hero}>
            <View style={styles.heroRow}>
              <CategoryIcon type={activity.type} size="lg" solid />
              <View style={styles.heroText}>
                <AppText variant="h2" numberOfLines={2}>
                  {ACTIVITY_ACTION_LABELS[activity.action] ?? activity.action}
                </AppText>
                <AppText variant="metricSmall" color={accent.deep}>
                  {formatClock(activity.occurredAt)}
                </AppText>
              </View>
            </View>
            <StatusBadge status={activity.status} style={styles.badge} />
          </Card>

          <Card style={styles.details}>
            <Row label="Happened at" value={formatClock(activity.occurredAt)} />
            <Row
              label="Was scheduled for"
              value={activity.scheduledAt ? formatClock(activity.scheduledAt) : null}
            />
            <Row label="Source" value={SOURCE_LABELS[activity.source] ?? activity.source} />
            <Row label="Medicine" value={medicine?.name} />
            <Row
              label="Dose"
              value={[medicine?.dosage, medicine?.instructions].filter(Boolean).join(' · ') || null}
            />
          </Card>
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: 'row',
    marginBottom: spacing.base,
  },
  hero: {
    padding: spacing.lg,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  heroText: {
    flex: 1,
    minWidth: 0,
  },
  badge: {
    marginTop: spacing.base,
  },
  details: {
    marginTop: layout.cardGap,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    width: 118,
    flexShrink: 0,
  },
  rowValue: {
    flex: 1,
    minWidth: 0,
  },
});
