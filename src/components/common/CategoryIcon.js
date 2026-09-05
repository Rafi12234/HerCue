import { StyleSheet, View } from 'react-native';

import { categoryColors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { CategoryGlyph } from './CategoryGlyph';

const SIZES = {
  sm: { box: 30, icon: 15, radius: radii.sm },
  md: { box: 40, icon: 19, radius: radii.md },
  lg: { box: 52, icon: 24, radius: radii.lg },
};

/**
 * Rounded tinted container for a category glyph, so every category mark in the
 * app shares one shape and one accent source.
 */
export function CategoryIcon({ type, size = 'md', solid = false, style }) {
  const accent = categoryColors[type] ?? categoryColors.WATER;
  const dimensions = SIZES[size] ?? SIZES.md;

  return (
    <View
      style={[
        styles.box,
        {
          width: dimensions.box,
          height: dimensions.box,
          borderRadius: dimensions.radius,
          backgroundColor: solid ? accent.base : accent.tint,
        },
        style,
      ]}
    >
      <CategoryGlyph
        type={type}
        size={dimensions.icon}
        color={solid ? '#FFFFFF' : accent.deep}
        strokeWidth={2.1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
