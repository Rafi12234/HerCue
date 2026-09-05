/**
 * Feature flags for work that is intentionally not built yet.
 *
 * Anything false here must be represented in the UI as an honest, clearly
 * labelled development state — never as a button that silently does nothing.
 */
export const FEATURES = {
  /** Phase 2 — repositories read/write real dashboard data. */
  persistentDashboard: true,
  /** Phase 3/4 — occurrence scheduling and native alarm delivery. */
  reminderScheduling: false,
  /** Phase 4 — spoken reminder sentence via TextToSpeech. */
  spokenReminders: false,
  /** Phase 4 — reminder vibration waveform. */
  reminderVibration: false,
  /** Phase 5 — medicine CRUD. */
  medicineManagement: false,
  /** Phase 8 — cycle persistence and next-period estimation. */
  periodPersistence: true,
  /** Phase 9 — in-app notification inbox is wired to SQLite; nothing writes to it yet. */
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
