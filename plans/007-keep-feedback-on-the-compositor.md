# 007 — Keep repeated feedback on the compositor

- **Status**: DONE
- **Commit**: 324d32f
- **Severity**: MEDIUM
- **Category**: Performance, accessibility, physicality
- **Estimated scope**: 1 file, small

## Problem

Topic-card hover animates a large painted shadow:

```css
/* src/styles/app.css:446 — current */
.topic-card {
  transition:
    border-color var(--duration-normal) var(--ease-standard),
    box-shadow var(--duration-normal) var(--ease-standard),
    transform var(--duration-normal) var(--ease-standard);
}
```

```css
/* src/styles/app.css:454 — current */
.topic-card:hover {
  box-shadow:
    0 2px 4px rgba(57, 45, 36, 0.05),
    0 14px 28px rgba(57, 45, 36, 0.09);
}
```

The loading spinner continues rotating under reduced motion, only more slowly:

```css
/* src/styles/app.css:2764 — current */
.spin-icon { animation-duration: 1600ms; }
```

Several selection and navigation buttons also lack the existing press response.

## Target

- Topic cards transition only `border-color` and `transform`; their shadow does
  not animate.
- Fine pointers keep the existing 2 px hover lift.
- Reduced motion sets `.spin-icon { animation: none; }`.
- Main navigation, search clear, filter reset, role cards, and level buttons use
  `transform: scale(0.97)` while active with
  `120ms cubic-bezier(0.23, 1, 0.32, 1)`.
- Reduced motion removes active translation/scale but retains color and border
  feedback.

## Repo conventions to follow

- Durations use `--duration-fast: 120ms`.
- Strong ease-out uses `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`.
- Hover movement is already gated by
  `@media (hover: hover) and (pointer: fine)`.

## Steps

1. Remove `box-shadow` from `.topic-card` transitions.
2. Keep selected and hover shadows static; do not animate between them.
3. Extend the existing active-state selector to main navigation, search-clear,
   filter-reset, role-option, and level-picker buttons.
4. Replace the literal `140ms` with `var(--duration-fast)`.
5. Set spinner animation to `none` in the reduced-motion media query and add
   the new active selectors to its transform reset list.

## Boundaries

- Do not remove visible focus indicators.
- Do not add keyframes or JavaScript animation.
- Do not change button dimensions or hit targets.
- Do not animate painted properties.
- If cited structures have drifted since commit `324d32f`, stop and report.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` pass.
- **Feel check**:
  - On a fine pointer, card lift is subtle and no shadow interpolates.
  - Buttons compress to 0.97 while held and release immediately enough to feel
    responsive.
  - Touch emulation does not leave a sticky hover state.
  - With reduced motion enabled, loading state remains understandable but the
    icon does not rotate.
- **Done when**: repeated hover/press feedback uses transform, opacity, color,
  or border only and reduced-motion users see no continuous rotation.
