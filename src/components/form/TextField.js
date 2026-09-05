import { StyleSheet, TextInput, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { AppText } from '../common/AppText';

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helper,
  autoFocus = false,
  maxLength = 80,
}) {
  return (
    <View style={styles.field}>
      {label ? (
        <AppText variant="caption" color={colors.textMuted} style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        autoFocus={autoFocus}
        maxLength={maxLength}
        style={[styles.input, error && styles.inputError]}
        accessibilityLabel={label}
      />

      {error ? (
        <AppText variant="caption" color={colors.ember}>
          {error}
        </AppText>
      ) : helper ? (
        <AppText variant="caption" color={colors.textFaint}>
          {helper}
        </AppText>
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
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radii.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm + 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: colors.ember,
  },
});
