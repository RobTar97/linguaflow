# Community product vision

**Status:** Strategic direction; not a delivery commitment.

## North star

LinguaFlow should become the easiest open, trustworthy, and adaptable way for
people to create and sustain meaningful language conversations—across
self-study, classrooms, language exchanges, and community-run deployments.

## Design pillars

### Conversation before configuration

People should reach a useful prompt quickly. Setup exists only to choose the
right language direction, level, role, and support—not to create administrative
work.

### Human-authored and openly reviewable

Questions, translations, level decisions, and facilitation guidance should be
inspectable, attributable, and improvable. Community trust comes from visible
review and provenance rather than opaque generation claims.

### Portable by default

Curriculum, preferences, and future learner-owned history should use documented
formats that can move between forks and deployments. The hosted instance must
not become the only place where the experience works.

### Calm, inclusive participation

The interface should reduce performance pressure, protect sensitive
information, support assistive technology, and remain useful across language
ability, device size, sound preference, motion preference, and connectivity.

### Small core, strong extension seams

The default project should remain understandable and self-hostable. New
capabilities should enter through versioned content formats, adapters, or
optional modules instead of turning the core into an institutional suite.

## Future scenarios

### A community language club

A volunteer downloads a reviewed topic pack for the club’s languages, previews
it locally, changes culturally specific examples, prints backup sheets, and
runs a guided room from a community-hosted instance. Participants join without
accounts and can export their own saved vocabulary afterward.

### A curriculum contributor

A Japanese reviewer opens one proposed topic in the contributor preview,
compares English, Polish, and Japanese copy side by side, sees a warning about
an ambiguous B1 follow-up, records a review note, and submits a focused pull
request with generated evidence.

### A self-hosting educator

A teacher deploys a fork, runs a diagnostics command, receives clear fixes for
one missing binding and an incorrect canonical origin, then enables only the
topic packs appropriate for their learners. No classroom data is sent to the
upstream project.

## Time horizons

### Near term: make contribution and reuse easier

- versioned topic-pack schema and validator;
- contributor preview and review metadata;
- teacher facilitation metadata;
- print/export support and self-hosting diagnostics;
- clearer good-first contribution queues for content, accessibility, and docs.

### Mid term: create portable learning continuity

- learner-owned import/export for saves, vocabulary, and private reflection;
- offline access to authored topic resources;
- trusted pack indexes and controlled update workflows;
- optional adapters for identity-backed continuity;
- broader locale support after the localization contract is modular.

### Long term: support a healthy ecosystem

- interoperable community curriculum catalogs;
- reusable deployment and moderation modules;
- evidence-based classroom and community templates;
- governance shared with recurring curriculum, accessibility, and security
  reviewers.

Long-term items depend on demonstrated need and must preserve a useful,
account-free core.

## Success criteria

### Experience

- a new learner can explain interface, support, and target language choices;
- a student joins a room without teacher troubleshooting;
- a teacher reaches the first useful prompt without leaving the flow;
- a contributor can preview and validate a topic without learning every code
  boundary;
- a self-hoster can diagnose common configuration failures without sharing
  secrets.

### Community

- recurring contributors review curriculum, accessibility, documentation, and
  security—not only application code;
- accepted topics carry clear authorship, license, and review state;
- issue templates produce reproducible problems and decision-ready proposals;
- maintainers can identify small, safe contribution paths for newcomers;
- forks can exchange curriculum without copying application internals.

### Technical and trust

- shared formats are versioned and migration-tested;
- the default release passes accessibility, localization, security, SEO, and
  performance gates;
- optional integrations disclose data, retention, deletion, and fallback
  behavior;
- no required paid service or centralized account is introduced into the core;
- production claims are supported by measurable evidence rather than roadmap
  language.

## Decision filters

Use these questions in issues and reviews:

1. Does the proposal help people speak, teach, contribute, or self-host more
   effectively?
2. Can the smallest version work without collecting new personal data?
3. Is the result portable and understandable outside the upstream deployment?
4. Does it strengthen an existing boundary or require a documented new one?
5. Can contributors test it with fictional data and accessible workflows?
6. What ongoing review, moderation, migration, or operational cost does it
   create?
7. Is a documentation, content, or process improvement more valuable than new
   product code?

If a proposal fails several filters, keep it in exploration until the problem
or design changes.

## Enduring non-goals

- replacing teachers with automated conversation or grading;
- ranking learners publicly or using high-pressure engagement mechanics;
- collecting recordings or transcripts by default;
- making the upstream hosted service necessary for self-hosted curriculum;
- accepting unreviewed remote code as a “plugin”;
- claiming language quality, safety, or learning outcomes without evidence.
