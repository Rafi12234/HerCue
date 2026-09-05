import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { duration, easing, stagger } from '../theme/motion';
import { useReducedMotion } from './useReducedMotion';

/**
 * Screens that have already played their entrance this session.
 *
 * Tabs stay mounted once visited, but this also guards against a remount
 * replaying the animation — the entrance should feel like an arrival, not a
 * twitch on every tab switch.
 */
const playedScreens = new Set();

export function markEntrancePlayed(screenKey) {
  playedScreens.add(screenKey);
}

export function hasEntrancePlayed(screenKey) {
  return playedScreens.has(screenKey);
}

/**
 * Staggered fade-and-rise for a card at `index` within `screenKey`.
 * Returns a Reanimated style; the caller applies it to an Animated.View.
 */
export function useEntrance(screenKey, index = 0, enabled = true) {
  const alreadyPlayed = hasEntrancePlayed(screenKey);
  const reduceMotion = useReducedMotion();
  const shouldAnimate = enabled && !alreadyPlayed && !reduceMotion;

  const progress = useSharedValue(shouldAnimate ? 0 : 1);

  useEffect(() => {
    if (!shouldAnimate) {
      progress.value = 1;
      return;
    }

    const delay = Math.min(index, stagger.maxItems) * stagger.step;
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: duration.slow, easing: easing.entrance })
    );
  }, [shouldAnimate, index, progress]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 14 }],
  }));
}

/** Call once per screen after its cards have mounted. */
export function useMarkEntranceComplete(screenKey) {
  useEffect(() => {
    const timer = setTimeout(() => markEntrancePlayed(screenKey), duration.lazy);
    return () => clearTimeout(timer);
  }, [screenKey]);
}
