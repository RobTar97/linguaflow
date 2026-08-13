# ADR 0006: AI authoring is optional and draft-first

- **Status:** Proposed
- **Date:** 2026-08-12

## Context

Contributors may benefit from generating a first draft of conversation
questions, translations, vocabulary, and facilitation notes. LinguaFlow's
current strengths are an inspectable authored curriculum, no required account
or API key, a restrictive Content Security Policy, and factual review
provenance. A naive browser BYOK implementation could persist credentials,
broaden outbound network access, confuse generation with review, or expose
learner data to third parties.

## Decision

AI-assisted authoring, if implemented, will be an optional contributor feature
that produces untrusted draft data. The generated response must pass through
the topic-pack validator and contributor preview. It cannot publish, install,
bundle, or create review assertions automatically.

The first supported connection should be a direct user-controlled endpoint
selected from a deployment allowlist, with credentials held only in memory.
Provider networking remains behind a provider-neutral adapter. A same-origin
self-hosted relay may be added separately after SSRF, logging, cost, and abuse
controls are reviewed. The hosted default has no AI provider enabled and the
core application remains fully useful without a key.

Generated drafts carry minimal generation disclosure—provider configuration
identifier, model identifier, prompt version, and timestamp—without prompts,
credentials, hidden reasoning, or provider request IDs.

## Consequences

- Contributors gain optional drafting assistance without weakening curriculum
  trust or making AI a product dependency.
- Direct endpoints require explicit CSP configuration and provider CORS support.
- Keys disappear on refresh and must be entered again by design.
- Human language and CEFR review remain necessary before maintainer approval.
- Supporting a hosted relay is a separate security and operating commitment.

See [AI-assisted authoring and BYOK](../AI_AUTHORING.md) for the proposed flow,
trust boundaries, and implementation gates.
