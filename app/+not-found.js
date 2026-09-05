import { StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { Compass } from 'lucide-react-native';

import { AppText } from '../src/components/common/AppText';
import { colors } from '../src/theme/colors';
import { radii } from '../src/theme/radii';
import { spacing } from '../src/theme/spacing';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Compass size={24} color={colors.accentDeep} strokeWidth={2} />
      </View>

      <AppText variant="h1" align="center">
        This page took a wrong turn
      </AppText>
      <AppText variant="body" align="center" style={styles.message}>
        Let’s head back to your day.
      </AppText>

      <Link href="/" style={styles.link}>
        <AppText variant="button" color={colors.accentDeep}>
          Go to Home
        </AppText>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    marginBottom: spacing.sm,
  },
  message: {
    maxWidth: 280,
  },
  link: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
  },
});
