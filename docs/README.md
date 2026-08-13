# Documentation

This directory explains how to use, understand, extend, review, and operate
LinguaFlow. Start with the path that matches what you want to accomplish.

## Choose your path

| You want to… | Start here | Continue with |
|---|---|---|
| Practise independently | [Learner guide](LEARNER_GUIDE.md) | [Product guide](PRODUCT.md) |
| Prepare or lead a class | [Teacher guide](TEACHER_GUIDE.md) | [Content guide](CONTENT_GUIDE.md) |
| Understand the whole platform | [Open-platform guide](OPEN_PLATFORM.md) | [Architecture](ARCHITECTURE.md) |
| Add topics or translations | [Content guide](CONTENT_GUIDE.md) | [Contributing](../CONTRIBUTING.md) |
| Build or validate a portable pack | [Topic-pack guide](TOPIC_PACKS.md) | [Contributor preview](/app/?contribute=1) |
| Explore optional AI drafting | [AI authoring and BYOK](AI_AUTHORING.md) | [Proposed ADR](adr/0006-ai-authoring-is-optional-and-draft-first.md) |
| Change code or product behavior | [Architecture](ARCHITECTURE.md) | [Product guide](PRODUCT.md) and [ADRs](adr/) |
| Propose a major new function | [Community vision](VISION.md) | [Roadmap](ROADMAP.md) and [Governance](../GOVERNANCE.md) |
| Self-host LinguaFlow | [Deployment guide](DEPLOYMENT.md) | [Security model](SECURITY_MODEL.md) |
| Prepare a release | [Release checklist](RELEASE_CHECKLIST.md) | [GitHub operations](GITHUB.md) |

## Product and community

- [Product guide](PRODUCT.md) — promise, users, journeys, content principles,
  success signals, and non-goals.
- [Open-platform guide](OPEN_PLATFORM.md) — current capabilities, domain
  objects, extension seams, compatibility rules, and proposed community
  functions.
- [Community vision](VISION.md) — north star, strategic pillars, future
  scenarios, decision filters, and measurable outcomes.
- [Roadmap](ROADMAP.md) — ordered work areas and contribution opportunities;
  direction rather than delivery dates.
- [Learner guide](LEARNER_GUIDE.md) and [teacher guide](TEACHER_GUIDE.md) —
  role-specific product instructions.

## Building and contributing

- [Architecture](ARCHITECTURE.md) — code boundaries, state, Worker design, and
  stable extension seams.
- [Content guide](CONTENT_GUIDE.md) — topic shape, CEFR calibration,
  translation review, artwork, and validation.
- [Topic packs](TOPIC_PACKS.md) — portable archive format, validation limits,
  provenance, review assertions, CLI commands, and browser preview.
- [AI authoring and BYOK](AI_AUTHORING.md) — proposed, provider-neutral draft
  generation with explicit credential, privacy, validation, and review bounds.
- [Motion](MOTION.md), [sound design](SOUND_DESIGN.md), and
  [visual assets](ASSETS.md) — experience foundations and contribution rules.
- [Architecture decision records](adr/) — durable decisions and their context.
- [Contributing](../CONTRIBUTING.md) — contribution paths, proposal
  expectations, checks, and pull-request evidence.

## Operating and releasing

- [Deployment](DEPLOYMENT.md) — local production preview, Cloudflare setup,
  automated deployment, smoke testing, and rollback.
- [Security model](SECURITY_MODEL.md) and [privacy boundary](PRIVACY.md) —
  protected assets, trust boundaries, controls, retention, and limitations.
- [SEO readiness](SEO.md) — generated public pages, metadata, launch sequence,
  and post-launch measurements.
- [Release checklist](RELEASE_CHECKLIST.md) and [GitHub operations](GITHUB.md)
  — maintainer release procedure and repository configuration.

## Status language

Roadmap and platform documents use three labels:

- **Implemented** — available on the default branch and covered by current
  documentation or checks.
- **Planned** — accepted direction with a known user need, but not a delivery
  promise.
- **Exploring** — a problem or opportunity that still needs evidence, design,
  safety review, or an architecture decision.

An idea is not part of the product contract merely because it appears in a
vision or roadmap document.

## Documentation contract

When a change affects a public flow, command, data shape, privacy boundary,
extension point, or deployment step, update the relevant guide in the same pull
request. Long guides should lead with the important outcome, use consistent
heading levels, and link to code rather than duplicating implementation details.
Review documentation freshness at least once per quarter and during every
tagged release.
