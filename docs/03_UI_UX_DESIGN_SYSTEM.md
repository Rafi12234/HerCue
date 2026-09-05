# UI / UX Design System

## 1. Experience direction

This application is made for a beloved wife. The interface should communicate affection through craftsmanship, not through excessive hearts or childish graphics.

Design keywords:

- soft
- adorable
- elegant
- intimate
- calm
- feminine without stereotyping
- premium
- tactile
- smooth
- cozy
- emotionally warm
- modern

The product should look intentionally designed by a strong mobile product designer.

---

# 2. Avoid the "AI-generated app" look

Do NOT produce:
- identical rounded cards stacked endlessly
- giant gradients behind every section
- random glassmorphism everywhere
- neon colors
- excessive shadow
- emoji as the only visual language
- inconsistent icon families
- meaningless hero banners
- fake statistics
- overpacked dashboards
- random animation on every element
- web-style hover behavior on mobile
- huge headings consuming half the viewport

A polished app uses hierarchy, rhythm, whitespace, motion and feedback.

---

# 3. Visual concept

Suggested visual world:

"A tiny private garden of care."

Possible motifs:
- petals
- water droplets
- soft stars/sparkles
- rounded organic shapes
- subtle paper/card texture
- small floating decorative particles
- gentle flower/crescent illustrations

These elements must remain subtle.

---

# 4. Color system

Do not hardcode colors throughout components.

Create centralized design tokens.

Suggested palette direction, to be refined visually:

- warm ivory / soft cream background
- blush pink accent
- dusty rose secondary accent
- lavender supporting accent
- soft aqua for water
- muted coral for medicine
- peach for food
- lilac for bathroom
- rose for period
- deep warm charcoal for primary text
- muted warm gray for secondary text
- soft green for completed status
- amber for snoozed
- muted red only for genuine errors

The exact hex values should be selected once during UI implementation and stored in a theme file.

Do not use red as the dominant medicine color because the app should not feel alarming.

---

# 5. Typography

Use one carefully selected UI font that renders well on Android.

Possible direction:
- rounded, friendly sans-serif for display
- system/clean sans-serif for body if necessary

Do not bundle unlicensed font files.

Typography hierarchy:

Display:
- greeting / key emotional message

H1:
- screen title

H2:
- section title

Body:
- core information

Caption:
- timestamps and supporting text

Metric:
- next time / count / important number

Rules:
- never use tiny text for critical information
- maintain readable line height
- use font weights intentionally
- avoid more than 3–4 weights

---

# 6. Shape language

Use:
- medium-to-large corner radius
- pill controls for short filters
- soft circular quick-action buttons
- bottom sheets for lightweight actions

Avoid:
- sharp enterprise boxes
- borders on every component
- excessive nested cards

Visual separation can come from:
- spacing
- surface color
- subtle elevation
- grouping

---

# 7. Motion philosophy

Animations must communicate cause and effect.

Use React Native Reanimated for:
- card entry
- progress interpolation
- tab/segment transitions
- expandable sections
- bottom sheet transitions
- number/count transitions
- success feedback
- page micro-interactions

Use Lottie only for:
- one-time celebration
- elegant empty state
- onboarding illustration
- success moment

Do not use Lottie as a substitute for normal UI animation.

---

# 8. Required motion examples

## App launch
- soft fade/scale of logo
- transition into Home without long blocking splash animation

## Home cards
- staggered subtle entrance only on appropriate first load
- no annoying repeated entrance every tab switch

## Completing a task
Example: "Drank"
- button compresses slightly
- soft haptic feedback
- progress animates
- icon changes to check
- optional small sparkle/petal burst
- card state updates smoothly
- confirmation copy appears briefly

## Snooze
- clock icon rotates/shifts subtly
- time updates using number transition

## Activity filters
Day / Week / Month / Year:
- animated segmented-control indicator
- content crossfade/slide
- charts animate on initial data change, not continuously

## Period calendar
- selected dates use gentle scale/fill transition
- predicted range should be visually distinct from confirmed logged dates

---

# 9. Screen transitions

Use consistent transition language.

Recommended:
- normal detail push: native-feeling horizontal/standard stack
- add/edit form: bottom-up modal or sheet
- quick action: bottom sheet
- tab changes: minimal; avoid dramatic full-screen animations
- success: micro-animation, not full-screen every time

Transitions should feel 60fps on target devices.

---

# 10. Haptics

Haptics are part of the design language.

Use subtle haptics for:
- successful confirmation
- toggle
- important action
- segmented selection

Do not confuse UI haptics with the stronger reminder vibration engine.

Reminder vibration patterns are defined separately.

---

# 11. Home screen composition

The Home screen should prioritize "what matters next."

Recommended hierarchy:

1. personal greeting
2. next reminder hero
3. today's care summary
4. module cards
5. quick actions

Example conceptual layout:

Good morning, love 🌷
"One little thing at a time."

[ NEXT ]
Water in 24 min
10:30 AM

Today's care
Water  5/8
Medicine  2/3

[ Water ] [ Medicine ]
[ Food  ] [ Bathroom ]
[ Period ]

Do not make the screen a dense grid of numbers.

---

# 12. Module card personality

Water:
- aqua accent
- droplet motif
- animated water/progress fill used subtly

Medicine:
- rose/coral accent
- pill/capsule icon
- next medicine name prominent

Bathroom:
- lilac accent
- simple calm icon; avoid embarrassing visual treatment

Food:
- peach accent
- bowl/utensil icon
- time since last meal / next check

Period:
- rose/lavender accent
- flower/moon/calendar motif
- expected date wording

---

# 13. Notification screen

Feel like a gentle inbox.

Group by:
- Today
- Yesterday
- Earlier

Each item:
- category icon
- short message
- timestamp
- status
- unread indicator

Avoid oversized notification cards.

---

# 14. Activity screen

This screen must be beautiful but readable.

Top:
- Day / Week / Month / Year segmented control

Day:
- chronological timeline

Week:
- compact completion summaries and charts

Month:
- trend cards and calendar-like consistency view

Year:
- monthly trend summaries

Do not overload with five charts on one screen.

Prefer:
- one primary chart
- key metrics
- category breakdown
- details on tap

---

# 15. Period screen

Should be especially calm and private.

Suggested:
- large expected-date card
- cycle calendar
- "Period started today" button
- cycle history
- edit entry

Use "Expected around" or "Estimated".

Avoid fertility claims in V1.

---

# 16. Forms

Forms should use:
- clear labels
- friendly helper text
- proper keyboard/time picker/date picker
- inline validation
- sticky or obvious Save action

Do not create a form where everything is a plain TextInput.

Use native-feeling pickers for:
- time
- date
- repeat days
- interval

---

# 17. Loading states

Because V1 is local-first, long loading should be rare.

Use:
- skeleton only when truly needed
- subtle initial hydration state
- never flash fake data

---

# 18. Empty states

Use small custom illustration/icon + gentle line.

Examples:
"Nothing missed today. Lovely ✨"

"Add a medicine whenever you need one."

No large cartoon taking most of the screen.

---

# 19. Error states

Errors should not destroy the visual mood.

Use:
- concise explanation
- clear recovery action
- no scary full-screen red unless app truly cannot continue

---

# 20. Responsiveness

Target Android phones of multiple sizes.

Rules:
- no fixed screen-width assumptions
- use flex correctly
- text must shrink/wrap without clipping
- account for safe areas
- scrolling content must remain reachable
- bottom tab and bottom sheets must handle gesture/navigation areas
- test at narrow widths
- avoid hardcoded heights around text

---

# 21. UI quality acceptance

A screen is not "done" just because all fields exist.

Before completion verify:
- spacing hierarchy
- alignment
- typography
- icon consistency
- animation
- touch feedback
- empty state
- error state
- loading state if relevant
- narrow-screen behavior
- keyboard behavior
- safe area behavior
- visual consistency with other screens
