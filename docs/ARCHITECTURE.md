# Architecture

LinguaFlow is a client-side React application organized around product
boundaries rather than technical file types.

```mermaid
flowchart LR
  UI[Feature screens] --> WS[Learning workspace]
  UI --> CAT[Topic catalog]
  UI --> I18N[Interface copy]
  WS --> STORE[Browser storage adapter]
  WS --> API[Room service client]
  API --> WORKER[Cloudflare Worker API]
  WORKER --> DO[Durable Object per room code]
  CAT --> CONTENT[Authored topic content]
  WS --> DOMAIN[Domain types]
  CAT --> DOMAIN
  UI --> MOTION[Motion presets]
```

## Boundaries

### `domain`

Stable product language: topics, learning goals, profiles, roles, and rooms.
This layer must not import React or browser APIs.

### `content`

Human-authored multilingual curriculum data. Content is static TypeScript in
the first release so type errors are caught at build time and contributions remain easy
to review.

### `catalog`

The read API over content. It owns search, filtering, recommendations, and
validation. Feature code should not reimplement topic eligibility rules.

### `workspace`

The application state boundary. It owns profile setup, role routing, saved
topics, active-room state, and commands that change those values. The provider
is deliberately separate from context and contracts to preserve fast refresh
and keep imports directional.

### `platform`

Wrappers around environmental capabilities. Browser storage lives here so it
can later be replaced by server persistence without teaching every feature
about `localStorage`.

### `features`

User-facing flows:

- `setup`: role and learning-goal onboarding;
- `explore`: learner browsing, details, saves, and independent sessions;
- `teacher`: topic selection and room creation;
- `rooms`: join and active teacher/student room experiences.

Features may consume domain types, catalog APIs, workspace commands, shared UI,
copy, and motion. They should not import content arrays directly.

## State model

The workspace stores three durable browser values:

- profile and learning goal;
- saved topic IDs;
- active room.

Development mode uses browser-local rooms for fast UI work. Production calls
the same-origin Worker API. Each room code maps to one SQLite-backed Durable
Object, which serializes joins and teacher updates and automatically expires
after eight hours. Teacher mutations require a browser-held secret token. See
ADR 0003.

## Adding a backend

Keep feature contracts stable and replace implementations behind boundaries:

1. add authenticated profile and saved-topic repositories;
2. replace polling with a hibernatable WebSocket subscription;
3. add explicit participant leave and reconnect identity;
4. add institutional moderation and retention controls;
5. preserve the catalog as a pure read model unless content becomes remote.

## Architectural rules

- Imports point inward toward domain contracts.
- Features communicate through workspace commands, not shared mutable state.
- Content validation must remain runnable without a browser.
- Motion never carries business state.
- UI localization and target-language content are separate concepts.
- Release limitations are described in docs and UI rather than hidden.
