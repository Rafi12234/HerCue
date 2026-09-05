/**
 * Feature flags for work that is intentionally not built yet.
 *
 * Anything false here must be represented in the UI as an honest, clearly
 * labelled development state — never as a button that silently does nothing.
 */
export const FEATURES = {
  /** Phase 2 — repositories read/write real dashboard data. */
  persistentDashboard: false,
  /** Phase 3/4 — occurrence scheduling and native alarm delivery. */
  reminderScheduling: false,
  /** Phase 4 — spoken reminder sentence via TextToSpeech. */
  spokenReminders: false,
  /** Phase 4 — reminder vibration waveform. */
  reminderVibration: false,
  /** Phase 5 — medicine CRUD. */
  medicineManagement: false,
  /** Phase 8 — cycle persistence and next-period estimation. */
  periodPersistence: false,
  /** Phase 9 — in-app notification inbox. */
  notificationInbox: false,
  /** Phase 10 — activity aggregation from SQLite. */
  activityAnalytics: false,
  /** Phase 11 — settings persisted to app_settings. */
  persistentSettings: false,
};

/**
 * Development preview data for Home.
 *
 * Phase 1 has no repositories yet, so Home renders from an isolated preview
 * module. This is on only in development builds and the UI shows a visible
 * "Preview data" marker whenever it is active, so it can never be mistaken for
 * real history. Release builds fall through to genuine empty states.
 */
export const USE_PREVIEW_DASHBOARD = __DEV__;
