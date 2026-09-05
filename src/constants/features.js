/**
 * Feature flags for work that is intentionally not built yet.
 *
 * Anything false here must be represented in the UI as an honest, clearly
 * labelled development state — never as a button that silently does nothing.
 */
export const FEATURES = {
  /** Phase 2 — repositories read/write real dashboard data. */
  persistentDashboard: true,
  /** Phase 3 — occurrence scheduling and native alarm delivery. */
  reminderScheduling: true,
  /** Phase 3 — spoken reminder sentence via TextToSpeech. */
  spokenReminders: true,
  /** Phase 3 — reminder vibration waveform. */
  reminderVibration: true,
  /** Phase 3 — medicine CRUD. */
  medicineManagement: true,
  /** Phase 8 — cycle persistence and next-period estimation. */
  periodPersistence: true,
  /** Phase 3 — inbox is fed by real reminder deliveries. */
  notificationInbox: true,
  /** Phase 10 — week/month/year aggregation. Day timeline is live from Phase 2. */
  activityAnalytics: false,
  /** Phase 11 — settings persisted to app_settings. */
  persistentSettings: true,
};

/**
 * Development preview data for Home.
 *
 * SQLite is the primary source from Phase 2, so this is off by default. Set it
 * to `__DEV__` temporarily to inspect a populated Home without seeding the
 * database; the UI shows a visible "Preview data" marker whenever it is on.
 */
export const USE_PREVIEW_DASHBOARD = false;
