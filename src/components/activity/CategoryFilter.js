import { ScrollView, StyleSheet } from 'react-native';

import { REMINDER_TYPE_LIST, REMINDER_TYPE_META } from '../../constants/reminderTypes';
import { categoryColors, colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { AppText } from '../common/AppText';
import { CategoryGlyph } from '../common/CategoryGlyph';
import { PressableScale } from '../common/PressableScale';

/**
 * Category filter for the activity chart.
 *
 * Only categories with recorded data are offered, so the control never implies
 * a category the user has never used.
 */
export function CategoryFilter({ summary, value, onChange }) {
  const available = REMINDER_TYPE_LIST.filter((type) => summary?.byType?.[type]?.total > 0);
  if (available.length < 2) return null;

  const options = [{ value: null, label: 'All' }, ...available.map((type) => ({ value: type }))];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
        const selected = value === option.value;
        const accent = option.value ? categoryColors[option.value] : null;
        const label = option.label ?? REMINDER_TYPE_META[option.value].label;

        return (
          <PressableScale
            key={option.value ?? 'ALL'}
            onPress={() => onChange(option.value)}
            haptic="select"
            scaleTo={0.95}
            accessibilityState={{ selected }}
            style={[
              styles.chip,
              {
                backgroundColor: selected
                  ? (accent?.base ?? colors.accent)
                  : (accent?.tint ?? colors.surfaceSunken),
              },
            ]}
          >
            {option.value ? (
              <CategoryGlyph
                type={option.value}
                size={13}
                color={selected ? '#FFFFFF' : accent.deep}
              />
            ) : null}
            <AppText
              variant="caption"
              color={selected ? '#FFFFFF' : (accent?.deep ?? colors.textMuted)}
              numberOfLines={1}
            >
              {label}
            </AppText>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs + 2,
    paddingRight: spacing.base,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 1,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: radii.pill,
  },
});
