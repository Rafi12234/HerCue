# Detailed Feature Behavior Specification

This file defines how each V1 feature behaves.

---

# 1. Water

## 1.1 Configuration

Allow:
- enable/disable water reminders
- wake/start time
- end/quiet time
- interval
- optional daily target
- snooze duration
- reminder voice enabled
- vibration enabled

Do not require a daily target for reminders to work.

## 1.2 Reminder trigger

At the scheduled time:
1. create/mark a reminder occurrence as TRIGGERED
2. notify the user
3. trigger configured vibration
4. speak/play reminder line if permitted by current platform settings
5. show actionable UI

Suggested sentence:
"It's time to drink some water."

## 1.3 User actions

### Drank
- set occurrence COMPLETED
- store completion time
- increment water count if using count-based target
- update Home
- update Activity
- schedule/reconcile next occurrence

### Snooze
- mark current occurrence SNOOZED or create a snooze child occurrence
- save snooze-until time
- schedule new trigger
- avoid duplicate original trigger

### Ignore
If no response by configured expiration rule:
- mark occurrence MISSED
- do not continuously harass the user
- next regular reminder remains valid

## 1.4 Quick log
Home may provide a quick "I drank water" action even without waiting for a reminder.
This creates a manual COMPLETED activity.

---

# 2. Medicine

## 2.1 Medicine fields

Required:
- id
- name
- active
- schedule

Optional:
- dosage text
- instructions
- notes
- start date
- end date
- color/icon identifier

Examples:
- Napa
- 1 tablet
- After food

## 2.2 Schedule patterns

V1 should support:
- every day at one or more times
- selected days of week
- optional start/end date

Avoid overbuilding complex medical recurrence rules in V1 unless requested.

## 2.3 Reminder sentence

Base:
"It's time to take your {medicineName}."

With dosage:
"It's time to take your {medicineName}, {dosage}."

With instruction:
"It's time to take your {medicineName}. {instruction}."

Keep generated text short enough to sound natural.

## 2.4 Actions

Taken:
- COMPLETED
- store actual taken time

Snooze:
- reschedule by user-selected duration
- preserve relation to original occurrence

Skip:
- SKIPPED
- optionally allow a small reason field, but do not require it

Missed:
- produced by timeout/reconciliation if no response

## 2.5 Editing medicines

When a medicine schedule changes:
- cancel future scheduled occurrences belonging to the old schedule
- preserve past history
- generate/reconcile future schedule
- avoid duplicate notifications

When a medicine is disabled:
- cancel future alarms/notifications
- preserve historical logs

When deleted:
- prefer soft deletion/archive if needed to preserve historical meaning

---

# 3. Bathroom / Pee Reminder

## 3.1 Purpose

This is a personal reminder, not a medical recommendation.

Use neutral labels in data/code such as `bathroom`, not slang.

The UI can say "Bathroom".

## 3.2 Settings

- enabled
- interval
- active start time
- active end time
- snooze duration
- behavior:
  - fixed interval schedule
  - interval from last confirmed visit

Preferred V1 behavior:
interval from last confirmed visit, with a safe initial starting schedule.

## 3.3 Reminder copy

"A little reminder to take a bathroom break."

or

"Do you need a bathroom break?"

Keep copy gentle.

## 3.4 Actions

Went:
- COMPLETED
- record completion time as last confirmed visit
- calculate next time from completion + interval

Snooze:
- create temporary next reminder

Not now:
- can behave as a short snooze or SKIPPED based on UI wording
- be consistent

---

# 4. Food Check

## 4.1 V1 default

Default interval:
6 hours

The user should not receive unnecessary food reminders while sleeping.

## 4.2 Dynamic behavior

Preferred model:

When the user confirms "I ate" at time T:
next food check = T + 6 hours

If that time falls outside active hours:
apply quiet-hours policy.

Example:
- Ate at 8:15 AM
- Next check: 2:15 PM
- Ate at 2:42 PM
- Next check: 8:42 PM

## 4.3 Reminder copy

"It's been around six hours. Have you eaten anything?"

Do not make nutritional claims.

## 4.4 Actions

I ate:
- COMPLETED
- record actual meal confirmation time
- calculate next check

Remind later:
- SNOOZED

Skip:
- SKIPPED
- keep next schedule logic predictable

## 4.5 Manual log

Allow "I ate" from Home.
This resets/recalculates the next food check if configured.

---

# 5. Period Tracker

Detailed calculations are defined in `09_PERIOD_TRACKER_SPEC.md`.

Primary actions:
- log period start
- log/edit period end
- view estimated next date
- view cycle history
- edit incorrect entry

Never call an estimate guaranteed.

---

# 6. Global reminder behavior

## 6.1 Quiet hours

Quiet hours are user configurable.

During quiet hours:
- water reminders should normally be deferred
- bathroom reminders should normally be deferred
- food reminders should normally be deferred
- medicine behavior needs explicit per-medicine choice or user setting because medication times can be important

Never silently change a medicine schedule without showing the user.

## 6.2 Snooze presets

Suggested:
- 5 min
- 10 min
- 15 min
- 30 min

Medicine may default to 10 minutes.
Other reminders may use 10–15 minutes.

## 6.3 Duplicate prevention

A reminder occurrence needs a stable unique identifier.

Scheduling must be idempotent:
running reconciliation twice must not create duplicate pending alarms for the same occurrence.

## 6.4 Time zone changes

On app resume/start:
- compare stored timezone with current timezone
- reconcile future schedules
- keep absolute activity history intact
- ensure local-time schedules remain aligned with the user's intended wall-clock time

## 6.5 Device reboot

The app should restore/reconcile pending reminders after reboot where the Android scheduling implementation supports it.

## 6.6 App update/reinstall

Update:
- preserve SQLite data unless migration is required
- run migrations safely

Reinstall:
- local data may be lost; V1 has no cloud backup unless later added

---

# 7. Notification center behavior

The in-app Notification screen is not merely a copy of Android's tray.

It stores reminder-related events such as:
- triggered
- completed
- snoozed
- skipped
- missed
- schedule changed when meaningful

Fields:
- title
- message
- category
- timestamp
- status
- read/unread
- linked activity/reminder id

Actions:
- tap opens relevant detail where possible
- mark read
- mark all read
- optional delete from in-app history without deleting activity history

Notification history and activity history are related but conceptually different.

---

# 8. Home quick actions

Recommended quick actions:

Water:
- Drank water

Food:
- I ate

Bathroom:
- I went

Medicine:
- opens today's medicine list rather than blindly completing all medicines

Period:
- Period started today

Every quick action must:
- persist immediately
- animate success
- update today's summary
- update next calculated reminder if relevant

---

# 9. Friendly error behavior

Do not show raw technical errors.

Examples:

Permission denied:
"Notifications are turned off. Enable them so I can remind you at the right time."

Exact alarm unavailable:
"Precise reminders need one more Android permission."

Database issue:
"Something went wrong saving that. Please try again."

TTS unavailable:
"The spoken reminder couldn't play, but your notification is still active."

---

# 10. Empty states

Examples:

No medicines:
"No medicines added yet 🌷"

No activity:
"Your day is just getting started."

No period history:
"Add the first day of your last period to begin tracking."

No notifications:
"Nothing new right now ✨"
