import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { AppText } from './AppText';

/** Screen title block used by every tab except Home. */
export function AppHeader({ title, subtitle, trailing, style }) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.titles}>
        <AppText variant="h1" numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="body" numberOfLines={3} style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  titles: {
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
  },
  trailing: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
});
