# ADR 0001: Topic-first product model

- Status: accepted
- Date: 2026-07-16

## Context

Conversation products can begin with matching, chat, lessons, or authored
prompts. LinguaFlow needs to serve independent learners and teachers while
remaining useful before accounts, realtime infrastructure, or AI exist.

## Decision

Use the authored topic as the central domain object. Browsing, saving,
independent sessions, teacher rooms, translations, and artwork all reference
the same topic ID and schema.

## Consequences

- The beta has a complete core loop without external services.
- Curriculum contributions can be reviewed as code and prose.
- Teacher and learner experiences stay aligned.
- Topic quality becomes a first-class maintenance responsibility.
- Future dynamic content must preserve stable IDs and validation.
