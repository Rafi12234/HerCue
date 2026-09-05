import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

import { useSettingsStore } from '../stores/settingsStore';

/**
 * Tracks the OS "reduce motion" preference so entrance and decorative
 * animations can be skipped for users who ask for that.
 */
export function useReducedMotionSync() {
  const setReduceMotion = useSettingsStore((state) => state.setReduceMotion);

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduceMotion(enabled);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) =>
      setReduceMotion(enabled)
    );

    return () => {
      active = false;
      subscription?.remove?.();
    };
  }, [setReduceMotion]);
}

export function useReducedMotion() {
  return useSettingsStore((state) => state.reduceMotion);
}
