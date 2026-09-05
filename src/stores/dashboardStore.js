import { addMinutes } from 'date-fns';
import { create } from 'zustand';

import { DEFAULTS } from '../constants/config';
import { USE_PREVIEW_DASHBOARD } from '../constants/features';
import { REMINDER_TYPES } from '../constants/reminderTypes';
import { buildPreviewDashboard } from '../dev/previewDashboard';
import { toCalendarDate } from '../utils/dates';
import { LOG_CATEGORY, logger } from '../utils/logger';
import { buildEmptyDashboard } from './emptyDashboard';

/**
 * Session view-model for Home.
 *
 * This is UI state, not storage. From Phase 2 `hydrate` reads from the
 * repositories and the confirm actions delegate to domain services that write
 * to SQLite; until then confirmations live for the current session only, which
 * is why the UI shows the data source explicitly.
 */
export const useDashboardStore = create((set, get) => ({
  status: 'idle',
  data: buildEmptyDashboard(),
  /** Set when a quick action succeeds, so cards can animate a confirmation. */
  lastConfirmation: null,

  hydrate() {
    const now = new Date();
    const data = USE_PREVIEW_DASHBOARD ? buildPreviewDashboard(now) : buildEmptyDashboard(now);
    set({ status: 'ready', data });
    logger.debug(LOG_CATEGORY.UI, `Dashboard hydrated from ${data.source}`);
  },

  confirmWater() {
    const now = new Date();
    set((state) => ({
      data: {
        ...state.data,
        water: {
          ...state.data.water,
          count: state.data.water.count + 1,
          lastConfirmedAt: now.toISOString(),
          nextReminderAt: addMinutes(now, DEFAULTS.waterIntervalMinutes).toISOString(),
        },
      },
      lastConfirmation: { type: REMINDER_TYPES.WATER, at: now.toISOString() },
    }));
  },

  confirmFood() {
    const now = new Date();
    set((state) => ({
      data: {
        ...state.data,
        food: {
          ...state.data.food,
          lastConfirmedAt: now.toISOString(),
          // Food is anchored to the actual meal time, not to a fixed clock slot.
          nextCheckAt: addMinutes(now, state.data.food.intervalMinutes).toISOString(),
        },
      },
      lastConfirmation: { type: REMINDER_TYPES.FOOD, at: now.toISOString() },
    }));
  },

  confirmBathroom() {
    const now = new Date();
    set((state) => ({
      data: {
        ...state.data,
        bathroom: {
          ...state.data.bathroom,
          lastConfirmedAt: now.toISOString(),
          nextReminderAt: addMinutes(now, DEFAULTS.bathroomIntervalMinutes).toISOString(),
        },
      },
      lastConfirmation: { type: REMINDER_TYPES.BATHROOM, at: now.toISOString() },
    }));
  },

  logPeriodStart(date = new Date()) {
    const startDate = toCalendarDate(date);
    if (get().data.period.lastStartDate === startDate) return;

    set((state) => ({
      data: {
        ...state.data,
        period: {
          ...state.data.period,
          lastStartDate: startDate,
          lastEndDate: null,
          // A real estimate needs the cycle history that lands in Phase 8.
          estimatedNextDate: null,
          cycleCount: state.data.period.cycleCount + 1,
        },
      },
      lastConfirmation: { type: REMINDER_TYPES.PERIOD, at: new Date().toISOString() },
    }));
  },

  clearConfirmation() {
    set({ lastConfirmation: null });
  },
}));
