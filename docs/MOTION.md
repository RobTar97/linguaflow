# Motion system

LinguaFlow motion should clarify cause and continuity without competing with
reading or speaking.

## Principles

- Feedback begins immediately.
- Routine transitions stay between 120 and 240 ms.
- Transform and opacity are the default animated properties.
- Topic results settle in reading order with a subtle 35 ms stagger.
- Question changes use a small vertical offset and no bounce.
- Drawers and dialogs may use a spring; ordinary content does not.
- Reduced motion removes spatial movement while preserving brief fades and
  color feedback.

Shared Framer Motion presets live in `src/motion/presets.ts`. CSS timing and
easing tokens live at the top of `src/styles/app.css`.

## Interaction states

- Hover elevation is enabled only on devices with fine hover input.
- Press states move controls by no more than one pixel or scale very slightly.
- Progress is animated with `scaleX` and a fixed transform origin.
- Keyboard focus is never animated away or delayed by choreography.

## Review checklist

- Does the movement explain what changed?
- Is input still available during the animation?
- Are only transform and opacity animated for spatial changes?
- Does rapid repeated input retarget cleanly?
- Is the experience understandable with reduced motion enabled?
