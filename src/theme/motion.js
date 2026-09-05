import { Easing } from 'react-native-reanimated';

/** Every duration and spring in the app comes from here. */
export const duration = {
  instant: 90,
  fast: 160,
  base: 240,
  slow: 360,
  lazy: 520,
};

export const easing = {
  standard: Easing.bezier(0.22, 1, 0.36, 1),
  entrance: Easing.bezier(0.16, 1, 0.3, 1),
  exit: Easing.bezier(0.4, 0, 1, 1),
};

export const springs = {
  /** Default for anything that follows a finger or a tap. */
  gentle: { damping: 18, stiffness: 190, mass: 0.9 },
  /** Slightly livelier — used for success confirmations. */
  bouncy: { damping: 13, stiffness: 220, mass: 0.8 },
  /** Tab indicator and segmented control: settle fast, never wobble. */
  snappy: { damping: 22, stiffness: 260, mass: 0.7 },
};

export const stagger = {
  /** Delay between consecutive Home cards on first mount. */
  step: 55,
  maxItems: 8,
};

export const pressScale = {
  card: 0.985,
  button: 0.94,
  icon: 0.9,
};
