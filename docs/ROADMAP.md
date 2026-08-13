# Roadmap

This roadmap describes ordered product and community direction, not delivery
dates. See the [community vision](VISION.md) for the north star and the
[open-platform guide](OPEN_PLATFORM.md) for extension contracts and detailed
function proposals.

## Status key

- **Implemented** — present on the default branch.
- **Planned** — accepted direction; scope still belongs in an issue or ADR.
- **Exploring** — needs stronger evidence, safety review, or architecture work.

## Implemented foundation

- role-based setup with separate interface, support, and target languages;
- multilingual, level-aware topic library with search and saved topics;
- independent guided practice and portable practice links;
- Teacher Studio with shared-question and eight-step guided rooms;
- cross-device Cloudflare synchronization, reconnect fallback, and expiry;
- localized public curriculum pages and automated SEO generation;
- self-hostable Worker architecture with security and release checks;
- content, teacher, learner, deployment, privacy, asset, and contribution docs;
- optional accessible motion and sound cues.
- versioned `.lfpack` archives, CLI/browser validation, public preview, and
  local IndexedDB installation;
- transparent authorship, license, source, and factual review assertions;
- baseline facilitation guides and printable lesson sheets for all 48 topics;
- learner-owned saves, notes, vocabulary, profile, and pack-reference export;
- scoped offline application shell and installed-pack access, with live rooms
  explicitly online-only.

## Now: community contribution foundation

### Versioned topic packs — Implemented

- define a JSON schema and manifest with license, attribution, locale coverage,
  review state, artwork, and compatibility version;
- validate packs without starting the application;
- import and export without changing stable topic IDs;
- document migrations and reject unsupported schema versions clearly.

### Contributor preview — Implemented foundation

- render one topic or pack across application and public-page contexts;
- compare locales and support/target directions side by side;
- report content, accessibility, responsive-layout, attribution, and metadata
  failures;
- produce review evidence suitable for a pull request.

### Review and provenance — Implemented foundation

- record authorship and source license;
- distinguish draft, language-reviewed, CEFR-reviewed, and published states;
- expose last meaningful review without fabricating reviewer qualifications;
- create focused review queues for English, Polish, Japanese, and accessibility.

## Next: teaching reach and portability

### Optional AI-assisted authoring — Proposed

- generate only editable contributor drafts through a provider-neutral adapter;
- keep bring-your-own credentials in memory for the active authoring session;
- send no learner profile, notes, vocabulary, room, or participant data;
- require ordinary validation, preview, provenance disclosure, and human review;
- ship no default provider dependency or mandatory paid service.

The implementation boundary is specified in [AI_AUTHORING.md](AI_AUTHORING.md)
and [ADR 0006](adr/0006-ai-authoring-is-optional-and-draft-first.md).

### Facilitation metadata — Implemented foundation

- optional objectives, timing, grouping patterns, adaptation prompts, and
  sensitive-topic notes;
- printable and low-connectivity lesson views;
- reusable lesson templates that reference topics instead of duplicating them.

### Learner-owned continuity — Implemented foundation

- versioned export/import for preferences, saves, vocabulary, and private
  reflection notes;
- clear deletion and conflict behavior;
- no required upstream account or hidden synchronization.

### Self-hosting experience — Planned

- deployment diagnostics and actionable configuration errors;
- documented non-Cloudflare hosting requirements;
- tested backup, update, migration, and rollback guidance;
- instance identity and curriculum-version visibility.

## Later: ecosystem capabilities

### Federated curriculum catalogs — Exploring

- explicit trust lists and install confirmation;
- visible origin, license, review, compatibility, and update information;
- no remote code execution and no silent content replacement.

### Optional identity adapters — Exploring

- account-backed saves or teacher ownership without removing anonymous use;
- consent, recovery, export, deletion, moderation, and child-safety design;
- a separate security model and ADR before implementation.

### Broader localization — Exploring

- modular locale registration and fallback behavior;
- layout and font strategy for additional writing systems;
- contributor/reviewer capacity before advertising support.

## Evidence required before expansion

Automated speech scoring, AI conversation partners, institutional dashboards,
attendance, marketplace features, and permanent classroom records are not
assumed roadmap items. Each would require evidence of user need, a privacy and
safety review, accessibility behavior, operational ownership, and an explicit
decision about whether it belongs in core or an optional adapter.

## Good contribution opportunities

- review or improve one topic in a language you know well;
- add tests around catalog validation or room lifecycle behavior;
- improve keyboard, screen-reader, reduced-motion, or mobile behavior;
- strengthen self-hosting diagnostics and troubleshooting documentation;
- design a small topic-pack fixture and useful validator error messages;
- identify duplicated or stale documentation and submit a focused correction.

Before implementing a substantial roadmap item, open a feature proposal using
the checklist in [OPEN_PLATFORM.md](OPEN_PLATFORM.md#proposing-a-platform-function).
