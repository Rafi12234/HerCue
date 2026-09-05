import { StyleSheet, View } from 'react-native';
import { BellOff, Clock3 } from 'lucide-react-native';

import { REMINDER_TYPE_META } from '../../constants/reminderTypes';
import { categoryColors, colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { formatClock, formatRelativeToNow } from '../../utils/dates';
import { AppText } from '../common/AppText';
import { Card } from '../common/Card';
import { CategoryIcon } from '../common/CategoryIcon';

/**
 * The "what matters next" hero.
 *
 * Tapping it highlights the matching care card further down rather than
 * navigating to a screen that does not exist yet.
 */
export function NextReminderCard({ reminder, onPress }) {
  if (!reminder) {
    return (
      <Card style={styles.card} tint={colors.surface}>
        <View style={styles.emptyRow}>
          <View style={styles.emptyIcon}>
            <BellOff size={19} color={colors.textMuted} strokeWidth={2} />
          </View>
          <View style={styles.emptyText}>
            <AppText variant="h3">No reminders set yet</AppText>
            <AppText variant="caption" style={styles.emptyCaption}>
              Once your reminders are switched on, the next one will always live here.
            </AppText>
          </View>
        </View>
      </Card>
    );
  }

  const accent = categoryColors[reminder.type] ?? categoryColors.WATER;
  const meta = REMINDER_TYPE_META[reminder.type];

  return (
    <Card
      style={[styles.card, { borderColor: accent.glow }]}
      tint={accent.tint}
      onPress={onPress}
      accessibilityLabel={`Next reminder: ${reminder.title}, ${formatRelativeToNow(reminder.at)}`}
    >
      <View style={styles.header}>
        <AppText variant="overline" color={accent.deep}>
          {reminder.isOverdue ? 'Waiting for you' : 'Next up'}
        </AppText>
        <View style={[styles.categoryTag, { backgroundColor: accent.glow }]}>
          <AppText variant="caption" color={accent.deep} numberOfLines={1}>
            {meta?.label ?? reminder.type}
          </AppText>
        </View>
      </View>

      <View style={styles.body}>
        <CategoryIcon type={reminder.type} size="lg" solid />

        <View style={styles.copy}>
          <AppText variant="h1" numberOfLines={2}>
            {reminder.title}
          </AppText>
          <AppText variant="body" numberOfLines={2} style={styles.detail}>
            {reminder.detail}
          </AppText>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={[styles.timePill, { backgroundColor: colors.surface }]}>
          <Clock3 size={13} color={accent.deep} strokeWidth={2.3} />
          <AppText variant="bodyStrong" color={accent.deep} numberOfLines={1}>
            {formatClock(reminder.at)}
          </AppText>
        </View>

        <AppText variant="caption" color={accent.deep} numberOfLines={1} style={styles.relative}>
          {formatRelativeToNow(reminder.at)}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  categoryTag: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.pill,
    flexShrink: 1,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginTop: spacing.base,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  detail: {
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    flexShrink: 1,
  },
  relative: {
    flexShrink: 1,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSunken,
  },
  emptyText: {
    flex: 1,
    minWidth: 0,
  },
  emptyCaption: {
    marginTop: 2,
  },
});
