# Governance

LinguaFlow is an open-source educational project maintained in public. This
document explains how decisions are made and how contributors can take on more
responsibility.

## Principles

- Learner safety, privacy, accessibility, and curriculum quality come first.
- Product and architecture decisions should be explainable in issues, pull
  requests, or architecture decision records.
- Small, reversible changes may proceed through normal review. Changes to
  privacy boundaries, room authorization, curriculum policy, or supported
  language direction require maintainer review.
- Disagreement is resolved with evidence from users, tests, accessibility
  guidance, language reviewers, or operational constraints—not contributor
  seniority alone.

## Roles

**Contributors** submit issues, curriculum, translations, code, tests, design,
or documentation. **Reviewers** are recurring contributors trusted to assess a
specific area such as Polish copy, Japanese copy, accessibility, or Worker
security. **Maintainers** merge releases, manage repository settings, respond
to security reports, and make final calls when consensus cannot be reached.

The current maintainer is listed in the README and CODEOWNERS. Reviewer or
maintainer responsibility may be offered after a sustained record of
constructive, accurate contributions and respectful review. Access can be
removed for inactivity, security reasons, or Code of Conduct violations.

## Decision process

1. Open an issue for a substantial or irreversible change.
2. Describe the learner or maintainer problem, constraints, alternatives, and
   privacy/accessibility impact.
3. Seek input from affected language or technical reviewers.
4. Record architectural decisions in `docs/adr` when they establish a durable
   boundary.
5. A maintainer approves and merges after required checks and review pass.

Routine fixes and focused content additions can begin directly as pull
requests. Security vulnerabilities follow `SECURITY.md`, not this public
process.

## Conflicts and appeals

Start with the pull-request or issue thread and summarize the disputed facts and
trade-offs. If discussion becomes personal or unsafe, pause and use the contact
path in `CODE_OF_CONDUCT.md`. The maintainer documents the final decision and
may revisit it when new evidence appears.
