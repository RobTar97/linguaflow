# 002 — Animate session progress with transform

- **Status**: DONE
- **Commit**: WORKTREE (repository has no commits yet)
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 2 files, small

## Problem

Conversation progress animates `width`, forcing layout and paint on every frame.

```tsx
// src/App.tsx:767 — current
<motion.span
  animate={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
  transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
/>
```

## Target

Keep the progress element at full width and animate a horizontal scale from the left.

```tsx
<motion.span
  style={{ transformOrigin: "left center" }}
  animate={{
    transform: `scaleX(${(questionIndex + 1) / questions.length})`,
  }}
  transition={{
    duration: 0.24,
    ease: [0.23, 1, 0.32, 1],
  }}
/>
```

Reduced motion changes the scale instantly while retaining the semantic progress value.

## Repo conventions to follow

- The progress track already clips overflow in `src/styles.css`.
- Use the shared `--ease-out` value represented in Framer Motion as `[0.23, 1, 0.32, 1]`.

## Steps

1. Give the progress indicator full width in CSS.
2. Set its transform origin to the left.
3. Replace animated width with `transform: scaleX(...)`.
4. Add `role="progressbar"` with `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`.
5. Make reduced-motion progress updates instant.

## Boundaries

- Do not change progress semantics or question counting.
- Do not introduce a canvas or SVG progress implementation.

## Verification

- **Mechanical**: `npm run lint && npm run build`.
- **Feel check**:
  - Advance and go back through questions; the bar retargets smoothly.
  - Spam next/back; it never restarts from zero.
  - Performance tools show no layout activity from the bar animation.
- **Done when**: the progress indicator changes only through transform and exposes correct progress semantics.
