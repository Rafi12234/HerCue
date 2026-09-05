# Product Requirements Document

## 1. Product vision

The application is a personal routine companion built for one loved person first.

Its purpose is not to maximize engagement or become a social platform. Its purpose is to quietly reduce the mental burden of remembering recurring everyday needs.

The application should feel like:

- a caring nudge
- a calm personal companion
- a beautiful private routine journal
- a reliable reminder system

It should not feel like:

- a hospital application
- a medication compliance dashboard
- an alarm-clock clone
- an enterprise task manager
- a habit-tracking game
- a generic template

---

## 2. Primary user

V1 has one primary user.

She should be able to use the application without technical knowledge.

The most common actions must require very few taps.

Examples:

- confirm water
- confirm medicine
- confirm food
- confirm bathroom visit
- snooze a reminder
- log period start
- see what happened today

---

## 3. Problems V1 solves

### 3.1 Forgetting to drink water
The user may go long periods without remembering to drink.

The application should:
- provide configurable reminders during waking hours
- let the user confirm that she drank
- record confirmation time
- show daily history and progress
- allow snooze
- avoid guilt-based language

### 3.2 Forgetting medicine
The user may forget a scheduled medicine.

The application should:
- store medicine name and instructions
- trigger at defined times
- identify the medicine in the spoken/visible reminder
- allow Taken / Snooze / Skip
- preserve history
- distinguish scheduled time from actual completion time

### 3.3 Forgetting bathroom/pee breaks
The application should allow configurable reminders to check whether a bathroom break is needed.

The reminder interval should be user-defined.

This feature must never claim a universal medically correct bathroom frequency.

A confirmation may reset the next interval if the user chooses interval-from-last-completion behavior.

### 3.4 Forgetting food for long periods
The user wants a check approximately every six hours.

The intended workflow is dynamic:
- user confirms a meal or serving
- app records actual confirmation time
- next check is calculated from that time + configured interval
- V1 default interval is 6 hours
- interval can later become configurable

The reminder is phrased as a gentle check:
"Have you eaten anything? It has been around six hours."

Do not phrase it as a medical command.

### 3.5 Forgetting period dates
The user needs:
- last period start date
- optional end date
- previous cycle history
- estimated next period date
- clear "expected/estimated" wording
- an easy "Period started today" action
- automatic recalculation after new entries

---

## 4. Product goals

### Functional goals
- reliable reminders
- easy confirmations
- accurate local history
- clear period estimation
- useful trend views
- offline operation

### Emotional goals
- caring
- peaceful
- personal
- delightful
- reassuring
- never judgmental

### Quality goals
- smooth animations
- consistent spacing
- no dead buttons
- no fake sample data after onboarding
- no reminder state loss
- no duplicate scheduling
- graceful permission failures

---

## 5. V1 modules

### Module A — Home
A snapshot of today:
- greeting
- next reminder
- water status
- medicine status
- bathroom status
- food status
- period status
- quick actions

### Module B — Notifications
In-app record of reminder events and relevant system notifications.

### Module C — Activity
Complete chronological and summarized activity:
- day
- week
- month
- year

### Module D — Period
Cycle history, estimate, logging and editing.

### Module E — Settings
Reminder settings, quiet hours, sounds, vibration, permissions and general preferences.

### Supporting modal/screen flows
- add medicine
- edit medicine
- water settings
- bathroom settings
- food settings
- snooze selector
- activity detail
- notification detail
- cycle edit

---

## 6. Out of scope for V1

Unless requested in a later phase, do NOT implement:

- husband/care-partner remote account
- cloud sync
- login/signup
- backend API
- remote push from another person
- AI health advice
- calorie tracking
- weight tracking
- exercise tracking
- doctor portal
- prescription scanning
- pharmacy integration
- social sharing
- ads
- gamified leaderboards
- public profiles
- fertility predictions
- pregnancy predictions
- diagnostic recommendations

---

## 7. Tone of reminder copy

Reminder text should be:
- short
- warm
- direct
- easy to understand when heard aloud

Good examples:

Water:
"It's time to drink some water."

Medicine:
"It's time to take your {medicineName}. {doseInstruction}."

Bathroom:
"A little reminder to take a bathroom break."

Food:
"It's been around six hours. Have you eaten anything?"

Period:
"Your next period is expected in around three days."

Avoid:
- "You failed to drink water."
- "You missed your medicine again."
- "You must eat immediately."
- "Your period will start on September 9."

---

## 8. Reminder response states

Use consistent system states:

- PENDING
- TRIGGERED
- COMPLETED
- SNOOZED
- SKIPPED
- MISSED
- CANCELLED

A UI label may be friendlier:
- Done
- Taken
- Drank
- Ate
- Went
- Remind later
- Skip

But data states should remain normalized.

---

## 9. Time concepts

Always distinguish:

- scheduled time
- trigger time
- action time
- next scheduled time

Example:
Medicine scheduled: 9:00 PM
Notification triggered: 9:00 PM
User presses Taken: 9:14 PM

All three relevant times can matter in history.

---

## 10. Offline-first rule

The core app must continue working without internet.

Features that must be local:
- settings
- schedules
- period history
- activity history
- reminder calculation
- notification scheduling
- UI dashboard
- analytics from local data

Network availability must not determine whether a reminder can work.

---

## 11. Accessibility

- use readable text sizes
- support dynamic text reasonably
- do not rely only on color for status
- interactive targets should be comfortably tappable
- respect reduced-motion preference where practical
- support dark mode only if it can be implemented at the same quality; a polished light theme is acceptable for early V1
- critical labels require sufficient contrast

---

## 12. Success criteria

The product succeeds if the user can answer these questions instantly:

- What is my next reminder?
- Did I drink water recently?
- Did I take my medicine?
- When did I last eat?
- When did I last mark a bathroom visit?
- When was my last period?
- Around when is my next period expected?
- What did I complete today?
- How consistent was I this week/month/year?
