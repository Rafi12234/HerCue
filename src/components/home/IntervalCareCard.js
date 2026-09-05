import { StyleSheet, View } from 'react-native';
import { Check, Clock3 } from 'lucide-react-native';

import { categoryColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { formatClock, formatRelativeToNow } from '../../utils/dates';
import { AppText } from '../common/AppText';
import { InfoPill } from '../common/IconButton';
import { QuickActionButton } from '../common/QuickActionButton';
import { CareCard } from './CareCard';

/**
 * Half-width card shared by Bathroom and Food — both are simply "when was the
 * last time, when is the next check".
 */
export function IntervalCareCard({
  type,
  title,
  lastConfirmedAt,
  nextAt,
  emptyLabel,
  actionLabel,
  enabled,
  onConfirm,
  highlightTrigger,
  style,
}) {
  const accent = categoryColors[type];

  return (
    <CareCard
      type={type}
      title={title}
      compact
      highlightTrigger={highlightTrigger}
      style={style}
      footer={
        <QuickActionButton
          type={type}
          label={actionLabel}
          confirmedLabel="Noted"
          icon={Check}
          onPress={onConfirm}
          fullWidth
        />
      }
    >
      <View style={styles.body}>
        <AppText variant="metricSmall" numberOfLines={1}>
          {lastConfirmedAt ? formatRelativeToNow(lastConfirmedAt) : '—'}
        </AppText>
        <AppText variant="caption" numberOfLines={2}>
          {lastConfirmedAt ? 'since the last one' : emptyLabel}
        </AppText>

        {enabled && nextAt ? (
          <InfoPill icon={Clock3} tint={accent.tint} color={accent.deep} style={styles.pill}>
            <AppText variant="caption" color={accent.deep} numberOfLines={1}>
              {formatClock(nextAt)}
            </AppText>
          </InfoPill>
        ) : (
          <InfoPill style={styles.pill}>
            <AppText variant="caption" numberOfLines={1}>
              Reminders off
            </AppText>
          </InfoPill>
        )}
      </View>
    </CareCard>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 2,
  },
  pill: {
    marginTop: spacing.sm + 2,
  },
});
