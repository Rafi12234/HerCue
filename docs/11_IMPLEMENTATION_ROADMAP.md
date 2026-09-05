# Implementation Roadmap

Do not ask a coding agent to build the entire application in one giant prompt.

Build in controlled chunks.

---

# Phase 0 — Foundation

Goals:
- initialize Expo React Native project
- JavaScript
- Expo Router
- development build configuration
- theme/design tokens
- base typography
- safe area
- root navigation
- SQLite initialization
- migration system
- Zustand bootstrap
- reusable card/button/segmented control
- no full feature implementation yet

Deliverables:
- app launches
- tabs work
- theme is visible
- database initializes
- clean folder structure

Quality gate:
- no placeholder enterprise UI
- responsive base layout

---

# Phase 1 — UI Shell + Home

Goals:
- build premium/cute visual language
- Home static structure connected to temporary view-model/mock repository
- animated cards
- next reminder hero
- bottom tabs
- quick action visual states
- no fake production analytics

Deliverables:
- high-quality Home
- Notifications empty state
- Activity shell
- Period shell
- Settings shell

Quality gate:
The UI should already look intentional and distinctive before complex business logic begins.

---

# Phase 2 — Database Domain

Goals:
- final V1 migrations
- repositories
- settings
- activity logs
- occurrence model
- medicine tables
- cycle table

Deliverables:
- CRUD tests/repository validation
- persistence across restart
- Home reading real local data

---

# Phase 3 — Water

Goals:
- water settings
- occurrence generation
- local notification
- vibration
- spoken reminder path
- Drank/Snooze
- history
- Home progress
- test reminder

Deliverables:
end-to-end water reminder.

This feature should prove the reminder engine architecture before replicating it.

---

# Phase 4 — Reminder Engine Hardening

Goals:
- Android exact-alarm strategy
- native Kotlin layer if necessary
- notification actions
- action handling from background
- reboot reconciliation
- duplicate prevention
- permission flow
- channel/settings health

Deliverables:
reliable reminder platform abstraction.

Do not build all reminder categories before this is stable.

---

# Phase 5 — Medicine

Goals:
- medicine CRUD
- daily/selected-day schedules
- occurrence generation
- Taken/Snooze/Skip
- voice sentence includes medicine
- history
- edit reconciliation

Deliverables:
fully functional medicine module.

---

# Phase 6 — Food

Goals:
- 6-hour dynamic schedule
- manual "I ate"
- next reminder from actual completion
- quiet hours
- activity integration

---

# Phase 7 — Bathroom

Goals:
- configurable interval
- dynamic next reminder from "Went"
- quiet hours
- activity integration

---

# Phase 8 — Period

Goals:
- setup
- cycle history
- estimated next date
- calendar
- "Period started today"
- edit cycle
- gentle estimate reminders

---

# Phase 9 — Notifications Center

Goals:
- in-app notification history
- read/unread
- grouped timeline
- deep links
- filters if useful

---

# Phase 10 — Activity and Analytics

Goals:
- Day timeline
- Week summary/chart
- Month summary/chart
- Year trend
- real data only
- empty states
- category drilldown

---

# Phase 11 — Settings + Permissions

Goals:
- quiet hours
- reminder vibration
- voice
- snooze defaults
- notification settings
- exact-alarm health
- test reminder
- data reset

---

# Phase 12 — Polish

Goals:
- screen transitions
- success animations
- haptics
- Lottie where justified
- responsive pass
- accessibility
- copy consistency
- performance
- dark/light decision
- edge cases

---

# Phase 13 — QA / Release Build

Test:
- real Android device
- multiple Android API levels if possible
- app killed
- locked screen
- reboot
- offline
- denied permissions
- schedule edits
- timezone
- midnight boundaries
- long-term histories
- APK/AAB clean build

---

# Rule for every phase

Before coding:
1. read relevant spec
2. inspect existing implementation
3. state files to change
4. implement only this phase
5. run lint/tests/build checks
6. summarize exactly what changed
7. list remaining known issues
8. do not silently redesign prior architecture

---

# Recommended first proof

Water is the first complete end-to-end reminder.

Reason:
- simple recurring schedule
- tests notification
- tests vibration
- tests voice
- tests background
- tests Snooze/Done
- tests activity
- tests Home update

Once water is correct, reuse the reminder architecture for medicine/food/bathroom.
