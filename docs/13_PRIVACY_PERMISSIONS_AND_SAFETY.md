# Privacy, Permissions and Safety

## 1. Privacy default

V1 stores personal routine data locally.

Do not send it to:
- analytics providers
- ad networks
- backend
- cloud
- AI services

unless a future feature explicitly introduces this with clear consent.

---

# 2. Sensitive data

Treat as private:
- medicines
- medicine history
- period history
- routine patterns
- reminder completion
- notes

Avoid printing this data to production logs.

---

# 3. Permissions

Request only what is required.

Potential Android capabilities:
- notification permission
- vibration capability
- exact alarm access where required
- boot completion handling where applicable

Do not request:
- contacts
- location
- camera
- microphone
- storage/media
unless a future feature truly needs them.

Text-to-speech does not justify microphone access.

---

# 4. Permission UX

Before system dialog, explain value.

Example notification pre-prompt:
"Allow notifications so I can remind you even when the app isn't open."

Exact alarm:
"Precise reminders need Android's Alarms & reminders access."

Never shame user for denying permission.

If denied:
- tracking remains usable
- show reduced functionality
- provide Settings shortcut

---

# 5. Silent mode and DND honesty

Do not claim universal bypass.

The OS and user control:
- silent mode
- DND
- alarm permissions
- notification channel settings
- volume
- battery optimization

The app should maximize reliability and provide a test tool.

---

# 6. Medical boundary

This application is not a medical device in V1.

Do not:
- diagnose dehydration
- prescribe water quantity
- recommend medication dosage
- decide whether skipped medicine is safe
- diagnose urinary issues
- judge meal frequency
- infer pregnancy
- infer fertility
- diagnose period irregularity

It may store user-entered routines and remind them.

---

# 7. Medicine wording

The app repeats instructions entered by the user.

It must not invent dosage.

If medicine instructions are blank:
speak only the name.

---

# 8. Period wording

Predictions are approximate.

Use:
"Expected around"

Display a small informational note:
"Predictions are based on the dates you record and may vary."

---

# 9. Data deletion

Clear-data action must disclose:
"This will remove your reminders, history, medicines and period records from this device."

Require explicit confirmation.

Also cancel scheduled alarms.

---

# 10. Lock-screen privacy

Notifications may display private medicine/period information.

Settings should eventually allow privacy preference:
- full reminder text
- generic text on lock screen

If not implemented in first build, document as a future improvement.

A generic mode could say:
"Personal reminder — open the app."

---

# 11. No manipulative engagement

No streak shame.

No messages like:
"You broke your streak."

Prefer:
"Tomorrow is a fresh day."

---

# 12. Battery

Do not keep an unnecessary permanent background loop.

Use OS scheduling mechanisms.

Avoid continuous polling.

---

# 13. External libraries

Before adding:
- check privacy behavior
- avoid ad SDKs
- avoid unnecessary analytics
- verify maintenance and permissions
