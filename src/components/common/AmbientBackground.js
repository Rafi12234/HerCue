import { memo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { colors } from '../../theme/colors';

/**
 * Soft ambient wash behind a screen — the "garden light" of the design.
 *
 * Deliberately static: a permanently animating background would drain battery
 * for no communicative value.
 */

const TONES = {
  home: [colors.blush, colors.peach, colors.lavender],
  water: [colors.aqua, colors.blush, colors.lavender],
  notifications: [colors.lavender, colors.blush, colors.peach],
  activity: [colors.peach, colors.lavender, colors.aqua],
  period: [colors.petal, colors.lavender, colors.blush],
  settings: [colors.lavender, colors.blush, colors.peach],
};

function Blob({ id, color, cx, cy, r, opacity }) {
  return (
    <>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
    </>
  );
}

export const AmbientBackground = memo(function AmbientBackground({ tone = 'home' }) {
  const { width, height } = useWindowDimensions();
  const [primary, secondary, tertiary] = TONES[tone] ?? TONES.home;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Blob
          id="ambient-a"
          color={primary}
          cx={width * 0.92}
          cy={height * 0.04}
          r={width * 0.62}
          opacity={0.34}
        />
        <Blob
          id="ambient-b"
          color={secondary}
          cx={width * -0.05}
          cy={height * 0.26}
          r={width * 0.55}
          opacity={0.24}
        />
        <Blob
          id="ambient-c"
          color={tertiary}
          cx={width * 0.68}
          cy={height * 0.82}
          r={width * 0.7}
          opacity={0.17}
        />
      </Svg>
    </View>
  );
});
