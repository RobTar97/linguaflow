# ADR 0004: Separate self-paced links from synchronized live rooms

- Status: accepted
- Date: 2026-07-29

## Context

Teachers need to assign the same authored questions in two different ways:
learners may work independently, or a group may follow one teacher-controlled
question. Treating both as a room makes asynchronous work unnecessarily
stateful; treating both as local links prevents immediate classroom
synchronization.

## Decision

LinguaFlow exposes two explicit sharing paths.

1. A self-paced URL contains a validated topic ID, support language, target
   language, and CEFR level. It creates no server state. Each browser owns its
   question index.
2. A live invite URL contains a validated room code. One Durable Object
   coordinates each room. Hibernating WebSockets broadcast room snapshots
   immediately; periodic HTTP reads provide reconnect resilience. Only the
   browser-held teacher token can move the shared question or end the room.

URLs contain no learner identity, teacher token, answer, transcript, or secret.
The target language determines prompts and vocabulary; the support language
determines optional translation.

## Consequences

- The learner can tell who controls the pace before starting.
- Self-paced assignments remain inexpensive and privacy-preserving.
- Live rooms support immediate cross-device updates while allowing their
  Durable Object to hibernate when idle.
- Tests must cover URL validation, independent practice progression, live
  synchronization, reconnect behavior, and room authorization separately.
