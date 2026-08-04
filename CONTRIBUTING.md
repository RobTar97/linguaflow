# Contributing to LinguaFlow

Thank you for helping make meaningful speaking practice easier to access.
Contributions can be code, topic cards, translations, accessibility fixes,
teaching feedback, tests, or documentation.

## Before you start

1. Search existing issues and pull requests.
2. For a substantial product or architecture change, open a proposal first.
3. Keep one pull request focused on one coherent outcome.
4. Never include learner names, classroom recordings, API keys, or private data.
5. Read [GOVERNANCE.md](GOVERNANCE.md) for decision and maintainer expectations.

## Local development

```bash
npm install
npm run dev
```

Before submitting:

```bash
npm run check
```

For room-backend work, also run `npm run preview:cloudflare` and test with two
separate browser sessions. See `docs/DEPLOYMENT.md` for the full production
smoke test. `npm run dev` intentionally uses a local room adapter.

## Contribution paths

### Code

- Keep product types in `src/domain`.
- Put authored curriculum content in `src/content`.
- Query topics through `topicCatalog`; do not duplicate filtering in features.
- Keep browser APIs behind `src/platform` or the workspace boundary.
- Keep room API behavior behind `roomService`; do not call Worker routes from UI components.
- Preserve teacher authorization and eight-hour room expiry in backend changes.
- Reuse motion presets and respect `prefers-reduced-motion`.
- Keep self-paced links independent and live-room state teacher-controlled.
- Keep questions in the target language and optional help in the support language.
- Include tests for catalog, state, or behavior changes where practical.

### Topic cards and translations

Follow [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md). Every topic requires
English, Polish, and Japanese titles, descriptions, prompts, follow-ups, and
vocabulary in the current release. Run `npm run check:content`.

Machine translation may be used as a draft, but a proficient speaker should
review naturalness, level, ambiguity, and cultural context before merge.

### Documentation

Write for a first-time contributor. Prefer concrete examples, stable relative
links, and explicit release limitations. Update the relevant guide whenever a
public flow, data shape, command, or architectural boundary changes.

### Sound effects

Follow [docs/SOUND_DESIGN.md](docs/SOUND_DESIGN.md). Cues must stay optional,
short, quiet, and understandable without audio. Contributors must have the
rights to distribute every submitted recording or generated asset.

### Visual assets and screenshots

Follow [docs/ASSETS.md](docs/ASSETS.md). Generated illustrations need a source,
date, final prompt, reference-role note, and rights confirmation. Product
screenshots must come from the real application with fictional identities and
the documented viewport sizes. Never replace an existing public image silently;
use a versioned filename and update every consumer, metadata reference, and alt
text in the same pull request.

## Pull request checklist

- The change has a clear user or maintainer outcome.
- `npm run check` passes.
- New UI works with keyboard navigation and reduced motion.
- New sound works with the persistent mute control and is never the only feedback.
- New copy is localized or explicitly documented as pending.
- New topics pass catalog validation.
- Screenshots are included for material visual changes.
- New visual assets include provenance, dimensions, optimization, and alt/ARIA
  evidence.
- Documentation and changelog are updated where appropriate.

By contributing, you agree that your contribution is licensed under the MIT
License.
