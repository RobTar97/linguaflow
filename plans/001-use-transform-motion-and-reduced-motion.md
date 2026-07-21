# 001 — Use transform motion and preserve reduced-motion feedback

- **Status**: DONE
- **Commit**: WORKTREE (repository has no commits yet)
- **Severity**: HIGH
- **Category**: Performance, accessibility, cohesion
- **Estimated scope**: 3 files, medium

## Problem

Topic cards, topic details, filter sheets, session dialogs, and question swaps use Framer Motion `x`/`y` shorthands. These run through main-thread style updates rather than a single transform string. The same movements are still declared when reduced motion is requested, while the global CSS override removes every transition—including useful color and opacity feedback.

```tsx
// src/App.tsx:442 — current
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.98 }}
```

```tsx
// src/App.tsx:529 — current
initial={{ opacity: 0, x: 12 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: -8 }}
```

```css
/* src/styles.css:1472 — current */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 1ms !important;
  }
}
```

## Target

- Use `useReducedMotion()` from Framer Motion once at the learning-workspace seam.
- Pass a primitive `reduceMotion` value into animated modules.
- Replace `x`, `y`, and `scale` shorthands with complete transform strings.
- Enter/exit motion uses `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` and stays within 180–240ms.
- Reduced motion keeps opacity and color transitions at 120ms but removes translation and scale.

```tsx
const reduceMotion = useReducedMotion();

initial={{
  opacity: 0,
  transform: reduceMotion ? "none" : "translateY(8px)",
}}
animate={{ opacity: 1, transform: "none" }}
exit={{
  opacity: 0,
  transform: reduceMotion ? "none" : "translateY(-6px)",
}}
```

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 120ms;
    --duration-normal: 120ms;
    --duration-moderate: 120ms;
  }

  .motion-translate,
  .motion-scale {
    transform: none !important;
  }
}
```

## Repo conventions to follow

- Motion tokens currently live in `src/styles.css:32-36`.
- React motion declarations currently live beside the UI that changes state.
- Keep the product crisp and calm; no visible bounce in routine navigation.

## Steps

1. Add `--ease-out`, `--ease-in-out`, and `--ease-drawer` tokens beside the duration tokens in the design-token stylesheet.
2. Import and call `useReducedMotion()` in the learning-workspace module.
3. Replace every Framer Motion `x`, `y`, and `scale` shorthand with a full `transform` string.
4. For reduced motion, set transform to `none` in every initial/exit state while retaining opacity.
5. Replace the global 1ms transition reset with targeted movement removal and 120ms opacity/color feedback.
6. Keep modal transform origin centered; do not alter it.

## Boundaries

- Do not change product copy, layout, or interaction order.
- Do not add another animation dependency.
- Do not add bounce to topic selection, filters, or question changes.

## Verification

- **Mechanical**: `npm run lint && npm run build`.
- **Feel check**:
  - Switch topics repeatedly; detail changes start immediately and never hitch.
  - Open and close filters rapidly; motion retargets cleanly.
  - Enable reduced motion; movement disappears, but fades and color feedback remain visible.
  - Use browser performance recording and confirm transitions animate transform/opacity only.
- **Done when**: no Framer Motion `x`, `y`, or `scale` shorthand remains in the product UI and reduced motion preserves non-spatial feedback.
