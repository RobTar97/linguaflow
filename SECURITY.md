# Security policy

## Supported version

The latest tagged release and code on the default branch are supported.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability or privacy problem.
Use the repository host’s private vulnerability-reporting feature or contact a
maintainer privately.

Include:

- the affected flow or file;
- steps to reproduce;
- potential impact;
- any suggested mitigation;
- whether learner, teacher, or classroom data may be involved.

Please avoid accessing data that does not belong to you. The maintainers will
acknowledge a complete report as soon as practical and coordinate disclosure
after a fix is available.

## Current data boundary

Profiles, learning goals, saved topics, current-room references, and teacher
authorization tokens are stored in browser `localStorage`. Live room state is
stored in a Cloudflare Durable Object and expires after eight hours. Room codes
are access codes, not user authentication. Do not use participant or room names
for sensitive learner records. See `docs/PRIVACY.md` for the complete boundary.

Teacher question changes and room deletion require a random teacher token that
is never returned to joining students. Public deployments should retain the
included content-security, framing, permissions, and MIME-sniffing headers.
