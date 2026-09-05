import { StyleSheet, View } from 'react-native';
import { Clock3, Droplet, Plus } from 'lucide-react-native';

import { REMINDER_TYPES } from '../../constants/reminderTypes';
import { categoryColors, colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { formatClock, formatRelativeToNow } from '../../utils/dates';
import { AppText } from '../common/AppText';
import { InfoPill } from '../common/IconButton';
import { ProgressBar } from '../common/ProgressBar';
import { QuickActionButton } from '../common/QuickActionButton';
import { CareCard } from './CareCard';

const accent = categoryColors[REMINDER_TYPES.WATER];

export function WaterCard({ water, progress, onDrink, highlightTrigger, style }) {
  const hasGoal = Boolean(water?.goal);
  const isEnabled = Boolean(water?.enabled);

  return (
    <CareCard
      type={REMINDER_TYPES.WATER}
      title="Water"
      subtitle={
        water?.lastConfirmedAt
          ? `Last sip ${formatRelativeToNow(water.lastConfirmedAt)}`
          : 'No sips recorded today yet'
      }
      highlightTrigger={highlightTrigger}
      style={style}
      trailing={
        hasGoal ? (
          <View style={styles.count}>
            <AppText variant="metricSmall" color={accent.deep}>
              {water.count}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {` / ${water.goal}`}
            </AppText>
          </View>
        ) : null
      }
      footer={
        <View style={styles.footer}>
          {isEnabled && water?.nextReminderAt ? (
            <InfoPill icon={Clock3} tint={accent.tint} color={accent.deep}>
              <AppText variant="caption" color={accent.deep} numberOfLines={1}>
                Next {formatClock(water.nextReminderAt)}
              </AppText>
            </InfoPill>
          ) : (
            <InfoPill>
              <AppText variant="caption" numberOfLines={1}>
                Reminders off
              </AppText>
            </InfoPill>
          )}

          <QuickActionButton
            type={REMINDER_TYPES.WATER}
            label="Drank"
            confirmedLabel="Noted"
            icon={Plus}
            onPress={onDrink}
            style={styles.action}
          />
        </View>
      }
    >
      <View style={styles.progressRow}>
        <ProgressBar
          value={progress}
          fillColor={accent.base}
          trackColor={accent.tint}
          height={9}
          style={styles.progress}
        />
        <Droplet size={13} color={accent.base} strokeWidth={2.3} />
      </View>
    </CareCard>
  );
}

const styles = StyleSheet.create({
  count: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progress: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  action: {
    flexShrink: 0,
  },
});
