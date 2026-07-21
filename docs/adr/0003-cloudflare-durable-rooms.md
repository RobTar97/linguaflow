# ADR 0003: Cloudflare Durable Object rooms

- Status: accepted
- Date: 2026-07-20

## Context

The same-browser room prototype proved the teacher and student flow but could
not support a real classroom. The first public release needs cross-device
synchronization without requiring contributors to provision a third-party
database or commit service identifiers.

## Decision

Deploy the Vite application and a same-origin room API as one Cloudflare
Worker. Map each room code to a SQLite-backed Durable Object. Store room state,
participants, and the current question for at most eight hours. Poll the room
from visible clients at a short interval. Protect teacher mutations with a
random token stored only in the creating browser.

Use a browser-local adapter during `vite` development and Wrangler for complete
integration testing.

## Consequences

- Teachers and students can use separate devices.
- Joins and question changes are serialized by one room coordinator.
- Deployment needs only a Cloudflare account; no database ID is required.
- Room codes grant student access and are not full authentication.
- Polling is simpler than WebSockets but creates periodic reads.
- Rooms deliberately provide no permanent attendance or transcript history.
