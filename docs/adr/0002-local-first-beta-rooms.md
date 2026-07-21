# ADR 0002: Local-first beta rooms

- Status: superseded by ADR 0003
- Date: 2026-07-16

## Context

The teacher/student flow needs to be understandable and testable before the
project commits to authentication, hosting, realtime transport, moderation,
and privacy policies.

## Decision

Implement room creation, codes, participants, and active questions in browser
storage. Clearly label same-device behavior in UI and documentation.

## Consequences

- Contributors can test the complete interaction locally.
- Product flow can mature independently of backend selection.
- Rooms are not secure, unique across devices, or realtime.
- The beta must not be used for sensitive classroom data.
- A future room service can replace storage behind workspace commands.
