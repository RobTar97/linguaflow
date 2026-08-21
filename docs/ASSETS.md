# Visual asset guide

LinguaFlow keeps generated illustrations, application captures, icons, and
sound cues separate so contributors can review provenance and avoid presenting
concept artwork as product evidence.

## Asset classes

| Class | Location | Rule |
|---|---|---|
| Product captures | `artifacts/` | Capture from the real application at the documented viewport. Do not retouch controls or invent states. |
| Public illustrations | `public/images/` | No embedded text, flags as language shorthand, third-party marks, or unlicensed characters. Record how the image was produced. |
| Topic crops | `public/images/topics/` | Derived from the approved 4 × 3 atlases. Keep the `atlas-{atlas}-{index}.jpg` mapping stable. |
| Install icons | `public/icon-*.png`, `public/apple-touch-icon.png` | Export from `public/favicon.svg`; do not redraw the brand mark with a generative model. |
| Social preview | `public/og-image-v2.jpg` | 1280 × 640 and safe for a centered social crop. Update metadata and documentation together. |

## Current generated training illustration

`public/images/linguaflow-guided-session-720.webp` and
`public/images/linguaflow-guided-session-1200.webp` were generated for LinguaFlow
on 2026-08-04 with the built-in OpenAI image-generation workflow. The existing
category atlas and social preview were used only as style references. It is an
illustration, not a screenshot of the application.

Final prompt:

> Create a polished 16:9 illustration of one language teacher guiding a
> structured online conversation training session with three adult learners.
> Show a shared progression from warm-up to discussion to reflection in the
> established warm, hand-painted LinguaFlow style. Use cream, orange, cobalt,
> lavender, and natural green. Include no text, letters, logos, flags,
> watermarks, children, duplicated faces, extra limbs, or simulated product UI.

The responsive WebP exports are 1200 × 675 (approximately 71 KB) and 720 × 405
(approximately 34 KB). The teacher-page alternative text is: “A language
teacher guiding three adult learners through a structured online conversation
session.”

## Topic illustration derivatives

The three 1448 × 1086 topic atlases contain twelve 362 × 362 cells each. The
36 optimized crops in `public/images/topics/` expose those existing artworks to
public topic pages as ordinary images and `ImageObject` schema. They are not 36
new compositions. The interactive application continues to use the atlases to
avoid many small requests.

## Product capture specification

Use a clean local Worker build with seeded, fictional names only.

- Desktop: 1440 × 1000.
- Mobile: 390 × 844.
- Browser zoom: 100%.
- Capture light mode with sound state visible when relevant.
- Never include real room codes, learner identities, tokens, console output, or
  browser extensions.
- Preserve the entire viewport; crop only outside the viewport frame.
- Use factual alt text that names the screen and visible task.

Guided-training releases should include a current Teacher Studio capture, a
teacher-room capture showing phase controls, and a student mobile capture
showing synchronized progress.

## Contribution and optimization rules

1. Use lowercase kebab-case filenames and add `-v2`, `-v3`, and so on instead
   of silently overwriting a public illustration.
2. Keep public raster images below 600 KiB unless the performance budget and
   rationale are deliberately updated.
3. Supply intrinsic width and height for every HTML image.
4. Give informative images localized alt text; decorative images use an empty
   alt or an equivalent accessible-name strategy.
5. Record the source, generator or capture procedure, date, final prompt when
   applicable, and any reference assets.
6. Confirm the contributor has the right to release the asset under the
   repository license. Do not submit classroom photos or personal data.
7. Run `npm run check`, which validates SEO output and image budgets.
