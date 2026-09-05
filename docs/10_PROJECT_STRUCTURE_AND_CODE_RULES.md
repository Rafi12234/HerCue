# Project Structure and Coding Rules

## 1. Language

Use JavaScript for the application code unless the developer explicitly changes the decision later.

Use consistent modern ES modules.

---

# 2. Suggested project structure

project/
  app/
    _layout.js
    (tabs)/
      _layout.js
      index.js
      notifications.js
      activity.js
      period.js
      settings.js
    medicine/
    reminder/
    period/
    settings/

  src/
    components/
      common/
      home/
      activity/
      medicine/
      period/
      reminders/

    constants/
      colors.js
      typography.js
      spacing.js
      reminderTypes.js
      statuses.js

    theme/
      index.js
      lightTheme.js

    database/
      db.js
      migrations/
      repositories/

    services/
      reminder/
      notification/
      voice/
      vibration/
      period/
      analytics/
      permissions/

    stores/
      appStore.js
      settingsStore.js

    hooks/
      useDashboard.js
      usePermissions.js
      useReminderActions.js

    utils/
      dates.js
      ids.js
      validation.js

    schemas/
      medicineSchema.js
      settingsSchema.js

    native/
      reminderEngine.js

  modules/ or native module location
    android reminder module if required

  assets/
    images/
    lottie/
    icons/ if custom

  docs/
    specification Markdown files

---

# 3. Naming

Components:
PascalCase

Functions/hooks:
camelCase

Hooks:
useXxx

Constants:
UPPER_SNAKE_CASE for true global constants

Files:
choose one convention and stay consistent.

Database table/columns:
snake_case

Statuses:
uppercase enum-like strings

---

# 4. Component rules

A screen should orchestrate components.

Do not build a 700-line screen containing:
- SQL
- styling
- business logic
- notification scheduling
- charts
- forms

Extract by responsibility.

Avoid over-fragmenting into meaningless 5-line components.

---

# 5. Style rules

Centralize:
- colors
- spacing
- radii
- typography
- shadows/elevation
- semantic states

Avoid:
`backgroundColor: '#ff...'` scattered everywhere.

Use theme tokens.

---

# 6. Business logic

Do not put important domain logic in:
- `onPress` callbacks
- JSX expressions
- animation worklets
- route files

Examples of logic requiring service functions:
- complete medicine
- snooze
- period estimate
- schedule reconciliation
- calculate analytics

---

# 7. Database access

No raw SQL in screen/component files.

Repositories only.

Prefer functions such as:
- getTodayActivities()
- completeOccurrence()
- getActiveMedicines()
- savePeriodCycle()

Use prepared/parameterized APIs.

---

# 8. Date handling

Centralize date helpers.

Never rely on casual string parsing.

Differentiate:
- date-only
- local schedule time
- UTC instant

Write tests for date calculations.

---

# 9. Error handling

Services should return/throw meaningful errors.

UI translates errors into friendly copy.

Do not use empty `catch {}`.

Development logs may record technical context without sensitive data.

---

# 10. Async handling

Prevent double submissions.

Buttons performing writes:
- disable while saving
- show subtle progress if needed
- make operations idempotent where possible

Notification actions may arrive more than once; protect against duplicate completion.

---

# 11. Animation

Do not create animations inside render loops unnecessarily.

Use Reanimated shared values where appropriate.

Respect accessibility/reduced motion where possible.

---

# 12. Comments

Comments explain why, not obvious code.

Good:
// Reconcile instead of blindly rescheduling to avoid duplicate native alarms.

Bad:
// Set variable to true.

---

# 13. Magic numbers

Move:
- snooze defaults
- schedule horizon
- animation duration
- reminder expiration windows

to named constants/config.

---

# 14. No fake implementation

Do not leave:
- TODO buttons that do nothing
- placeholder graphs presented as real
- hard-coded "5/8" after database exists
- fake reminder success
- dummy period date on production Home

During development, mock data must be clearly isolated.

---

# 15. Dependencies

Before installation:
- verify compatibility
- prefer Expo-supported install command
- avoid abandoned libraries
- document why native dependency is needed

---

# 16. Git hygiene

Use `.gitignore`.

Never commit:
- local secrets
- build output
- node_modules
- private signing keys
- `.env` with secrets

V1 may not require `.env`.

---

# 17. README

Root README should eventually include:
- product summary
- requirements
- setup
- development build instructions
- Android native reminder notes
- test reminder instructions
- build instructions
- architecture overview
- link to docs

---

# 18. Definition of clean implementation

A feature is clean when:
- domain behavior can be understood outside UI
- persistence is explicit
- scheduling is idempotent
- state survives restart
- errors are handled
- UI has polished feedback
- tests cover nontrivial logic
