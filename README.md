# LinguaFlow

An open-source conversation workspace for English, Polish, and Japanese
learners, teachers, and classrooms. LinguaFlow turns level-appropriate topics
into guided speaking sessions with translated prompts, useful vocabulary, and
live room synchronization on Cloudflare.

![LinguaFlow learner topic browser](artifacts/linguaflow-learner-workspace.png)

Teachers can move from a goal-aware recommendation list into a room without
leaving the workspace:

![LinguaFlow teacher studio](artifacts/linguaflow-teacher-studio.png)

## Why LinguaFlow?

Language practice often fails before the first sentence: learners do not know
what to discuss, teachers spend time preparing prompts, and mixed-language
groups need just enough translation support without turning the session into a
worksheet. LinguaFlow provides a reusable conversation scaffold for all three.

The first public release includes:

- learner, teacher, and room-join paths;
- explicit interface, support, and target-language setup;
- 24 authored topics from A1 through C1;
- English, Polish, and Japanese content and interface copy;
- EN ↔ PL, EN ↔ JA, and PL ↔ JA topic coverage;
- central prompts, five follow-ups, and bilingual vocabulary;
- saved topics and local workspace persistence;
- cross-device teacher rooms, participant presence, and synchronized questions;
- responsive layouts, keyboard focus states, and reduced-motion support;
- content validation tests and an original illustration system.

## Quick start

Requirements: Node.js 22 or newer and npm 10 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. On first launch, choose how you want to use
LinguaFlow and set:

1. your interface language;
2. your support language;
3. the language you want to practise;
4. your CEFR level.

![LinguaFlow onboarding](artifacts/linguaflow-onboarding-release.png)

Run the full project check before opening a pull request:

```bash
npm run check
```

`npm run dev` uses a browser-local room adapter for fast frontend work. Use
`npm run preview:cloudflare` to test the real Worker and Durable Object room
backend locally.

## Product flows

| Role | Entry | Core flow |
|---|---|---|
| Learner | Practice | Set a goal → browse or save topics → review prompts → start a guided conversation |
| Teacher | Teach | Choose a recommended topic → set the room language and level → share the code → advance questions |
| Student | Join room | Open LinguaFlow on any device → enter a name and room code → follow the synchronized question |

The role switcher stays available in the main navigation, so one installation
can be used for independent practice, lesson preparation, and classroom demos.

![LinguaFlow synchronized student room](artifacts/linguaflow-live-student-mobile.png)

## Language model

LinguaFlow treats three choices separately:

- **Interface language** controls navigation and instructions.
- **Support language** supplies translations and explanations.
- **Target language** is the language participants should speak.

Support and target languages cannot be the same. A topic is eligible when it
contains both languages, regardless of direction.

## Repository map

```text
src/
  catalog/       topic querying, recommendations, and validation
  content/       authored multilingual topic data
  domain/        shared product types
  features/      learner, setup, teacher, and room experiences
  i18n/          workspace interface copy
  motion/        reusable animation presets
  platform/      browser integrations such as storage
  styles/        design tokens and responsive application styles
  ui/            shared presentational components
  workspace/     role, route, profile, saved-topic, and room state
worker/           Cloudflare room API and Durable Object coordinator
docs/            product, architecture, content, motion, and role guides
plans/           completed motion-audit records
public/images/   project-owned topic artwork
```

Start with [the architecture guide](docs/ARCHITECTURE.md) before making a
cross-feature change. Topic contributors can go directly to
[the content guide](docs/CONTENT_GUIDE.md).

## Useful commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and create a production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run the Vitest suite once |
| `npm run check:content` | Validate the authored topic catalog |
| `npm run types:worker` | Type-check the Cloudflare Worker |
| `npm run preview:cloudflare` | Run the complete Cloudflare app locally |
| `npm run check` | Run every release check |
| `npm run deploy` | Verify and deploy to Cloudflare Workers |

## Release boundaries

Live rooms work across devices through a Cloudflare Durable Object and expire
after eight hours. A room code grants student access; a private teacher token
stored in the teacher’s browser protects question controls. This first release
does not include user accounts, attendance records, permanent room history, or
institutional administration. Do not use room or participant names for
sensitive student information.

See [the product guide](docs/PRODUCT.md) and [roadmap](docs/ROADMAP.md) for the
supported scope and next milestones.

## Deploy to Cloudflare

The application deploys as one Cloudflare Worker containing the Vite assets,
room API, and SQLite-backed Durable Object namespace. No database ID or third-
party backend is required.

```bash
npx wrangler login
npm run deploy
```

For GitHub deployment, follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). The
included workflow deploys `main` after CI when the Cloudflare repository
secrets are configured.

## Contributing

Contributions are welcome across code, accessibility, translations, topic
writing, teaching practice, and documentation. Read
[CONTRIBUTING.md](CONTRIBUTING.md), follow the
[Code of Conduct](CODE_OF_CONDUCT.md), and use the supplied issue templates.

Security concerns should follow [SECURITY.md](SECURITY.md), not a public issue.
General project help is described in [SUPPORT.md](SUPPORT.md), and the release
data boundary is documented in [docs/PRIVACY.md](docs/PRIVACY.md).

## License

MIT. See [LICENSE](LICENSE).
