import { StyleSheet, View } from 'react-native';

import { AppText } from '../common/AppText';
import { PreviewDataBadge } from '../common/DevelopmentNotice';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { formatFullDate, greetingForDate } from '../../utils/dates';
import { greetingOrnament, greetingSubtitle } from '../../utils/copy';

/** Greeting, date and the one affectionate line that sets the tone of the app. */
export function HomeHeader({ showPreviewBadge = false, now = new Date() }) {
  return (
    <View style={styles.container}>
      <AppText variant="overline" color={colors.textFaint}>
        {formatFullDate(now)}
      </AppText>

      <View style={styles.greetingRow}>
        <AppText variant="display" style={styles.greeting}>
          {greetingForDate(now)}
        </AppText>
        <AppText variant="display" style={styles.ornament}>
          {greetingOrnament(now)}
        </AppText>
      </View>

      <AppText variant="body" style={styles.subtitle}>
        {greetingSubtitle(now)}
      </AppText>

      {showPreviewBadge ? <PreviewDataBadge style={styles.badge} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  greeting: {
    flexShrink: 1,
    minWidth: 0,
  },
  ornament: {
    marginLeft: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.xs,
    maxWidth: '92%',
  },
  badge: {
    marginTop: spacing.md,
  },
});
