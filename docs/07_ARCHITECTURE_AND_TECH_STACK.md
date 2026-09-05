# Architecture and Technology Stack

## 1. Architecture goal

Create a maintainable offline-first mobile application where:

UI
→ application/domain services
→ repositories/database
→ scheduler/native platform adapters

The UI must not directly control alarm internals.

---

# 2. Recommended stack

## Core
- React Native
- Expo
- JavaScript
- Expo development build
- Expo Router

## Persistence
- expo-sqlite

## State
- Zustand

## Notifications
- expo-notifications

## Native Android
Kotlin module(s) only when required:
- AlarmManager
- BroadcastReceiver
- TextToSpeech
- Vibrator/VibrationEffect
- platform settings intents/helpers

## Dates
- date-fns

## Forms
- React Hook Form
- Zod

## Animation
- react-native-reanimated

## Optional decorative animation
- Lottie

## Icons
- Lucide React Native

## Charts
Choose a maintained React Native chart library compatible with the installed SDK.
`react-native-gifted-charts` is a candidate, but verify compatibility before installing.

---

# 3. Do not install everything immediately

Before adding a dependency ask:
- Is it needed?
- Is it compatible with the current Expo SDK?
- Is it maintained?
- Does an existing package already solve it?
- Will it force native configuration?

Avoid dependency bloat.

---

# 4. App layers

## Presentation layer
Contains:
- screens
- components
- hooks
- animation
- visual state

May call domain/application services.

Should not contain:
- SQL
- alarm scheduling internals
- period algorithms
- recurrence generation

## Domain/application layer
Contains:
- complete water action
- complete food action
- schedule medicine
- snooze occurrence
- calculate next reminders
- analytics aggregation
- period calculation

## Data layer
Contains:
- SQLite connection
- migrations
- repositories

## Platform layer
Contains:
- notifications
- Android alarms
- TTS
- vibration
- deep links
- permissions

---

# 5. Adapter design

Create interfaces/wrappers so screens do not care whether scheduling is Expo or native.

Conceptual:

ReminderScheduler
- scheduleOccurrence()
- cancelOccurrence()
- reconcile()
- canScheduleExact()
- openAlarmSettings()

VoiceService
- speak()
- stop()
- isAvailable()

VibrationService
- playReminderPattern()
- cancel()

NotificationService
- show()
- dismiss()
- requestPermission()
- openSettings()

This makes testing and future iOS support easier.

---

# 6. Zustand usage

Use small stores.

Possible:
- appStore / hydration status
- settingsStore
- dashboardStore or selectors
- permissionStore

Do not mirror the entire SQLite database into Zustand.

Prefer:
- SQLite = persistent source
- Zustand = current UI/session state

---

# 7. Database bootstrap

On app start:
1. initialize SQLite
2. enable required pragmas
3. run migrations
4. load settings
5. initialize notification channels
6. check permissions
7. reconcile schedules
8. hydrate Home data
9. render stable app state

Use a lightweight launch state to avoid flashing incorrect data.

---

# 8. Background and lifecycle

App lifecycle hooks should trigger reconciliation thoughtfully.

Do not reschedule everything on every render.

Candidates:
- startup
- foreground resume after meaningful time
- settings/schedule changes
- after dynamic completion

---

# 9. Error boundaries

Use:
- global error boundary for unexpected render errors
- local friendly errors for form/repository failures
- development logging

Never expose stack traces to the end user.

---

# 10. Logging

Development structured logger:

levels:
- debug
- info
- warn
- error

Categories:
- DB
- SCHEDULER
- NOTIFICATION
- TTS
- UI
- PERIOD
- ANALYTICS

Production logging should not leak private health/routine details.

---

# 11. Environment

V1 does not require backend environment variables.

Possible build config:
- app name
- bundle/package identifier
- environment: development/production
- optional feature flags

Do not put secrets in source.

---

# 12. Native code strategy

Because the app uses Expo, prefer config plugins/prebuild-compatible native customization.

Rules:
- document every native customization
- avoid hand edits that are destroyed by prebuild unless intentionally managed
- if custom native module is created, keep it focused
- provide JS wrapper
- test clean prebuild/build

---

# 13. Android permissions concept

Likely relevant depending on final implementation:
- POST_NOTIFICATIONS on modern Android
- SCHEDULE_EXACT_ALARM or other exact alarm access where applicable
- VIBRATE
- RECEIVE_BOOT_COMPLETED where scheduler/library requires it

Do not request unrelated permissions.

Always verify current Android/Expo requirements at implementation time.

---

# 14. No backend V1

Do not create:
- Express server
- MySQL
- auth
- API client
- cloud account

unless future scope explicitly adds remote sync/care-partner features.

---

# 15. Performance

- memoize only where useful
- avoid giant FlatList render items
- use FlashList only if needed
- keep charts efficient
- avoid blocking JS thread with heavy date aggregation
- run aggregation queries efficiently
- animations should use Reanimated/UI thread where possible

---

# 16. Security baseline

- parameterized SQL
- validate form data
- no secrets
- no arbitrary code execution
- no hidden network calls
- sanitize strings used in notification/TTS
- confirm destructive actions
