# 005 — Make content swaps responsive and interruptible

- **Status**: DONE
- **Commit**: 324d32f
- **Severity**: HIGH
- **Category**: Purpose, easing, duration, interruptibility
- **Estimated scope**: 4 files, medium

## Problem

Frequently repeated topic and question changes serialize exit and entrance
animations with `mode="wait"`. The user waits for both phases: 400 ms for topic
details and 320 ms for questions.

```tsx
// src/features/explore/ExploreExperience.tsx:564 — current
<AnimatePresence mode="wait">
  <motion.div
    key={topic.id}
    transition={{ duration: 0.2, ease: motionEase }}
  >
```

```tsx
// src/features/explore/ExploreExperience.tsx:841 — current
<AnimatePresence mode="wait">
```

The same question pattern exists at
`src/features/rooms/RoomSession.tsx:127`. Setup steps use a 200 ms exit and a
200 ms entrance at `src/features/setup/SetupFlow.tsx:121`.

Progress bars also use ease-out for an element moving on screen:

```tsx
// src/features/rooms/RoomSession.tsx:114 — current
transition={{ duration: reduceMotion ? 0 : 0.24, ease: motionEase }}
```

## Target

- Topic and question replacements use `AnimatePresence` with `mode="sync"`.
- Topic detail: 160 ms entrance with `cubic-bezier(0.23, 1, 0.32, 1)`;
  100 ms opacity-only exit.
- Question: 140 ms entrance with a maximum 4 px vertical offset; 100 ms
  opacity-only exit.
- Setup: retain its 200 ms transition but run exit and entrance concurrently.
- Progress motion uses `cubic-bezier(0.77, 0, 0.175, 1)`.
- Reduced motion keeps a 100–120 ms opacity change and removes translation.

## Repo conventions to follow

- Framer Motion presets live in `src/motion/presets.ts`.
- `motionEase` is `[0.23, 1, 0.32, 1]`.
- Add `motionEaseInOut = [0.77, 0, 0.175, 1]` beside it.
- Existing reduced-motion branches use `useReducedMotion()`.

## Steps

1. In `src/motion/presets.ts`, add `motionEaseInOut`, reduce question entrance
   to 140 ms and exit to 100 ms, cap translation at 4 px, and make the exit
   opacity-only.
2. In `src/features/explore/ExploreExperience.tsx`, change topic-detail and
   question presence modes from `wait` to `sync`; use 160 ms entrance and a
   100 ms opacity-only exit for the detail panel.
3. Use `motionEaseInOut` for the conversation progress transform.
4. In `src/features/rooms/RoomSession.tsx`, use `mode="sync"` for questions and
   `motionEaseInOut` for progress.
5. In `src/features/setup/SetupFlow.tsx`, use `mode="sync"` and the shared
   `motionEase` constant.

## Boundaries

- Do not change component markup or question navigation behavior.
- Do not add dependencies.
- Do not animate keyboard focus.
- Do not exceed 200 ms for any transition in this plan.
- If cited structures have drifted since commit `324d32f`, stop and report.

## Verification

- **Mechanical**: `npm run lint`, `npm run test`, and `npm run build` pass.
- **Feel check**:
  - At 10% playback speed, old and new content overlap only during a brief
    crossfade; no blank frame appears.
  - Repeated next/back clicks retarget immediately instead of waiting for a
    previous exit.
  - Progress starts and ends smoothly with the strong ease-in-out curve.
  - With reduced motion enabled, content fades without changing position.
- **Done when**: topic, question, and setup swaps complete in one concurrent
  phase and never queue a second full animation phase.
