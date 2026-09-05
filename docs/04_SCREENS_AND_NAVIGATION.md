# Screens and Navigation Specification

## 1. Navigation model

Use Expo Router.

Primary bottom tabs:

1. Home
2. Notifications
3. Activity
4. Period
5. Settings

Medicine management can be accessed from Home and relevant settings/detail flows rather than requiring another permanent tab.

---

# 2. Route concept

Suggested route structure:

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
    index.js
    add.js
    [id].js
    edit/[id].js

  reminder/
    water.js
    bathroom.js
    food.js
    detail/[id].js

  activity/
    detail/[id].js

  period/
    add-cycle.js
    edit/[id].js

  settings/
    reminders.js
    permissions.js
    appearance.js

Route naming may be adjusted, but separation of responsibilities should remain clear.

---

# 3. Home

## Required sections

### Header
- greeting based on time of day
- optional affectionate subtitle
- date

### Next reminder
Must show:
- category
- reminder title
- next time
- relative time when helpful
- tap to open detail

### Today summary
At minimum:
- water progress
- medicine completed / total

### Care cards
Water:
- count/goal or recent status
- next reminder
- quick "Drank"

Medicine:
- today's completion
- next medicine
- open list

Bathroom:
- last confirmed visit
- next reminder
- quick "Went"

Food:
- last confirmed meal
- next check
- quick "I ate"

Period:
- last period
- expected next period
- days until estimate if applicable
- log start shortcut

### Floating/add action
Optional:
- Add medicine
- custom configuration shortcuts

Do not add arbitrary custom reminders in V1 unless requested.

---

# 4. Notifications

## Header
- title
- unread count
- mark all read action

## Filters
Optional:
- All
- Unread
- Water
- Medicine
- Food
- Bathroom
- Period

Do not make filters visually heavy.

## Grouping
- Today
- Yesterday
- Earlier

## Notification detail
Tap may show:
- title
- message
- scheduled time
- triggered time
- response
- linked task/medicine
- open related screen

---

# 5. Activity

## Top controls
Day | Week | Month | Year

## Day view
- date selector
- chronological timeline
- category filter optional
- each event shows time, category, status, details

## Week view
- week range
- overall completion
- water trend
- medicine adherence/completion
- food confirmations
- bathroom confirmations
- concise period event if present

## Month view
- month selector
- completion rate
- category breakdown
- trend visualization
- period start/end events

## Year view
- year selector
- month-by-month trend
- totals/completion summaries
- period history summary

Avoid implying health quality from raw completion metrics.
Say "routine completion" rather than "health score."

---

# 6. Period

## Main card
- last period start
- estimated next start
- estimate confidence wording kept simple
- average cycle length based on available history
- days remaining/overdue wording carefully handled

## Main action
"Period started today"

Should support selecting another date if needed.

## Calendar
Visual distinction:
- confirmed period days
- predicted next period window/date
- today
- selected date

## History
List cycles:
- start date
- end date if known
- cycle length if computable

## Edit
Allow correction without losing consistency.

---

# 7. Settings

Sections:

## Reminder preferences
- water
- medicine
- bathroom
- food
- period reminders

## General reminder behavior
- default snooze
- vibration
- spoken reminders
- quiet hours
- notification channel/status

## Permissions
Show friendly status:
- notifications
- exact alarm / alarms & reminders if applicable
- battery optimization guidance only if truly needed
- voice/audio limitations explanation

## Appearance
- theme if implemented
- motion preference if implemented

## Data
- export later (out of V1 unless implemented)
- clear data with strong confirmation
- app version

---

# 8. Water settings screen

Fields:
- enabled
- active from
- active until
- interval
- daily goal optional
- snooze duration
- voice
- vibration

Preview:
"Next reminders today: 10:00, 12:00, 2:00..."

Do not generate a huge list.

---

# 9. Medicine list

Sections:
- Today's
- All medicines

Medicine card:
- name
- dosage/instruction
- schedule
- active state

Actions:
- add
- edit
- enable/disable
- archive/delete with confirmation

Today's medicine row:
- scheduled time
- status
- quick Taken/Snooze/Skip when appropriate

---

# 10. Add/Edit medicine

Inputs:
- medicine name
- dosage
- instructions
- time(s)
- repeat days
- start date
- end date optional
- enabled

UX rules:
- medicine name is required
- at least one schedule time required
- validate end date >= start date
- Save performs schedule reconciliation

---

# 11. Bathroom settings

- enabled
- interval
- active hours
- reset interval after "Went" toggle/default behavior
- snooze
- voice
- vibration

---

# 12. Food settings

- enabled
- interval shown as 6 hours in V1 default
- active hours
- last meal manual correction if necessary
- snooze
- voice
- vibration

---

# 13. Permission onboarding

Do not bombard with all permissions on first frame.

Suggested sequence:
1. explain why reminders matter
2. request notifications at a meaningful point
3. if exact alarms are needed, explain and guide
4. explain spoken reminder behavior and device limitations

The app should remain usable for tracking even if a permission is denied, while clearly explaining reduced reminder reliability.

---

# 14. First-run setup

Keep short.

Suggested:
1. welcome
2. choose active/waking hours
3. configure water interval
4. optionally add medicine
5. enter last period date
6. notification/alarm permission
7. Home

Allow Skip where safe.

Food and bathroom can start from sensible user-confirmed setup values rather than silently inventing last activity times.
