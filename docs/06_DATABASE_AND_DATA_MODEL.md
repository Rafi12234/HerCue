# Database and Data Model

## 1. Database choice

Use Expo SQLite.

SQLite is the source of truth for V1 persistent data.

Zustand is not the database.

Do not store primary domain history only in AsyncStorage.

---

# 2. Database principles

- use migrations
- enable foreign keys
- consider WAL mode
- use parameterized queries
- use transactions for multi-step writes
- never concatenate untrusted values into SQL
- timestamps should have a consistent representation
- preserve past history when schedules change
- avoid duplicated derived data when it can be queried safely
- indexes for common date/type/status queries

---

# 3. Suggested tables

The exact implementation may evolve, but preserve these concepts.

---

## app_settings

Purpose:
global app settings.

Fields:
- id
- key
- value
- updated_at

Alternative:
typed singleton tables may be used where better.

---

## reminder_definitions

Shared configuration for recurring reminder categories.

Fields:
- id TEXT PRIMARY KEY
- type TEXT NOT NULL
  - WATER
  - BATHROOM
  - FOOD
  - PERIOD
  - possibly MEDICINE schedule references handled separately
- title TEXT
- enabled INTEGER
- interval_minutes INTEGER NULL
- active_start_time TEXT NULL
- active_end_time TEXT NULL
- snooze_minutes INTEGER
- voice_enabled INTEGER
- vibration_enabled INTEGER
- schedule_mode TEXT
- created_at TEXT
- updated_at TEXT

---

## medicines

Fields:
- id TEXT PRIMARY KEY
- name TEXT NOT NULL
- dosage TEXT NULL
- instructions TEXT NULL
- notes TEXT NULL
- active INTEGER NOT NULL DEFAULT 1
- start_date TEXT NULL
- end_date TEXT NULL
- archived_at TEXT NULL
- created_at TEXT
- updated_at TEXT

---

## medicine_schedules

Fields:
- id TEXT PRIMARY KEY
- medicine_id TEXT NOT NULL
- time_of_day TEXT NOT NULL
- repeat_type TEXT NOT NULL
- days_of_week TEXT/JSON NULL
- enabled INTEGER
- created_at TEXT
- updated_at TEXT

Foreign key:
medicine_id → medicines.id

Do not store executable functions or ambiguous recurrence strings.

---

## reminder_occurrences

This is one of the most important tables.

Fields:
- id TEXT PRIMARY KEY
- definition_id TEXT NULL
- medicine_id TEXT NULL
- medicine_schedule_id TEXT NULL
- type TEXT NOT NULL
- scheduled_at TEXT NOT NULL
- triggered_at TEXT NULL
- completed_at TEXT NULL
- status TEXT NOT NULL
- parent_occurrence_id TEXT NULL
- native_schedule_id TEXT NULL
- message TEXT NULL
- metadata_json TEXT NULL
- created_at TEXT
- updated_at TEXT

Status:
- PENDING
- TRIGGERED
- COMPLETED
- SNOOZED
- SKIPPED
- MISSED
- CANCELLED

Constraints should prevent nonsensical relations where practical.

Index:
- scheduled_at
- type + scheduled_at
- status + scheduled_at
- medicine_id + scheduled_at

---

## activity_logs

Purpose:
unified timeline of meaningful user actions.

Fields:
- id TEXT PRIMARY KEY
- type TEXT NOT NULL
- action TEXT NOT NULL
- status TEXT NOT NULL
- occurred_at TEXT NOT NULL
- scheduled_at TEXT NULL
- occurrence_id TEXT NULL
- medicine_id TEXT NULL
- value_numeric REAL NULL
- value_text TEXT NULL
- source TEXT
  - REMINDER_ACTION
  - MANUAL
  - SYSTEM
- metadata_json TEXT NULL
- created_at TEXT

Examples:

Water completed:
type = WATER
action = DRANK
status = COMPLETED

Food:
type = FOOD
action = ATE

Bathroom:
type = BATHROOM
action = WENT

Medicine:
type = MEDICINE
action = TAKEN

Period:
type = PERIOD
action = STARTED

---

## notification_history

Purpose:
in-app notification inbox.

Fields:
- id TEXT PRIMARY KEY
- occurrence_id TEXT NULL
- type TEXT NOT NULL
- title TEXT NOT NULL
- body TEXT NOT NULL
- status TEXT
- is_read INTEGER DEFAULT 0
- delivered_at TEXT
- action_at TEXT NULL
- created_at TEXT

Do not delete related activity when deleting an inbox record.

---

## period_cycles

Fields:
- id TEXT PRIMARY KEY
- start_date TEXT NOT NULL
- end_date TEXT NULL
- notes TEXT NULL
- source TEXT
- created_at TEXT
- updated_at TEXT

Constraints:
- end_date >= start_date
- prevent accidental duplicate identical start dates or handle explicitly

---

## period_predictions

Optional cache table.

Prefer calculations from cycle history unless caching is useful.

If stored:
- id
- based_on_cycle_id
- predicted_start_date
- average_cycle_length
- generated_at

Predictions are derived data and must be recalculated after history edits.

---

## schema_migrations

Fields:
- version
- name
- applied_at

---

# 4. Timestamp strategy

Choose one consistent strategy.

Recommended:
- store event instants in ISO-8601 UTC where they represent an instant
- store local wall-clock schedule values separately as `HH:mm`
- store date-only cycle values as `YYYY-MM-DD`
- retain timezone identifier in settings where needed for schedule reconciliation

Do not confuse:
- 09:00 schedule
with
- a specific UTC timestamp

---

# 5. IDs

Use UUIDs or another collision-safe local identifier.

Do not use array indexes as identity.

---

# 6. Activity versus occurrence

Occurrence:
"What was supposed to happen?"

Activity:
"What did the user/system actually do?"

Example:

Occurrence:
Medicine at 21:00

Activity:
Taken at 21:13

This separation is important for accurate history.

---

# 7. Dynamic state queries

Home should query/derive:
- today's water completions
- today's medicine scheduled/completed
- latest bathroom completion
- latest food completion
- next pending occurrence
- last cycle
- predicted next period

Avoid storing a manually synchronized "home_dashboard" table.

---

# 8. Analytics queries

Day:
query activities by local date range.

Week:
group by day + type/status.

Month:
group by day/week/type.

Year:
group by month/type.

Be careful with timezone boundaries.

---

# 9. Data migrations

Every schema change after initial release needs migration.

Migration requirements:
- transactional when possible
- repeat-safe
- versioned
- tested with existing data
- never drop user history casually

---

# 10. Reset data

"Clear all data" must:
- require strong confirmation
- cancel scheduled alarms
- clear database
- reset state
- re-enter onboarding/setup

Do not leave orphaned alarms after database reset.

---

# 11. Seed data

Development may use seeds.

Production must not display fake activity.

Use explicit development-only seed scripts/flags.

---

# 12. Repository pattern

UI components should not write raw SQL.

Use repository/service modules:

- medicineRepository
- reminderRepository
- activityRepository
- periodRepository
- notificationRepository
- settingsRepository

Services orchestrate business logic.

Example:
`completeFoodReminder()`:
- repository writes activity/occurrence
- scheduler service recalculates next
- UI receives updated state

Do not put this logic inside a button component.
