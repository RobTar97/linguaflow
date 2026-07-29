# 006 — Remove collection-wide layout animation work

- **Status**: DONE
- **Commit**: 324d32f
- **Severity**: MEDIUM
- **Category**: Performance, accessibility
- **Estimated scope**: 2 files, small

## Problem

Every search keystroke and filter change triggers Framer Motion layout
measurement on the grid and every visible card:

```tsx
// src/features/explore/ExploreExperience.tsx:180 — current
<motion.div className="topic-grid" layout>
```

```tsx
// src/features/explore/ExploreExperience.tsx:477 — current
<motion.article layout>
```

The collection can contain dozens of cards. Card variants honor reduced motion,
but unconditional `layout` still moves cards spatially for users who request
less motion.

## Target

- The grid and cards do not use Framer Motion `layout`.
- Entering cards retain the existing opacity/8 px entrance, capped to the first
  eight items.
- Exiting cards use opacity plus `scale(0.98)` only.
- Empty and populated states crossfade in at most 160 ms.
- Reduced motion uses opacity only and no stagger.

## Repo conventions to follow

- Collection variants live in `src/motion/presets.ts`.
- Strong ease-out is `[0.23, 1, 0.32, 1]`.
- The existing `contentItemVariants()` already caps stagger at eight cards.

## Steps

1. Remove `layout` from the topic-grid motion element and from `TopicCard`.
2. Wrap the populated and empty result branches in one `AnimatePresence`
   region using `mode="sync"` and stable keys.
3. Give the empty state a 160 ms opacity entrance and 100 ms exit; remove
   positional movement when reduced motion is active.
4. Preserve semantic result-count announcements and immediate pointer/keyboard
   interaction while cards enter.

## Boundaries

- Do not virtualize the collection.
- Do not change filtering, sorting, search, or selected-topic logic.
- Do not add dependencies.
- Do not animate width, height, margin, padding, top, or left.
- If cited structures have drifted since commit `324d32f`, stop and report.

## Verification

- **Mechanical**: `npm run lint`, `npm run test`, and `npm run build` pass.
- **Feel check**:
  - Type quickly in search and switch filters; results respond on each input
    without cards sliding across the grid.
  - At 10% playback speed, cards fade/settle independently and never block
    clicking.
  - With reduced motion enabled, cards only fade and never change position.
  - React Profiler shows no Framer layout-measurement pass for each card.
- **Done when**: collection changes no longer request layout animation while
  preserving a brief, non-blocking entrance cue.
