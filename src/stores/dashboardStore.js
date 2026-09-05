import { create } from 'zustand';

import { USE_PREVIEW_DASHBOARD } from '../constants/features';
import { buildPreviewDashboard } from '../dev/previewDashboard';
import { buildDashboard } from '../services/dashboard/dashboardService';
import { LOG_CATEGORY, logger } from '../utils/logger';
import { buildEmptyDashboard } from './emptyDashboard';

export const DASHBOARD_STATUS = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  READY: 'READY',
  FAILED: 'FAILED',
};

/**
 * Cached Home view-model.
 *
 * SQLite remains authoritative — this store holds only the most recent
 * projection of it. Every write goes through a domain service and is followed
 * by `refresh()`, so the store can always be rebuilt from the database.
 */
export const useDashboardStore = create((set, get) => ({
  status: DASHBOARD_STATUS.IDLE,
  data: buildEmptyDashboard(),
  error: null,
  /** Set when a confirmation lands, so cards can animate the change. */
  lastConfirmation: null,

  async hydrate() {
    if (get().status === DASHBOARD_STATUS.LOADING) return;
    set({ status: DASHBOARD_STATUS.LOADING, error: null });

    try {
      const data = USE_PREVIEW_DASHBOARD
        ? buildPreviewDashboard(new Date())
        : await buildDashboard();
      set({ status: DASHBOARD_STATUS.READY, data });
      logger.debug(LOG_CATEGORY.UI, `Dashboard hydrated from ${data.source}`);
    } catch (error) {
      logger.error(LOG_CATEGORY.UI, 'Dashboard hydration failed', error);
      set({
        status: DASHBOARD_STATUS.FAILED,
        error: 'Could not load your day.',
        data: buildEmptyDashboard(),
      });
    }
  },

  /** Re-reads from SQLite without blanking the currently rendered values. */
  async refresh() {
    if (USE_PREVIEW_DASHBOARD) return;

    try {
      const data = await buildDashboard();
      set({ status: DASHBOARD_STATUS.READY, data, error: null });
    } catch (error) {
      logger.error(LOG_CATEGORY.UI, 'Dashboard refresh failed', error);
      set({ error: 'Could not refresh your day.' });
    }
  },

  noteConfirmation(type) {
    set({ lastConfirmation: { type, at: new Date().toISOString() } });
  },

  clearConfirmation() {
    set({ lastConfirmation: null });
  },
}));
