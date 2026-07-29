# Changelog

All notable project changes are documented here.

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
