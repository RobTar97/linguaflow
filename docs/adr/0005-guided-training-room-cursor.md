# ADR 0005: Guided training on the room cursor

## Status

Accepted — 2026-08-04

## Context

The original room contract synchronized one `questionIndex`. Teachers also need
an optional structured session with a lobby, pause/resume, reflection,
completion, and restart. Adding a separate mutable field for every phase would
expand authorization, storage, WebSocket, local-development, and migration
paths for state that changes as one ordered unit.

## Decision

Rooms declare `shared-question` or `guided-training`. Guided rooms carry a
versioned plan with eight steps. A bounded integer cursor encodes the step and
pause bit:

```text
cursor = stepIndex × 2 + pausedBit
```

Step zero is the lobby, steps one through six map to the topic’s six authored
questions, step six is presented as reflection, and step seven is completion.
Only active authored steps may be paused. The existing teacher-authorized room
update persists and broadcasts the cursor. Missing session metadata means
`shared-question`, preserving rooms created by older clients.

## Consequences

- HTTP refresh, WebSocket snapshots, local development, reconnects, and teacher
  authorization use one existing synchronization path.
- The Worker must validate the optional mode and versioned plan as well as the
  cursor bound.
- A future plan with more steps needs a new plan version and a compatible
  cursor range; it must not silently reinterpret version 1 rooms.
- The cursor describes orchestration only. LinguaFlow still stores no answers,
  grades, recordings, or transcripts.
