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
- at least four localized follow-up questions;
- at least four localized vocabulary items;
- an artwork atlas and cell index.

The current editorial standard is five follow-ups and five vocabulary items in
English, Polish, and Japanese.

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

Topic artwork uses a 4 × 3 atlas. Set `atlas` to `1` or `2` and `artIndex` from
`0` through `11`. Artwork should remain legible in both 16:9 cards and wider
detail crops. Avoid embedded text, flags as language shorthand, logos, and
stereotyped cultural imagery.

## Validation

```bash
npm run check:content
```

The validator checks duplicate IDs, valid language pairs, localized titles,
follow-up counts, and vocabulary counts. Human review is still required for
level, pedagogy, translation quality, cultural context, and safety.
