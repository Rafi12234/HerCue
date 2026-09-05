# Reminder, Alarm, Voice, Vibration and Notification Engine

## 1. Why this subsystem is critical

The application must not treat reminders as decorative UI.

The reminder engine is a core domain service.

The desired experience is:
- reminder occurs near intended time
- user receives visible notification
- phone vibrates according to category/importance
- spoken reminder or configured audible message plays where platform rules allow
- user can respond
- app records outcome
- next reminder remains correct

---

# 2. Platform priority

V1 target:
Android first.

The project may remain cross-platform at the React Native UI level, but do not weaken Android reminder reliability simply to pretend both platforms behave identically.

Use platform abstractions so iOS behavior can be added later.

---

# 3. Expo versus native responsibility

Expo APIs are useful for:
- notification permissions
- notification channels
- notification scheduling where suitable
- notification response handling
- app-level notification integration

For strict Android alarm-style timing and behavior, a small native Kotlin layer may be required.

Candidate native pieces:
- AlarmManager
- BroadcastReceiver
- boot receiver / rescheduling path where appropriate
- TextToSpeech
- Vibrator / VibrationEffect
- NotificationManager / channel configuration when native control is needed

Do not add native code unless needed; but do not avoid it if it is needed for the defined product behavior.

---

# 4. Exact alarm considerations

Modern Android places restrictions on exact alarms.

Implementation must:
- check platform/API level
- declare/request appropriate alarm permission/access where applicable
- detect when precise alarm access is unavailable
- fall back gracefully
- explain the limitation to the user

Never promise that an app can bypass Android policy without required user/system permission.

Scheduling logic must support both:
- exact user-facing reminders where allowed and justified
- inexact/local scheduling fallback where exact access is unavailable

---

# 5. Reminder occurrence model

Never schedule only from abstract reminder definitions.

Use generated occurrences.

Example:

Reminder definition:
Water every 2 hours from 8 AM to 10 PM

Occurrences:
- 08:00
- 10:00
- 12:00
...

Each occurrence has:
- occurrence id
- reminder definition id
- type
- scheduled time
- state
- trigger identifier/native alarm identifier
- snooze relation
- timestamps

This makes history and reconciliation reliable.

---

# 6. Scheduling horizon

Do not necessarily schedule years of alarms.

Recommended:
- generate/schedule a reasonable rolling horizon
- reconcile daily/on app launch/on relevant changes
- ensure next occurrences are always prepared

Medicine start/end and recurrence rules must be respected.

---

# 7. Reconciliation algorithm

Run reconciliation:
- after app startup
- after database migration
- after settings change
- after reminder change
- after completing dynamic food/bathroom action
- after device time/timezone change if detected
- after reboot support path
- after permission becomes available

Conceptual algorithm:

1. load active reminder definitions
2. load pending future occurrences
3. calculate expected future occurrences
4. remove/cancel invalid scheduled alarms
5. create missing occurrences
6. schedule unscheduled valid occurrences
7. deduplicate by stable occurrence key
8. mark clearly expired unanswered occurrences MISSED where applicable

Must be idempotent.

---

# 8. Stable identifiers

Create deterministic/stable identifiers where possible.

Example conceptual key:
`medicine:{medicineId}:{scheduledISO}`

Water:
`water:{scheduleId}:{scheduledISO}`

Snooze:
`{parentOccurrenceId}:snooze:{timestamp}`

Native alarm request codes/ids must not collide.

---

# 9. Voice behavior

Desired examples:

Water:
"It's time to drink some water."

Medicine:
"It's time to take your Napa, one tablet after food."

Bathroom:
"A little reminder to take a bathroom break."

Food:
"It's been around six hours. Have you eaten anything?"

Period:
"Your next period is expected in around three days."

## Voice rules

- sentence stored/generated at trigger creation
- sanitize text before TTS
- avoid reading raw punctuation/IDs
- medication name may be difficult for TTS; accept this limitation
- keep sentence concise
- provide voice on/off setting
- do not repeatedly speak indefinitely
- notifications must still work if TTS fails

## Background limitations

Android background execution, lock-screen behavior, audio focus and device manufacturer power management can affect behavior.

The implementation must test on real target devices.

Never write documentation/UI promising "always speaks even in every silent/DND state" unless the actual native implementation and granted system privileges guarantee it.

Instead:
- maximize reliability
- configure alarm/notification channels appropriately
- request required permissions
- disclose system-controlled limitations

---

# 10. Silent/DND behavior

This is a sensitive technical requirement.

The product goal is to make reminders noticeable even when normal notification volume is low.

However:
- silent mode
- Do Not Disturb
- notification channel user settings
- OEM power management
- alarm access

can override app intentions.

The app must:
- create appropriate Android channels
- use alarm usage/category only where justified
- offer a "Test reminder" function in Settings
- show current permission/channel health
- never secretly modify system settings

---

# 11. Vibration behavior

Reminder vibration should be stronger/more noticeable than tiny UI haptics.

Use a deliberate finite waveform.

Do not vibrate indefinitely.

Possible conceptual pattern:
- pulse
- pause
- pulse
- longer pause
- final pulse

Test on real hardware because amplitude support varies.

Different categories may share one consistent reminder pattern for simplicity.

User can disable reminder vibration.

---

# 12. Notification channels

At minimum consider:
- Reminders
- Medicine reminders (if separation is useful)
- General updates

Avoid creating too many channels because users manage them at OS level.

Channel importance, sound and vibration must be configured thoughtfully.

Remember that once Android notification channel settings exist, some properties are user/system controlled and app changes may not override them.

Provide an "Open notification settings" action.

---

# 13. Notification actions

Where supported:

Water:
- Drank
- Snooze

Medicine:
- Taken
- Snooze
- Skip

Bathroom:
- Went
- Snooze

Food:
- Ate
- Snooze

Action handlers must:
- persist result
- be safe if app process starts from action
- avoid duplicate processing
- update/cancel notification
- schedule next dynamic reminder if necessary

Use transactions where multiple database operations must stay consistent.

---

# 14. Notification tap

Tapping notification body should deep-link to relevant screen.

Examples:
- medicine occurrence → medicine/today/detail
- water → Home or Water detail
- period estimate → Period screen

---

# 15. Missed detection

A notification disappearing is not proof of completion.

If an occurrence remains TRIGGERED/PENDING beyond its valid response window, mark it MISSED during reconciliation.

Do not assume OS notification dismissal means completion.

If notification-dismiss callbacks are available, they may be recorded separately.

---

# 16. Dynamic food scheduling

When user confirms meal:
1. store food activity
2. cancel obsolete future food check if needed
3. calculate next = completion + interval
4. apply quiet-hour policy
5. create occurrence
6. schedule

Use database transaction before/with scheduling reconciliation.

---

# 17. Dynamic bathroom scheduling

Same concept as food when interval-from-last-visit is enabled.

Completion time becomes anchor.

---

# 18. Medicine schedule edit

On edit:
1. validate
2. save medicine/schedule transaction
3. preserve past occurrences
4. cancel invalid future native alarms
5. regenerate future occurrences
6. schedule new valid alarms

---

# 19. Test reminder

Settings must contain a test function.

"Test reminder"

It should verify:
- notification appears
- vibration occurs if enabled
- spoken line plays if enabled
- action handling works

This is critical for device-specific validation.

---

# 20. Observability during development

In dev builds create structured logs for:
- occurrence generated
- alarm scheduled
- alarm cancelled
- alarm triggered
- action received
- TTS started/failed
- notification created
- reconciliation started/completed

Do not expose noisy logs in production UI.

---

# 21. Reminder engine acceptance

Not complete until tested for:
- app foreground
- app background
- app swiped away
- screen locked
- device reboot
- permission denied
- permission later granted
- timezone/time change
- schedule edit
- duplicate reconciliation
- snooze
- rapid double-tap action
- offline mode
