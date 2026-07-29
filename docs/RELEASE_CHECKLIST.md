# Release checklist

## Code and content

- [ ] `npm ci` succeeds from a clean checkout.
- [ ] `npm run check` passes.
- [ ] `npx wrangler deploy --dry-run` succeeds.
- [ ] Topic validation covers every supported pair and CEFR level.
- [ ] `npm run audit:secrets` reports no credential patterns.
- [ ] `npm run audit:seo` reports 151 unique canonical pages and 144 localized
      topic resources.
- [ ] `npm run check:deploy` accepts the final `PUBLIC_SITE_URL`.
- [ ] `npm audit --audit-level=high` reports no known high-severity dependency
      vulnerabilities.
- [ ] Changelog, package version, and git tag match.

## Product QA

- [ ] Fresh onboarding works in EN, PL, and JA.
- [ ] Support and target languages cannot be identical.
- [ ] Topic search, filters, saves, and conversation mode work.
- [ ] All category artwork loads and question text is discoverable by search.
- [ ] A self-paced link preserves topic, support language, target language, and
      level while each browser advances independently.
- [ ] Teacher creates a live room on the deployed Worker.
- [ ] A separate browser joins and appears in the participant list.
- [ ] Teacher question changes synchronize to the student over WebSocket.
- [ ] Question and success cues play only at documented moments after user
      interaction; muting persists after reload and removes every cue.
- [ ] Every sounded action retains equivalent visible feedback.
- [ ] Temporary WebSocket loss falls back to periodic room refresh.
- [ ] Ending a room makes the code unavailable.
- [ ] Desktop, mobile, keyboard, reduced-motion, and muted-audio checks pass.
- [ ] Browser consoles and Cloudflare logs are clean.
- [ ] Homepage, locale hubs, topic pages, sitemap, robots, and `llms.txt` return
      the expected content and status on the canonical domain.
- [ ] Unknown routes return 404; `/api` and room links are noindexed.
- [ ] Canonical, EN/PL/JA/x-default hreflang, and JSON-LD pass representative
      source and rendered-page checks.

## Repository and operations

- [ ] README screenshots and deployment instructions are current.
- [ ] License, contribution, conduct, security, and privacy files are present.
- [ ] GitHub issue forms and pull-request template render correctly.
- [ ] Branch protection requires the CI check.
- [ ] Cloudflare GitHub secrets are configured.
- [ ] `CLOUDFLARE_DEPLOY_ENABLED=true` is set only after both secrets exist.
- [ ] Production domain, repository description, and social preview are set.
- [ ] Google Search Console property is verified and `/sitemap.xml` is submitted.
- [ ] Mobile PageSpeed and field LCP, INP, and CLS are recorded after launch.
- [ ] CodeQL, Dependabot, private vulnerability reporting, and secret scanning
      are enabled.
- [ ] A rollback path and responsible maintainer are identified.
