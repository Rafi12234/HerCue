# START HERE — AI Project Context

## Purpose of this folder

This folder is the permanent specification pack for an Android-first personal care reminder application being built with GitHub Copilot using Claude Opus.

The coding agent must read these Markdown files before implementing or modifying the project. These documents define the product, UI direction, technical architecture, reminder behavior, data model, coding standards, testing expectations, and implementation order.

The application is being created with love for the developer's wife. The experience must therefore feel personal, gentle, cute, warm, premium, trustworthy, and carefully crafted. It must never look like a generic admin dashboard, hospital system, template application, or typical "AI-generated" CRUD interface.

---

# Product in one sentence

A gentle personal companion that remembers important everyday things, reminds the user at the right time in an impossible-to-miss but caring way, and keeps a clear history of daily routines.

---

# V1 scope

The first version focuses ONLY on these five areas:

1. Water reminders
2. Medicine reminders
3. Bathroom/pee reminders
4. Food reminders based on a six-hour interval
5. Period tracking and next-period estimation

Supporting V1 systems that are mandatory:

- spoken reminder sentence
- vibration
- system notification
- snooze
- completion/skip/missed states
- reminder scheduling
- offline persistence
- in-app notification history
- complete activity history
- day/week/month/year analytics
- settings
- permission handling
- polished animations and transitions

Do not add unrelated modules during V1.

---

# Core product rule

Every actionable reminder follows the same conceptual lifecycle:

Scheduled
→ Triggered
→ User alerted
→ User response or no response
→ Activity recorded
→ Next reminder recalculated or scheduled

The UI is not the source of truth. Reminder records and activity records must persist locally.

---

# Technology direction

Use:

- React Native
- Expo development build / prebuild workflow
- JavaScript
- Expo Router
- Expo SQLite
- Zustand
- expo-notifications
- date-fns
- React Native Reanimated
- Lottie where useful
- Lucide React Native
- React Hook Form
- Zod
- charts suitable for React Native
- a small Android-native Kotlin reminder/alarm layer when Expo APIs alone cannot satisfy reliability requirements

Do not assume Expo Go can validate all native reminder behavior. Development builds are expected.

Do not hard-code package versions from this document. At implementation time, use versions compatible with the installed Expo SDK and install Expo packages with `npx expo install`.

---

# Important alarm behavior

The desired user experience is stronger than a normal notification.

A reminder should be capable of:

- showing a system notification
- using a recognizable vibration pattern
- presenting a human-readable reminder sentence
- speaking or playing the reminder message where technically permitted
- providing quick actions such as Done / Snooze / Skip where appropriate
- working while the app is backgrounded
- being restored/reconciled after app restart and device reboot where supported

Android system restrictions and permissions must be respected. Never fake or claim that the app can bypass system policies it cannot legally or technically bypass.

The application should explain required notification/alarm permissions in friendly language.

---

# Privacy philosophy

The app contains personal routine and cycle data.

V1 is offline-first.

Do not introduce a server, login, analytics SDK, advertisement SDK, or cloud synchronization unless explicitly requested later.

Do not transmit private data off-device.

Do not make medical diagnoses or represent period predictions as guaranteed.

---

# Mandatory reading order for coding agents

Before writing code, read:

1. `00_START_HERE.md`
2. `01_PRODUCT_REQUIREMENTS.md`
3. `02_FEATURE_BEHAVIOR_SPEC.md`
4. `03_UI_UX_DESIGN_SYSTEM.md`
5. `04_SCREENS_AND_NAVIGATION.md`
6. `05_REMINDER_ALARM_ENGINE.md`
7. `06_DATABASE_AND_DATA_MODEL.md`
8. `07_ARCHITECTURE_AND_TECH_STACK.md`
9. `08_ACTIVITY_AND_ANALYTICS.md`
10. `09_PERIOD_TRACKER_SPEC.md`
11. `10_PROJECT_STRUCTURE_AND_CODE_RULES.md`
12. `11_IMPLEMENTATION_ROADMAP.md`
13. `12_TESTING_AND_ACCEPTANCE.md`
14. `13_PRIVACY_PERMISSIONS_AND_SAFETY.md`
15. `14_COPILOT_OPUS_WORKFLOW.md`

If documents appear to conflict, this file defines the product scope, while the more specialized document defines the detailed implementation behavior.

---

# Non-negotiable design principles

- Cute, not childish.
- Romantic/warm, not overly decorative.
- Premium, not template-like.
- Soft, not visually flat.
- Animated, but never distracting.
- Easy to use with one hand.
- Important actions must be obvious.
- No clutter.
- No unnecessary forms.
- No giant walls of text.
- No generic dashboard aesthetic.
- No aggressive health language.
- No guilt-inducing messages after a missed reminder.
- No medical diagnosis.
- Offline behavior must be first-class.
- Accessibility and readable contrast remain important even with a soft pastel design.

---

# Definition of V1 completion

V1 is complete only when:

- all five reminder/tracker modules work
- schedules persist after closing/reopening the app
- relevant reminders can trigger in background on the target Android device
- notification permissions are handled
- exact-alarm requirements are handled where needed
- water, medicine, bathroom and food interactions create activity records
- period history persists
- day/week/month/year activity views are based on real stored data
- missed/snoozed/completed states are represented correctly
- empty states and error states exist
- the application feels coherent and polished
- transitions and feedback are smooth
- there are no fake buttons, dummy graphs, or hard-coded analytics in production UI
