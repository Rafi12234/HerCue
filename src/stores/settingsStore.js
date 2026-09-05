import { create } from 'zustand';

import { DEFAULTS } from '../constants/config';

/**
 * Current settings snapshot.
 *
 * Phase 11 loads this from `app_settings` on bootstrap and persists every
 * change through `settingsRepository`; today it is session-only, which the
 * Settings screen states plainly rather than implying it is saved.
 */
export const useSettingsStore = create((set) => ({
  persisted: false,

  voiceEnabled: DEFAULTS.voiceEnabled,
  vibrationEnabled: DEFAULTS.vibrationEnabled,

  quietHoursEnabled: DEFAULTS.quietHoursEnabled,
  quietHoursStart: DEFAULTS.quietHoursStart,
  quietHoursEnd: DEFAULTS.quietHoursEnd,

  defaultSnoozeMinutes: DEFAULTS.waterSnoozeMinutes,

  reduceMotion: false,

  toggle(key) {
    set((state) => ({ [key]: !state[key] }));
  },

  setValue(key, value) {
    set({ [key]: value });
  },

  setReduceMotion(reduceMotion) {
    set({ reduceMotion });
  },
}));
