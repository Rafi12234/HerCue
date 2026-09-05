import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Clock3 } from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { applyScheduleTime, formatScheduleTime } from '../../utils/dates';
import { AppText } from '../common/AppText';
import { PressableScale } from '../common/PressableScale';

/** Tappable "HH:mm" field backed by the platform time picker. */
export function TimeField({ label, value, onChange, tint = colors.accentSoft, accent = colors.accentDeep }) {
  const [open, setOpen] = useState(false);

  const handleChange = (event, selected) => {
    setOpen(Platform.OS === 'ios');
    if (event.type === 'dismissed' || !selected) return;

    const hours = String(selected.getHours()).padStart(2, '0');
    const minutes = String(selected.getMinutes()).padStart(2, '0');
    onChange(`${hours}:${minutes}`);
  };

  return (
    <View style={styles.field}>
      {label ? (
        <AppText variant="caption" color={colors.textMuted} style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <PressableScale
        onPress={() => setOpen(true)}
        haptic="press"
        scaleTo={0.97}
        style={[styles.control, { backgroundColor: tint }]}
      >
        <Clock3 size={15} color={accent} strokeWidth={2.2} />
        <AppText variant="bodyStrong" color={accent}>
          {formatScheduleTime(value)}
        </AppText>
      </PressableScale>

      {open ? (
        <DateTimePicker
          value={applyScheduleTime(value)}
          mode="time"
          is24Hour={false}
          onChange={handleChange}
        />
      ) : null}
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
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.base,
    borderRadius: radii.md,
  },
});
