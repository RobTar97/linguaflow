# LinguaFlow topic packs

Topic packs are versioned, portable curriculum archives. A pack can be validated and previewed without an account, installed in a browser for offline practice, reviewed in source control, and shared independently from the application release cycle.

## Archive layout

An `.lfpack` file is a ZIP archive with this shape:

```text
manifest.json
LICENSE.md
topics/
  community-gardens.json
assets/
  community-gardens.webp
```

`manifest.json` declares schema version `1.0`, a kebab-case pack identifier, semantic version, locales, default locale, SPDX license, authors, source revision, compatibility, and optional factual review assertions. Topic files contain conversation content, CEFR level, language pair, facilitation, and optional topic-level authors or reviews.

The publishable manifest contract is [topic-pack-manifest-1.0.schema.json](../schemas/topic-pack-manifest-1.0.schema.json).

Authorship is not the same as review. If a pack has no review assertions, LinguaFlow labels it as unreviewed; it never invents a reviewer or qualification.

## Safety and validation

The validator rejects traversal paths, unknown schema versions, duplicate identifiers, malformed language pairs, incomplete localized prompts, duplicate questions, incomplete vocabulary, unsafe artwork, missing assets, and unreasonable lesson ranges. Archives are limited to 25 MiB compressed, 50 MiB expanded, 100 topics, and 1 MiB per image. Artwork supports PNG, JPEG, and WebP; SVG and HTML are excluded.

```bash
npm run pack:validate -- path/to/community-pack.lfpack
npm run pack:build -- path/to/community-pack path/to/community-pack.lfpack
```

Open `/app/?contribute=1` to validate and preview learner content, facilitation notes, print layout, authorship, license, source, and review status before installing.

## Installed identifiers

Core identifiers remain unchanged. Installed topics use `<pack-id>:<topic-id>`, preventing collisions while keeping exports and room references readable. Installed packs live in IndexedDB and remain available for self-paced offline practice.

Maintainer-approved archives placed in `src/packs/bundled/` are discovered at
build time and pass through the same runtime validator before joining the
catalog. This keeps bundled curriculum data-only and prevents silent trust
exceptions.

## Review assertions

A review assertion records inspectable facts: review kind (`language`, `cefr`, `facilitation`, or `accessibility`), optional locale, reviewer display name and URL, timestamp, and notes. Do not include private email addresses or unverifiable credential claims.
