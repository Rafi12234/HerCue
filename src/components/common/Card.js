import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { shadows } from '../../theme/shadows';
import { layout } from '../../theme/spacing';
import { PressableScale } from './PressableScale';

/**
 * The one card surface used across the app.
 *
 * `tint` fills the card with a category wash instead of paper white — used
 * sparingly so the screen does not become a stack of identical rectangles.
 */
export function Card({
  children,
  onPress,
  tint,
  borderColor,
  padded = true,
  elevation = 'card',
  style,
  ...rest
}) {
  const cardStyle = [
    styles.card,
    padded && { padding: layout.cardPadding },
    shadows[elevation],
    tint ? { backgroundColor: tint } : null,
    borderColor ? { borderColor } : null,
    style,
  ];

  if (!onPress) {
    return (
      <View style={cardStyle} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <PressableScale onPress={onPress} style={cardStyle} {...rest}>
      {children}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
