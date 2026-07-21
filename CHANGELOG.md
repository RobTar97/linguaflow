# Changelog

All notable project changes are documented here.

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
