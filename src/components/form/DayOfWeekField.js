import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { AppText } from '../common/AppText';
import { PressableScale } from '../common/PressableScale';

/** JS `getDay()` order so stored values need no translation. */
const DAYS = [
  { value: 1, label: 'M' },
  { value: 2, label: 'T' },
  { value: 3, label: 'W' },
  { value: 4, label: 'T' },
  { value: 5, label: 'F' },
  { value: 6, label: 'S' },
  { value: 0, label: 'S' },
];

/** Empty selection means every day. */
export function DayOfWeekField({ label, value = [], onChange, tint, accent }) {
  const toggle = (day) => {
    const next = value.includes(day) ? value.filter((d) => d !== day) : [...value, day];
    onChange(next);
  };

  return (
    <View style={styles.field}>
      {label ? (
        <AppText variant="caption" color={colors.textMuted} style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <View style={styles.row}>
        {DAYS.map((day, index) => {
          const selected = value.includes(day.value);
          return (
            <PressableScale
              key={`${day.value}-${index}`}
              onPress={() => toggle(day.value)}
              haptic="select"
              scaleTo={0.9}
              style={[
                styles.chip,
                { backgroundColor: selected ? accent : tint },
              ]}
              accessibilityLabel={`Day ${index + 1}`}
              accessibilityState={{ selected }}
            >
              <AppText variant="caption" color={selected ? '#FFFFFF' : accent}>
                {day.label}
              </AppText>
            </PressableScale>
          );
        })}
      </View>

      <AppText variant="caption" color={colors.textFaint}>
        {value.length === 0 ? 'Every day' : `${value.length} day${value.length > 1 ? 's' : ''} a week`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  label: {
    marginLeft: 2,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  chip: {
    flex: 1,
    minWidth: 0,
    aspectRatio: 1,
    maxHeight: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
