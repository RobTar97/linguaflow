# Changelog

All notable project changes are documented here.

## Unreleased

### Added

- Versioned `.lfpack` curriculum archives with bounded ZIP parsing, manifest
  and semantic validation, CLI build/validate commands, and IndexedDB install.
- A public account-free contributor preview for learner, teacher, provenance,
  review, and print views.
- Baseline facilitation guides for all 48 core topics, learner-owned JSON
  import/export, private notes, vocabulary bookmarks, and printable lessons.
- A scoped offline application shell, installed-pack access, connectivity and
  update notices, and bounded imported-topic snapshots for online live rooms.

### Changed

- Hardened topic-pack archive, metadata, learner-data import, installed-version,
  and imported-room-snapshot validation; added local pack removal and clearer
  contributor-preview accessibility and failure states.
- The total lazy JavaScript budget is 202 KiB gzip to include portable archive,
  hardened data import, and offline modules; the stricter 90 KiB initial budget
  is unchanged and the current entry is below 70 KiB.

### Documentation

- Added a task-oriented documentation index, an open-platform capability and
  extension guide, and a north-star community product vision.
- Reframed the roadmap around versioned topic packs, contributor preview,
  transparent review metadata, teaching portability, learner-owned data, and
  self-hosting diagnostics.
- Aligned product, architecture, governance, support, and contribution guides
  around explicit proposal states and compatibility rules.
- Added a provider-neutral, draft-first BYOK AI authoring proposal and ADR with
  explicit credential, privacy, validation, provenance, and human-review gates.

## 0.5.0 — 2026-08-04

### Added

- An optional eight-step guided teacher–student training lifecycle with lobby,
  warm-up, practice, pause/resume, reflection, completion, and restart.
- Synchronized phase progress and support states for students, while retaining
  the lightweight shared-question room format and compatibility with old rooms.
- A generated teacher-training illustration, install icons, 36 public topic
  illustration crops, image schema, and a documented visual-asset contract.
- Automated post-deployment origin smoke testing for public pages, the app,
  search files, status codes, security headers, and install assets.

### Changed

- Topic resources now expose their approved artwork as visible images,
  topic-specific social metadata, and `ImageObject` structured data.
- Live question sounds follow authored prompt changes rather than pause/resume
  cursor changes, and guided completion uses the existing success cue.
- Cloudflare development tooling and audited transitive dependencies were
  refreshed; the high-severity dependency audit now reports zero findings.

## 0.4.0 — 2026-07-30

### Added

- 144 statically generated topic resources across English, Polish, and
  Japanese, plus localized hubs and public teacher, about, and privacy pages.
- Unique titles, descriptions, canonicals, hreflang clusters, Open Graph
  metadata, `WebPage`, `LearningResource`, `BreadcrumbList`, `WebSite`, and
  `WebApplication` structured data.
- Generated XML sitemap, crawl policy, `llms.txt`, related-topic links, and an
  automated 151-page SEO release gate.
- A deployment preflight that requires the final public HTTPS origin before
  Cloudflare publishing can start.

### Changed

- Unknown public routes now return a real 404 instead of the application shell.
- Live-room links receive `X-Robots-Tag: noindex, noarchive`, and `/api` now
  returns noindexed JSON instead of public HTML.
- Performance budgets now measure the homepage payload plus per-page and total
  generated HTML.

## 0.3.1 — 2026-07-29

### Added

- Three original, lightweight interface cues for question changes, successful
  classroom actions, and sound enablement.
- A persistent, localized sound-effects control in learner, teacher, and
  student headers.
- Audio asset performance budgets and a public sound-design contribution guide.

### Changed

- Sound playback is limited to meaningful, user-initiated moments and visible
  live-room question changes; routine navigation remains quiet.

## 0.3.0 — 2026-07-29

### Added

- Four visual categories—food, arts, science, and society—and twelve
  fully-localized topics, bringing the library to 48 topics and 288 questions.
- Illustrated category discovery and question-level search previews.
- Shareable self-paced practice links that preserve topic, language direction,
  and level without creating learner accounts or shared progress.
- Shareable live-room invite links and hibernating Durable Object WebSocket
  synchronization with periodic-refresh resilience.
- Enforced JavaScript, CSS, document-asset, and image performance budgets.
- Public project governance and an architecture decision for practice links and
  synchronized live rooms.

### Changed

- Prompts and vocabulary now consistently use the target language while
  navigation uses the interface language and optional help uses the support
  language.
- Topic, question, and setup transitions no longer serialize outgoing and
  incoming content; collection layout animation and paint-heavy hover motion
  were removed.

## 0.2.2 — 2026-07-24

### Security

- Removed modulo bias from cryptographically generated room codes by using
  rejection sampling for every random character and digit.

## 0.2.1 — 2026-07-24

### Changed

- Cloudflare deployment now remains safely disabled until the repository owner
  explicitly configures credentials and enables the deployment variable.
- Dependabot groups compatible minor and patch updates while leaving major
  upgrades for deliberate, separately tested maintenance work.
- Updated checkout and Node setup actions to their Node 24-backed releases,
  retaining immutable commit-SHA pinning.

## 0.2.0 — 2026-07-23

### Added

- Twelve new conversation topics for a total of 36, evenly distributed across
  EN ↔ PL, EN ↔ JA, and PL ↔ JA.
- Seventy-two new localized follow-up questions and 180 localized vocabulary
  entries.
- Search over main prompts, follow-up questions, words, and translations.
- Per-client Durable Object rate limiting with independent read, write, and
  room-creation buckets.
- Cross-platform secret-pattern scan in the release gate.
- Detailed security model and GitHub repository-operations guide.
- Purpose-built GitHub and social-preview banner.
- GitHub CODEOWNERS and categorized release-note configuration.

### Security

- Enforced same-origin API mutations, JSON content types, 32 KB body limits,
  strict room and participant schemas, bounded question indexes, and generic
  service errors.
- Replaced room-code `Math.random()` usage with `crypto.getRandomValues()`.
- Removed Google Fonts and all other browser-side third-party requests.
- Pinned every GitHub Action to a full immutable commit SHA.
- Upgraded Wrangler to 4.113.0 and overrode its vulnerable transitive Sharp
  release with audited Sharp 0.35.3.

### Changed

- Reworked the README around product value, role flows, measurable content
  coverage, architecture, privacy, deployment, and contribution paths.
- Expanded catalog validation to check descriptions, prompts, duplicate
  questions, artwork indexes, and complete vocabulary records.

## 0.1.0 — 2026-07-20

### Added

- Three-step role and language setup.
- Learner, teacher, and student workspace navigation.
- Teacher room builder and synchronized room sessions.
- Explicit interface, support, and target-language controls.
- Twelve additional multilingual topics for a total of 24.
- Topic catalog validation and Vitest coverage.
- Shared motion presets and reduced-motion behavior.
- Open-source contributor, security, architecture, curriculum, and role guides.
- Cloudflare Worker deployment with synchronized cross-device rooms.
- SQLite-backed Durable Object room coordination and automatic eight-hour expiry.
- Production metadata, favicon, manifest, security headers, and deploy workflow.
- Localized onboarding explanations for roles, language direction, and privacy.

### Changed

- Split the original application into domain, content, catalog, feature,
  workspace, platform, motion, and shared UI modules.
- Improved press, hover, progress, filter, detail, and question transitions.
- Replaced same-browser room simulation in production with a live room service.
