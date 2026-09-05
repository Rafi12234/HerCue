import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { PressableScale } from './PressableScale';

/** Circular icon button used in headers and compact rows. */
export function IconButton({
  icon: Icon,
  onPress,
  size = 38,
  iconSize = 18,
  tint = colors.surface,
  color = colors.textSecondary,
  accessibilityLabel,
  disabled = false,
  style,
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.9}
      haptic="selection"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: tint },
        style,
      ]}
    >
      <Icon size={iconSize} color={color} strokeWidth={2.1} />
    </PressableScale>
  );
}

/** Small tinted pill used for "Next 10:30 AM" style metadata. */
export function InfoPill({ icon: Icon, children, tint, color, style }) {
  return (
    <View style={[styles.pill, { backgroundColor: tint ?? colors.surfaceSunken }, style]}>
      {Icon ? <Icon size={12.5} color={color ?? colors.textSecondary} strokeWidth={2.3} /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs + 2,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.pill,
    maxWidth: '100%',
  },
});
