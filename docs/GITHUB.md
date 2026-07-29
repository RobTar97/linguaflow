# GitHub repository operations

This repository is designed to be understandable from its landing page and safe
to accept contributions.

## Public metadata

Use the following repository description:

> Open-source EN/PL/JA conversation practice with 48 CEFR-aligned topics and
> live teacher-led rooms on Cloudflare.

Recommended topics:

```text
language-learning
education
conversation-practice
english
polish
japanese
react
typescript
cloudflare-workers
durable-objects
open-source
```

Use `artifacts/linguaflow-github-banner.jpg` as the repository social preview.
The image is 1280 × 640 and contains no embedded text, so GitHub’s title and
description remain legible in different contexts.

## Recommended repository settings

- visibility: **Public**;
- default branch: `main`;
- issues: enabled;
- discussions: enabled for teaching ideas and community help;
- wiki: disabled because maintained documentation lives in the repository;
- default workflow permissions: read-only;
- pull requests required before merging to `main`;
- CI check required on protected changes;
- stale review dismissal enabled;
- force pushes and branch deletion disabled;
- Dependabot alerts and security updates enabled;
- CodeQL default setup enabled;
- private vulnerability reporting enabled.

GitHub secret scanning runs automatically for public repositories. Never bypass
push protection to publish a real credential.

## Maintainer release sequence

1. Run `npm ci && npm run check`.
2. Run `npx wrangler deploy --dry-run`.
3. Update `CHANGELOG.md` and package version.
4. Merge through the protected `main` branch.
5. Create and push an annotated `vX.Y.Z` tag.
6. Verify CI, CodeQL, and dependency alerts.
7. Deploy through the protected `production` environment.
8. Run the production smoke test.
9. Publish GitHub release notes from the matching tag.

## Secrets

Only these deployment values belong in **Settings → Secrets and variables →
Actions → Secrets**:

- `CLOUDFLARE_API_TOKEN`;
- `CLOUDFLARE_ACCOUNT_ID`.

They must not be placed in repository variables, workflow YAML literals,
`.env`, `.dev.vars`, screenshots, issues, logs, or `VITE_*` values.

After storing both secrets, create the non-sensitive Actions variable
`CLOUDFLARE_DEPLOY_ENABLED=true`. This explicit switch prevents new forks and
unconfigured repositories from attempting a production deployment.
