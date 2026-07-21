# 003 — Gate hover motion and add press feedback

- **Status**: DONE
- **Commit**: WORKTREE (repository has no commits yet)
- **Severity**: MEDIUM
- **Category**: Purpose, physicality, accessibility
- **Estimated scope**: 1 stylesheet, small

## Problem

Cards and buttons translate on `:hover` without checking pointer capabilities. Touch devices can enter sticky hover states after tapping. Pressable controls have no physical press response.

```css
/* src/styles.css:445 — current */
.topic-card:hover {
  transform: translateY(-2px);
}

/* src/styles.css:908 — current */
.primary-button:hover {
  transform: translateY(-1px);
}
```

## Target

Only fine pointers receive hover lift. All primary pressable controls receive subtle, interruptible press feedback.

```css
@media (hover: hover) and (pointer: fine) {
  .topic-card:hover {
    transform: translateY(-2px);
  }
}

.primary-button:active,
.secondary-button:active,
.save-icon:active,
.topic-card-hitbox:active {
  transform: scale(0.97);
  transition: transform 140ms var(--ease-out);
}
```

## Repo conventions to follow

- Use the existing `--duration-fast` token, set to 140ms for press feedback.
- Maintain the restrained LinguaFlow motion personality.

## Steps

1. Wrap every hover transform in `@media (hover: hover) and (pointer: fine)`.
2. Keep color/background hover feedback available where appropriate.
3. Add `:active` scale feedback at `0.97` to buttons and card hit areas.
4. Ensure nested save controls do not transform the whole card.
5. Under reduced motion, keep color feedback and remove press scaling.

## Boundaries

- Do not add bounce or ripple effects.
- Do not change focus-visible styling.
- Do not scale text independently from its control.

## Verification

- **Mechanical**: `npm run lint && npm run build`.
- **Feel check**:
  - On desktop, hover remains subtle and immediate.
  - On touch emulation, taps never leave cards lifted.
  - Button presses compress to 0.97 and recover without delay.
- **Done when**: hover movement is fine-pointer-only and pressable controls have consistent 140ms feedback.
