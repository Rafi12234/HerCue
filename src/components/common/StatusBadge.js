import { StyleSheet, View } from 'react-native';

import { statusColors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { STATUS_LABELS } from '../../constants/statuses';
import { AppText } from './AppText';

/**
 * Status pill. Always renders the label as text as well as colour, because
 * colour alone is not an accessible status signal.
 */
export function StatusBadge({ status, label, tone, style }) {
  const palette = statusColors[status] ?? statusColors.PENDING;
  const text = label ?? STATUS_LABELS[status] ?? status;

  return (
    <View
      style={[styles.badge, { backgroundColor: tone?.tint ?? palette.tint }, style]}
      accessibilityLabel={text}
    >
      <View style={[styles.dot, { backgroundColor: tone?.base ?? palette.base }]} />
      <AppText variant="caption" color={tone?.deep ?? palette.deep} numberOfLines={1}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.pill,
    maxWidth: '100%',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
