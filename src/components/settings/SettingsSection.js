import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { AppText } from '../common/AppText';
import { Card } from '../common/Card';

/** Titled group of settings rows. */
export function SettingsSection({ title, caption, children, style }) {
  return (
    <View style={[styles.container, style]}>
      <AppText variant="overline" color={colors.textMuted} style={styles.title}>
        {title}
      </AppText>
      {caption ? (
        <AppText variant="caption" style={styles.caption}>
          {caption}
        </AppText>
      ) : null}
      <Card style={styles.card}>{children}</Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  title: {
    marginLeft: spacing.xs,
  },
  caption: {
    marginLeft: spacing.xs,
    marginTop: 2,
  },
  card: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
