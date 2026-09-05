import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Sparkles } from 'lucide-react-native';

import { AppHeader } from '../../src/components/common/AppHeader';
import { AppText } from '../../src/components/common/AppText';
import { Card } from '../../src/components/common/Card';
import { DevelopmentNotice } from '../../src/components/common/DevelopmentNotice';
import { EmptyState } from '../../src/components/common/EmptyState';
import { PressableScale } from '../../src/components/common/PressableScale';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { NotificationItem } from '../../src/components/notifications/NotificationItem';
import { getInbox, markAllRead } from '../../src/services/notification/inboxService';
import { EMPTY_COPY } from '../../src/utils/copy';
import { colors } from '../../src/theme/colors';
import { layout, spacing } from '../../src/theme/spacing';
import { LOG_CATEGORY, logger } from '../../src/utils/logger';

/**
 * Inbox.
 *
 * Grouping and read state are backed by `notification_history`. Nothing writes
 * to that table until the reminder engine starts delivering, so the genuine
 * empty state is what shows today.
 */
export default function NotificationsScreen() {
  const [inbox, setInbox] = useState({ groups: [], unreadCount: 0, totalCount: 0 });

  const load = useCallback(async () => {
    try {
      setInbox(await getInbox());
    } catch (error) {
      logger.error(LOG_CATEGORY.NOTIFICATION, 'Could not load the inbox', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead();
    await load();
  }, [load]);

  const hasItems = inbox.groups.length > 0;

  return (
    <ScreenContainer tone="notifications">
      <AppHeader
        title="Inbox"
        subtitle="Every reminder HerCue sends will be kept here, so nothing quietly disappears."
        trailing={
          inbox.unreadCount > 0 ? (
            <PressableScale onPress={handleMarkAllRead} haptic="press" style={styles.markAll}>
              <AppText variant="caption" color={colors.accentDeep}>
                Mark all read
              </AppText>
            </PressableScale>
          ) : null
        }
      />

      {hasItems ? (
        inbox.groups.map((group) => (
          <View key={group.label} style={styles.group}>
            <SectionHeader title={group.label} />
            <Card padded={false} style={styles.groupCard}>
              {group.items.map((item, index) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  isLast={index === group.items.length - 1}
                />
              ))}
            </Card>
          </View>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <EmptyState
            icon={Sparkles}
            title={EMPTY_COPY.noNotifications}
            message="Reminders you receive will appear here, grouped by day, with what you replied."
          />
        </Card>
      )}

      <DevelopmentNotice
        title="Reminder delivery arrives in a later update"
        message="The inbox is already reading from your device's storage — it fills up once reminders start being sent."
        style={styles.notice}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  markAll: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  group: {
    marginBottom: layout.sectionGap,
  },
  groupCard: {
    paddingHorizontal: layout.cardPadding,
  },
  emptyCard: {
    backgroundColor: colors.surface,
  },
  notice: {
    marginTop: spacing.lg,
  },
});
