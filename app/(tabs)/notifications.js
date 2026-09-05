import { StyleSheet, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';

import { AppHeader } from '../../src/components/common/AppHeader';
import { Card } from '../../src/components/common/Card';
import { DevelopmentNotice } from '../../src/components/common/DevelopmentNotice';
import { EmptyState } from '../../src/components/common/EmptyState';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { NotificationItem } from '../../src/components/notifications/NotificationItem';
import { EMPTY_COPY } from '../../src/utils/copy';
import { colors } from '../../src/theme/colors';
import { layout, spacing } from '../../src/theme/spacing';

/**
 * Inbox shell.
 *
 * The grouped timeline is real code, but nothing is fabricated: with no
 * notification history yet the screen shows its genuine empty state.
 */
const GROUPS = [];

export default function NotificationsScreen() {
  const hasItems = GROUPS.length > 0;

  return (
    <ScreenContainer tone="notifications">
      <AppHeader
        title="Inbox"
        subtitle="Every reminder HerCue sends will be kept here, so nothing quietly disappears."
      />

      {hasItems ? (
        GROUPS.map((group) => (
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
        title="Notification history arrives in a later update"
        message="Delivery, read state and deep links land once the reminder engine is switched on."
        style={styles.notice}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
