import { StyleSheet, View } from 'react-native';
import { HeartCrack, RefreshCw } from 'lucide-react-native';

import { AppText } from '../common/AppText';
import { PressableScale } from '../common/PressableScale';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';

/**
 * Friendly failure screen.
 *
 * Technical detail is logged, never shown — the user only ever sees a calm
 * explanation and a way forward.
 */
export function BootErrorScreen({ message, onRetry }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <HeartCrack size={26} color={colors.accentDeep} strokeWidth={2} />
      </View>

      <AppText variant="h1" align="center">
        HerCue could not start
      </AppText>

      <AppText variant="body" align="center" style={styles.message}>
        {message ?? 'Something went wrong while opening your local data.'}
      </AppText>

      {onRetry ? (
        <PressableScale onPress={onRetry} scaleTo={0.94} haptic="press" style={styles.button}>
          <RefreshCw size={16} color="#FFFFFF" strokeWidth={2.4} />
          <AppText variant="button" color="#FFFFFF">
            Try again
          </AppText>
        </PressableScale>
      ) : null}
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
    width: 60,
    height: 60,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    marginBottom: spacing.sm,
  },
  message: {
    maxWidth: 300,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
});
