# Activity and Analytics Specification

## 1. Purpose

The Activity section is a factual history of what happened.

It must answer:
- what happened today?
- what was completed?
- what was snoozed/skipped/missed?
- how consistent was the routine over time?

It must not produce a medical "health score."

---

# 2. Data source

All analytics must come from SQLite activity/occurrence data.

Never use hard-coded chart numbers in production.

---

# 3. Day view

## Header
- selected date
- previous/next day
- Today shortcut

## Summary
Potential:
- completed count
- missed/skipped count
- water count
- medicine completed / scheduled

## Timeline

Example:

08:10  Water      Drank
08:30  Food       Ate
09:00  Medicine   Taken
10:15  Bathroom   Went
12:30  Water      Snoozed
12:45  Water      Drank
17:00  Water      Missed

Timeline item should show:
- icon
- type
- meaningful action
- actual time
- scheduled time if relevant
- status

Tap opens detail.

---

# 4. Week view

## Week range
Monday–Sunday or locale-appropriate setting.

## Overall routine completion

Definition:
completed scheduled occurrences / eligible resolved scheduled occurrences

Clearly define whether SKIPPED is excluded or counted as non-complete.
Preferred:
- COMPLETED = completed
- SKIPPED/MISSED = not completed
- SNOOZED resolved by final child/response
- CANCELLED excluded

Manual activities may be shown but not inflate scheduled completion denominator incorrectly.

## Metrics
- water confirmations per day
- medicines taken / scheduled
- food confirmations
- bathroom confirmations
- missed events

## Chart
One primary weekly chart at a time.

Example:
water confirmations by day.

Allow category switching rather than displaying many charts simultaneously.

---

# 5. Month view

Show:
- selected month
- overall routine completion
- medicine completion
- water activity trend
- missed reminder count
- period event(s)

Useful visualization:
- calendar heat/markers
or
- weekly grouped trend

Do not imply that more bathroom logs is inherently healthier.

---

# 6. Year view

Show:
- year
- monthly routine completion trend
- medicine completion trend
- water consistency
- total recorded meal checks
- period history summary

Use monthly aggregation.

---

# 7. Category detail

Tapping a metric may open filtered history.

Examples:
Medicine month detail:
- each medicine
- scheduled
- taken
- skipped
- missed

Water:
- confirmations per day
- missed scheduled reminders

Food:
- confirmed meal checks
- approximate intervals, if calculated

Bathroom:
- confirmation history

---

# 8. Period analytics

Keep separate from general completion score.

Possible factual metrics:
- recorded cycle count
- average observed cycle length
- shortest observed cycle
- longest observed cycle
- last period date

Do not label variation as abnormal.
Do not diagnose.

---

# 9. Date boundaries

All day/week/month/year calculations must use the user's local timezone.

An activity at 12:05 AM belongs to the new local day.

Store instants consistently, convert for grouping.

---

# 10. Status colors

Use centralized semantic tokens.

Examples:
- complete = soft green
- snoozed = amber
- skipped = neutral/rose
- missed = muted warning red
- pending = accent/neutral

Also use icon/text because color alone is insufficient.

---

# 11. Charts

Rules:
- charts need accessible labels
- no 3D charts
- no pie chart with many categories
- no unnecessary gradients
- no misleading truncated axes
- animate modestly
- show empty state when no data
- show actual values on interaction or nearby labels

---

# 12. Activity detail

Fields:
- type
- action/status
- scheduled time
- trigger time if known
- completion time
- source
- medicine details if linked
- snooze history if relevant

No raw metadata JSON in normal UI.

---

# 13. Export

Out of scope for initial V1 unless explicitly requested.

Design repositories so CSV/JSON export can be added later.
