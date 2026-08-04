# Topic and translation guide

Topic content is the heart of LinguaFlow. A strong card should help two people
start speaking within seconds and continue for 15–25 minutes.

## Topic shape

Each topic in `src/content` contains:

- a stable kebab-case `id`;
- one CEFR level;
- exactly two supported languages;
- one category;
- localized title, description, and main prompt;
- at least five localized follow-up questions;
- five or six localized vocabulary concepts;
- an artwork atlas and cell index.

The current editorial standard is five or six follow-ups and five vocabulary
concepts in English, Polish, and Japanese. The public catalog contains 48
topics, 16 for each language pair, across 12 visual categories.

Small collections live in `topics.ts`, `moreTopics.ts`, `expandedTopics.ts`,
and `categoryTopics.ts`. Add a new collection when a focused contribution would
make an existing file difficult to review, then register it once in
`topicCatalog.ts`. Feature code must never import a content collection directly.

## Writing sequence

1. Choose a relatable situation or decision.
2. Write one open main prompt with no single correct answer.
3. Add concrete follow-ups before abstract ones.
4. Select vocabulary participants may actually need to answer.
5. Review against the target CEFR level.
6. Translate for meaning and naturalness, not word order.
7. Run `npm run check:content`.

## CEFR guidance

| Level | Prompt characteristics |
|---|---|
| A1 | immediate routines, preferences, short concrete answers |
| A2 | familiar experiences, simple reasons, comparisons |
| B1 | connected explanations, plans, advantages and disadvantages |
| B2 | viewpoints, trade-offs, social or professional consequences |
| C1 | nuanced claims, systems, ethics, uncertainty, synthesis |

Do not make a topic “advanced” by adding rare facts. Increase the reasoning and
language complexity instead.

## Translation review

For each locale, verify:

- the question is natural when spoken aloud;
- politeness and directness fit the language;
- no translation accidentally narrows or changes the answer;
- technical terms are common enough for the stated level;
- Japanese punctuation and register are consistent;
- Polish inflection and aspect are idiomatic;
- vocabulary direction matches the displayed prompt language.

## Adding artwork

Topic artwork uses a 4 × 3 atlas. Set `atlas` to `1`, `2`, or `3` and `artIndex` from
`0` through `11`. Artwork should remain legible in both 16:9 cards and wider
detail crops. Avoid embedded text, flags as language shorthand, logos, and
stereotyped cultural imagery.

The build exposes approved atlas cells as optimized 362 × 362 topic images for
the public search pages. Do not edit those derived files independently. Update
the atlas and regenerate all affected cells so the application card, public
page, schema, and social metadata remain consistent. See
[`ASSETS.md`](ASSETS.md) for naming, provenance, optimization, accessibility,
and screenshot requirements.

## Validation

```bash
npm run check:content
```

The validator checks the total catalog size, duplicate IDs, pair coverage,
localized titles, follow-up counts, and vocabulary counts. Tests also confirm
that prompts, follow-ups, and vocabulary are searchable across scripts. Human
review is still required for level, pedagogy, translation quality, cultural
context, and safety.
