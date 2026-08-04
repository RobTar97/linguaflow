# Cloudflare deployment

LinguaFlow deploys to Cloudflare Workers as one unit:

- Vite static assets are served from Cloudflare’s asset layer;
- `/api/rooms/*` is handled by the Worker;
- each room code maps to a SQLite-backed Durable Object;
- rate-limit state is sharded across a second Durable Object class;
- public pages are static HTML, `/app/` hosts the interactive workspace, and
  unknown paths return a real `404.html`.

This architecture does not require a database ID, application environment
variable, client-side API key, or third-party service. The first deployment
provisions the Durable Object namespaces declared in `wrangler.jsonc`.

## One-time setup

1. Create or sign in to a Cloudflare account.
2. Install dependencies with `npm install`.
3. Authenticate Wrangler with `npx wrangler login`.
4. Choose the final canonical HTTPS origin and set `PUBLIC_SITE_URL` in the
   current shell. It is public configuration, not a secret.
5. Verify with `npm run check:deploy`, `npm run check`, and
   `npx wrangler deploy --dry-run`.
6. Deploy with `npm run deploy`.

Local and CI builds default to `https://linguaflow.example` so SEO artifacts
can be validated before a domain exists. The deploy preflight rejects that
placeholder and refuses to publish without a real HTTPS origin.

Wrangler prints the `workers.dev` URL. Open `/app/` from that origin in two
separate browsers or devices and complete the smoke test below.

## GitHub Actions deployment

The workflow at `.github/workflows/deploy.yml` deploys pushes to `main` and can
also be started manually. Add these encrypted repository secrets under
**Settings → Secrets and variables → Actions**:

- `CLOUDFLARE_API_TOKEN`: a narrowly scoped token created from Cloudflare’s
  Workers editing template and restricted to the deployment account;
- `CLOUDFLARE_ACCOUNT_ID`: the target Cloudflare account ID.

Add the non-sensitive repository variable `PUBLIC_SITE_URL` with the final
canonical origin, such as `https://your-final-domain.tld`. It must not include
a path or query parameters.

After both secrets and `PUBLIC_SITE_URL` exist, add the Actions repository variable
`CLOUDFLARE_DEPLOY_ENABLED` with the value `true`. Until that opt-in exists,
the deployment job is skipped cleanly on new repositories and forks. The
workflow runs the complete release check before deployment. Pull requests run
CI but do not deploy production.

Store both values as **encrypted Actions secrets**, not Actions variables.
Never place either value in `wrangler.jsonc`, a committed `.env` file, a
`VITE_*` variable, an issue, or a workflow literal. Vite-prefixed values are
compiled into public browser JavaScript.

Cloudflare Workers Builds can be used instead. Connect the GitHub repository
in Cloudflare and use `npm run deploy` as the deploy command. Do not enable both
automated paths for the same branch.

## Custom domain

After the first deployment, open **Workers & Pages → linguaflow → Settings →
Domains & Routes** and add a domain managed by the same Cloudflare account.
The application uses relative same-origin APIs, so no source change is needed.
The custom domain must match `PUBLIC_SITE_URL`. If the canonical domain changes,
update the variable, rebuild, redeploy, and submit the new sitemap; avoid
publishing two self-canonical copies on workers.dev and the custom domain.

## Local production preview

```bash
npm run preview:cloudflare
```

This runs Wrangler’s local runtime. Unlike `npm run dev`, it exercises the
Worker API and local Durable Object storage.

`npm run preview:static` is available for static-asset debugging only; live
room actions require the Worker and will not function in that mode.

## Production smoke test

1. Open the deployment in Browser A and finish setup as a teacher.
2. Create a room and copy the code.
3. Open the deployment in Browser B or a private window.
4. Finish setup as a student and join with the code.
5. Confirm the student appears in Browser A within a few seconds.
6. Advance the teacher question and confirm Browser B follows it.
7. End the room and confirm it is no longer joinable.
8. Check both browser consoles and Cloudflare Worker logs.
9. In the Network panel, confirm application requests stay on the deployment
   origin and no credential appears in a URL, payload, or compiled asset.
10. Send an intentionally oversized or cross-origin mutation in a test
    environment and confirm it is rejected.
11. Confirm `/sitemap.xml`, `/robots.txt`, and `/llms.txt` use the final origin.
12. Confirm an unknown path returns 404, `/api` returns noindexed JSON, and a
    room link returns `X-Robots-Tag: noindex, noarchive`.
13. Validate representative EN, PL, and JA pages using the Rich Results Test,
    then follow the launch sequence in `docs/SEO.md`.

Run the automated origin-level checks immediately after the Worker is reachable:

```bash
npm run smoke:deployment -- https://your-final-domain.tld
```

This verifies public and app routing, representative localized pages,
canonicals, sitemap/robots identity, real 404 behavior, API and room-link
noindex headers, security headers, manifest, and install icons. The GitHub
deployment workflow runs the same command after Wrangler reports a successful
deployment. It complements rather than replaces the two-browser room test.

For guided training, verify lobby → start → pause → resume → reflection →
completion → restart. Confirm that a student joining after a phase change sees
the current phase and that WebSocket fallback does not reset progress.

## Rollback

Cloudflare keeps Worker versions. Use deployment history in the dashboard or
Wrangler version commands to restore a known-good version. A rollback does not
recreate rooms that were ended or already expired.
