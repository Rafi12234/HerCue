import { Platform } from 'react-native';

/**
 * Shadows stay warm-tinted and low-contrast. Android only honours `elevation`,
 * so every level pairs an iOS shadow with a deliberately small elevation to
 * avoid the harsh grey drop shadow that makes apps look templated.
 */
const build = (offsetY, blur, opacity, elevation) =>
  Platform.select({
    ios: {
      shadowColor: '#B08A7E',
      shadowOffset: { width: 0, height: offsetY },
      shadowRadius: blur,
      shadowOpacity: opacity,
    },
    android: { elevation },
    default: {},
  });

export const shadows = {
  none: {},
  subtle: build(2, 8, 0.1, 1),
  card: build(6, 18, 0.12, 2),
  raised: build(10, 26, 0.16, 5),
  floating: build(14, 34, 0.2, 10),
};
