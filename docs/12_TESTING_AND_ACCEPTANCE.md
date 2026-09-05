# Testing and Acceptance Criteria

## 1. Testing philosophy

This app deals with reminders. A UI screenshot is not proof the feature works.

Test domain logic, persistence, scheduling and real-device behavior.

---

# 2. Unit tests

Prioritize:
- period estimate
- cycle length calculation
- recurrence generation
- next food reminder
- next bathroom reminder
- quiet-hours adjustment
- occurrence state transitions
- analytics aggregation helpers
- timezone/date boundary helpers
- deterministic schedule keys

---

# 3. Repository tests

Test:
- insert/update medicine
- schedule rows
- occurrence completion
- duplicate occurrence prevention
- period edit
- activity query ranges
- notification history
- migrations

---

# 4. Water acceptance

- can enable
- can set interval and active hours
- next occurrence appears
- trigger generates notification
- vibration works when allowed/enabled
- spoken line works when supported/enabled
- Drank persists
- Snooze reschedules
- ignored event eventually becomes Missed
- Home updates
- Activity updates
- restart preserves state

---

# 5. Medicine acceptance

- add medicine
- multiple times
- repeat days
- notification names correct medicine
- Taken persists
- Snooze works
- Skip works
- history shows scheduled and actual
- edit cancels obsolete future alarms
- disabling cancels future alarms
- past history remains

---

# 6. Food acceptance

- default interval 6h
- user confirms Ate
- next time = actual confirmation + interval
- manual Ate also updates next
- Snooze does not create duplicates
- quiet hours handled
- Activity reflects actual event

---

# 7. Bathroom acceptance

- configurable interval
- Went stores current time
- next interval recalculated
- Snooze
- quiet hours
- history correct

---

# 8. Period acceptance

- last period can be added
- next estimate displays
- wording says expected/estimated
- additional cycles update average
- editing history recalculates prediction
- period start today works
- end date validation
- calendar distinguishes actual vs prediction

---

# 9. Activity acceptance

Day:
- chronological
- accurate local date
- statuses correct

Week:
- real aggregation
- no duplicate counts

Month:
- accurate month boundaries

Year:
- accurate monthly grouping

No data:
- proper empty state

---

# 10. Notification center acceptance

- triggered event appears
- unread count works
- mark read
- grouped date sections
- linked detail navigation
- deleting inbox record does not delete activity

---

# 11. Permission tests

Test:
- notifications granted
- notifications denied
- exact-alarm access unavailable
- access later granted
- voice disabled
- vibration disabled

App should not crash.

---

# 12. Lifecycle tests

Test reminder when:
- app open
- app backgrounded
- screen locked
- app removed from recent apps
- device restarted
- device offline

Document device/OEM limitations found.

---

# 13. Time tests

- daylight/timezone changes if relevant
- manual clock change
- midnight
- month end
- year end
- leap day
- schedule exactly at active-hours boundary
- snooze across quiet-hour boundary

---

# 14. UI tests

Target:
- narrow phone
- average phone
- large phone

Check:
- text clipping
- horizontal overflow
- keyboard hiding inputs
- bottom sheet safe area
- navigation bar
- long medicine name
- large font setting
- empty state
- long history list
- chart labels

---

# 15. Animation performance

- no visible jank on normal target phone
- no infinite decorative animations consuming excessive battery
- no layout thrashing
- screen transitions remain smooth with real data

---

# 16. Destructive actions

Test:
- delete medicine confirmation
- clear all data confirmation
- cancelling dialog leaves data intact
- clear all cancels native alarms

---

# 17. Build acceptance

Before handover/release:
- clean install dependencies
- clean/prebuild as required
- development build succeeds
- production Android build succeeds
- no secrets
- no critical console errors
- no unresolved TODO in critical path
- app starts from fresh install
- migrations work from previous test schema where relevant
