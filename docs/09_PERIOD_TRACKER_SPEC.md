# Period Tracker Specification

## 1. Goal

Help the user remember:
- when her last period started
- past period dates
- an estimated next period date

This feature is a personal calendar aid, not a diagnostic or fertility tool.

---

# 2. Required data

Each cycle entry:
- start date required
- end date optional
- notes optional

Initial setup:
- last period start date
- optional average cycle length if insufficient history
- optional typical duration

---

# 3. Definitions

Cycle length:
number of days between the start dates of consecutive periods.

Example:
Aug 12 start
Sep 9 start
cycle length = 28 days

Period duration:
inclusive or clearly defined number of days from start to end.

Choose one consistent implementation and document it.

---

# 4. Prediction logic

## With only one recorded period

Use user-provided/default average cycle length.

Example:
last start = Aug 12
configured average = 28
estimated next start = Sep 9

## With multiple recorded periods

Calculate observed cycle lengths between valid consecutive starts.

Preferred V1 estimate:
average of recent valid cycles, e.g. up to latest 3–6 cycles.

Keep algorithm simple and transparent.

Do not use machine learning.

---

# 5. Handling unusual data

Do not silently include impossible data.

Validation:
- future period start can be logged only with clear intention; normally disallow accidental future date
- end date cannot be before start
- duplicate start date should warn/update existing entry
- cycles must be chronologically sortable

If a cycle interval is extremely short/long, preserve user-entered data but consider excluding it from prediction only if a transparent documented rule exists.

Simpler V1:
include valid chronological cycles and present estimate as approximate.

---

# 6. Prediction wording

Always use:
- Expected around
- Estimated
- Around {date}

Never:
- Your period will start on
- Guaranteed
- Exact date

---

# 7. Countdown states

Future:
"Expected in about 4 days"

Today:
"Expected around today"

Past estimate with no logged period:
"Expected around 3 days ago"

Do not call it "late" in V1 because that can create medical interpretation.

Use:
"The estimate has passed. Log the new start date whenever it begins."

---

# 8. Period reminders

Possible V1 reminders:
- 3 days before expected date
- 1 day before
- expected day

User can enable/disable.

These reminders should be gentle.

Examples:
"Your next period is expected in around three days."

"Your period is expected around tomorrow."

---

# 9. Period started today

Action:
1. show confirmation sheet
2. default date = today
3. allow date change
4. save cycle
5. recalculate observed average
6. recalculate estimate
7. update Home
8. create activity event
9. reschedule future period notifications

Do not require end date immediately.

---

# 10. End period

User can later mark:
"Period ended"

Default selected date = today.

Save end date.

---

# 11. Calendar display

Confirmed period:
solid soft rose markers/range

Predicted:
lighter/dashed/soft tint

Today:
neutral outlined marker

Do not visually make predictions look identical to facts.

---

# 12. Cycle history

List newest first.

Example:

Sep 9 – Sep 13
Cycle length: 28 days

Aug 12 – Aug 16
Cycle length: 29 days

For earliest cycle where prior start is unavailable:
cycle length may be omitted.

---

# 13. Editing history

When an entry changes:
- update row
- recalculate all affected cycle lengths
- recalculate next estimate
- reschedule expected-period reminders
- preserve audit only if later needed; not mandatory V1

---

# 14. Privacy

Period data stays local in V1.

Do not log exact period information to third-party analytics.

Do not include period detail in crash logs.

---

# 15. Disclaimer tone

A short Settings/Period info note is enough:

"Period dates are estimates based on the dates you record. Cycles can naturally vary."

Do not clutter every screen with medical disclaimers.
