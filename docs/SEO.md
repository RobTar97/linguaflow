# Search and deployment readiness

LinguaFlow’s searchable surface is generated from the same validated topic
catalog as the application. Search pages never duplicate the curriculum in a
second hand-maintained data source.

This document records the 2026-08-04 pre-deployment audit. It does not claim
rankings, indexing, traffic, or Core Web Vitals field performance; those signals
do not exist until a final domain is deployed and measured.

## Audit result

The source-only baseline scored **41/100** for technical SEO, **44/100** for
content discoverability, and **28/100** for schema, sitemap, and international
SEO readiness. The central issue was consistent across every review: the
curriculum existed only behind a client-rendered onboarding flow with no stable
topic URLs.

The automated source gates score the implemented page architecture **88/100**.
A stricter release audit that also counts production proof, content depth,
E-E-A-T, dependency security, and launch readiness scores the current
pre-deployment project **77/100**:

| Category | Weight | Readiness | Evidence |
|---|---:|---:|---|
| Technical SEO | 22 | 18 | Static HTML, canonicals, crawl policy, real 404, noindexed rooms and API |
| Content quality | 23 | 17 | Useful unique prompt resources; comprehensive lessons and substantiated reviewer attribution remain future work |
| On-page SEO | 20 | 18 | Unique titles, descriptions, H1s, metadata, and related-topic links |
| Structured data | 10 | 8 | Parseable local JSON-LD graphs; live rich-result validation still required |
| Performance | 10 | 6 | Enforced payload budgets; no production CrUX data yet |
| AI-search readiness | 10 | 6 | Initial HTML content, stable citations, `llms.txt`, source and privacy links |
| Images | 5 | 4 | Topic-specific images, dimensions, localized alt text, and `ImageObject` schema |

The gap to a production-ready score requires a real canonical origin, a clean
release build, passing dependency checks, Google Search Console, field
performance data, external reputation signals, and qualified language-review
attribution. Search visibility is never guaranteed by technical SEO alone.

## Generated public architecture

The production build emits **151 canonical pages**:

- `/` — crawlable public product explanation and topic directory;
- `/app/` — noindexed interactive learner and teacher workspace;
- `/en/`, `/pl/`, `/ja/` — localized conversation-topic hubs;
- 144 pages at `/{locale}/topics/{stable-topic-id}/`;
- `/teachers/`, `/about/`, and `/privacy/`;
- a real noindexed `404.html`.

Every topic page contains the localized title, description, category, CEFR
label, supported language pair, central prompt, follow-up questions, vocabulary,
usage guidance, related topics, and a practice link. Stable topic IDs avoid URL
changes when translations improve.

The build also emits:

- `/sitemap.xml` with 151 canonical URLs and reciprocal EN/PL/JA/x-default
  hreflang annotations;
- `/robots.txt` with the canonical sitemap and API exclusion;
- `/llms.txt` with product facts, public sections, source, license, and privacy;
- absolute canonical, Open Graph, and Twitter metadata, including 36 optimized
  topic illustrations shared across localized variants;
- `WebSite` and `WebApplication` schema on the homepage;
- `WebPage`, `LearningResource`, and visible `BreadcrumbList` schema on topics.

No rating, review, accreditation, learner-count, efficacy, AI-powered, or
organizational claims are fabricated. `FAQPage`, `HowTo`, `Course`, and
`SearchAction` schema are intentionally omitted because the current product does
not support those claims or eligibility rules.

## Keyword-to-page map

Keywords describe the actual content and are not repeated unnaturally.

| Search intent | Primary page |
|---|---|
| open-source language conversation platform | `/` |
| English conversation questions | `/en/` |
| Polish conversation questions / pytania do rozmowy po polsku | `/pl/` |
| Japanese conversation questions / 日本語 会話 質問 | `/ja/` |
| speaking activities for language teachers | `/teachers/` |
| remote work conversation questions | `/en/topics/remote-work/` and alternates |
| topic-specific questions by CEFR level | corresponding localized topic page |
| LinguaFlow privacy, data, or account requirements | `/privacy/` |
| LinguaFlow open source, license, or maintainer | `/about/` |

The 48 topic pages target their natural long-tail subject. Category and
level-filter pages should only be added when they include distinct educational
guidance; they must not be created as thin keyword permutations.

## Automated quality gate

`npm run audit:seo` validates the built artifact:

- 151 indexable pages and 144 localized topic pages exist;
- canonical URLs are absolute, unique, and use `PUBLIC_SITE_URL`;
- titles, descriptions, robots directives, one H1, and parseable JSON-LD exist;
- topic pages carry full hreflang, learning-resource, and breadcrumb markup;
- topic pages reference existing illustration files and `ImageObject` schema;
- the homepage exposes at least 500 visible words in initial HTML;
- the sitemap contains exactly the canonical pages, no parameters,
  `priority`, or `changefreq`;
- robots and `llms.txt` reference the expected public identity.

`npm run check:deploy` separately refuses deployment unless
`PUBLIC_SITE_URL` is a valid non-example HTTPS origin with no path, query,
fragment, or credentials.

## Final-domain launch sequence

Do not enable automated deployment until the canonical domain is decided.

1. Add the repository variable `PUBLIC_SITE_URL`, for example
   `https://your-final-domain.tld`.
2. Run `npm run check:deploy`, `npm run check`, and
   `npx wrangler deploy --dry-run`.
3. Confirm the custom domain, apex/www policy, and HTTPS redirect in Cloudflare.
4. Deploy, then fetch `/`, one page from each locale, `/sitemap.xml`,
   `/robots.txt`, `/llms.txt`, a room link, `/api`, and an unknown path.
5. Validate schema with Google’s
   [Rich Results Test](https://search.google.com/test/rich-results) and
   [Schema.org Validator](https://validator.schema.org/).
6. Add the canonical property to
   [Google Search Console](https://search.google.com/search-console/about),
   submit `/sitemap.xml`, and inspect the homepage and representative EN, PL,
   and JA topic URLs.
7. Measure mobile LCP, INP, and CLS with PageSpeed Insights and review field
   data when it becomes available.
8. Request indexing only after canonical, hreflang, status, and rendered-content
   checks pass.

Google recommends unique public URLs for multilingual versions, sitemap
submission, useful on-page descriptions, and structured data that matches
visible content. See the official
[multilingual-site guidance](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites),
[sitemap documentation](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap),
[snippet guidance](https://developers.google.com/search/docs/appearance/snippet),
and [structured-data introduction](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data).

## Post-launch measurements

Review monthly during the first quarter:

- valid indexed pages versus the expected 151;
- excluded/duplicate pages and soft 404s;
- impressions and clicks by locale, topic, and query;
- sitemap discovery and last-read status;
- mobile p75 LCP, INP, and CLS;
- crawl errors, structured-data warnings, and manual actions;
- external mentions, teacher feedback, and qualified translation reviews.

Never generate shallow pages merely to increase indexed URL count. Add new
search pages only when they provide distinct, reviewed value for a learner or
teacher.
