import { create } from 'zustand';

import { initializeDatabase } from '../database/db';
import { notificationService } from '../services/notification/notificationService';
import { permissionService } from '../services/permissions/permissionService';
import { LOG_CATEGORY, logger } from '../utils/logger';
import { useDashboardStore } from './dashboardStore';

export const BOOT_STATUS = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  READY: 'READY',
  FAILED: 'FAILED',
};

/**
 * App-level hydration state.
 *
 * Bootstrap order follows `docs/07_ARCHITECTURE_AND_TECH_STACK.md` §7 so the
 * first frame never renders against a half-initialised database.
 */
export const useAppStore = create((set, get) => ({
  status: BOOT_STATUS.IDLE,
  error: null,
  schemaVersion: null,
  permissions: null,
  fontsLoaded: false,

  setFontsLoaded(fontsLoaded) {
    set({ fontsLoaded });
  },

  async bootstrap() {
    if (get().status === BOOT_STATUS.LOADING || get().status === BOOT_STATUS.READY) return;
    set({ status: BOOT_STATUS.LOADING, error: null });

    try {
      const { version } = await initializeDatabase();

      // Channels must exist before any reminder can be delivered later.
      await notificationService.initialize();

      const permissions = await permissionService.getSnapshot();

      useDashboardStore.getState().hydrate();

      // Schedule reconciliation belongs here — it lands with Phase 3/4 and the
      // scheduler stub intentionally reports itself as unimplemented until then.

      set({ status: BOOT_STATUS.READY, schemaVersion: version, permissions });
      logger.info(LOG_CATEGORY.UI, 'Bootstrap complete');
    } catch (error) {
      logger.error(LOG_CATEGORY.UI, 'Bootstrap failed', error);
      set({
        status: BOOT_STATUS.FAILED,
        error: error?.message ?? 'HerCue could not start up.',
      });
    }
  },

  async refreshPermissions() {
    const permissions = await permissionService.getSnapshot();
    set({ permissions });
    return permissions;
  },

  retry() {
    set({ status: BOOT_STATUS.IDLE, error: null });
    get().bootstrap();
  },
}));
