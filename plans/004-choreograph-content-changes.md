# 004 — Choreograph topic and question changes

- **Status**: DONE
- **Commit**: WORKTREE (repository has no commits yet)
- **Severity**: LOW
- **Category**: Cohesion, missed opportunities
- **Estimated scope**: 3 files, medium

## Problem

Filtered topic cards enter simultaneously, while detail and question changes use unrelated hand-typed timings. The experience is functional but does not clearly communicate the relationship between a user’s selection and the content that updates.

## Target

- Topic result changes use a 35ms stagger, capped below 350ms total.
- The selected card remains stable; only entering cards receive the stagger.
- Topic detail changes use 200ms strong ease-out.
- Question changes use 160ms opacity plus a maximum 6px vertical offset.
- Reduced motion uses opacity only with no stagger.

## Repo conventions to follow

- Framer Motion is the existing orchestration library.
- Keep interaction available during every stagger; stagger must never block input.
- The main question is the hero and leads any session choreography.

## Steps

1. Define shared motion variants in a dedicated motion module.
2. Give the topic grid a child stagger of `0.035`.
3. Cap staggered entrances by disabling stagger after the eighth visible card.
4. Reuse shared detail and question variants rather than hand-typing transition objects.
5. Disable stagger and translation when reduced motion is requested.

## Boundaries

- Do not animate initial page load for more than 350ms total.
- Do not animate keyboard focus navigation.
- Do not add blur over 2px.

## Verification

- **Mechanical**: `npm run lint && npm run build`.
- **Feel check**:
  - Change a filter; cards settle in reading order without delaying clicks.
  - Switch topics; selected-card feedback and detail update feel causally connected.
  - Advance questions; text changes are readable with no double exposure.
- **Done when**: routine content swaps use one shared choreography vocabulary and reduced motion remains immediate.
