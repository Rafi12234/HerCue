import { StyleSheet, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { AppText } from '../common/AppText';
import { IconButton } from '../common/IconButton';
import { PressableScale } from '../common/PressableScale';

/** Previous / label / next control shared by the Activity and Period screens. */
export function RangeNavigator({
  label,
  onPrevious,
  onNext,
  canGoForward,
  resetLabel,
  onReset,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      <IconButton
        icon={ChevronLeft}
        onPress={onPrevious}
        accessibilityLabel="Previous range"
        size={34}
        iconSize={17}
      />

      <View style={styles.center}>
        <AppText variant="h3" align="center" numberOfLines={1}>
          {label}
        </AppText>
        {resetLabel && onReset ? (
          <PressableScale onPress={onReset} scaleTo={0.94} haptic="selection">
            <AppText variant="caption" color={colors.accentDeep}>
              {resetLabel}
            </AppText>
          </PressableScale>
        ) : null}
      </View>

      <IconButton
        icon={ChevronRight}
        onPress={onNext}
        disabled={!canGoForward}
        accessibilityLabel="Next range"
        size={34}
        iconSize={17}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  center: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 1,
  },
});
