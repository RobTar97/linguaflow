# LinguaFlow context

Use this glossary when discussing product behavior or naming code.

- **Interface language**: language used by navigation and instructions.
- **Support language**: language used for translations and explanations.
- **Target language**: language participants are encouraged to speak.
- **Learning goal**: interface language, support language, target language,
  and CEFR level stored together.
- **Topic**: an authored conversation unit containing one main prompt,
  follow-up questions, vocabulary, metadata, and artwork.
- **Topic pack**: a versioned `.lfpack` archive containing a manifest, license,
  one or more topics, optional artwork, authorship, and review provenance.
- **Installed pack**: a validated topic pack stored in the learner's browser and
  available to the runtime catalog, including during offline practice.
- **Review assertion**: a factual record of who reviewed which dimension of a
  pack or topic, in which locale, and when; absence is shown as unreviewed.
- **Facilitation guide**: teacher-facing duration, group size, objectives,
  preparation, warm-up, teaching tips, and difficulty adaptations for a topic.
- **Learner library**: learner-owned saved topics, private topic notes, and
  vocabulary bookmarks that can be exported and merged on another device.
- **Contributor preview**: the public, account-free workspace that validates an
  `.lfpack` and renders learner, teacher, provenance, and print views.
- **Conversation session**: independent learner practice through one topic.
- **Room**: a teacher-led shared topic state identified by a short code.
- **Teacher**: creates a room and controls the active question.
- **Student**: joins a room and follows the shared question.
- **Learner**: browses and practises independently.
- **Live room**: cross-device room state synchronized through a Cloudflare
  Durable Object and automatically deleted eight hours after creation.
- **Local room adapter**: development-only browser storage used by `npm run dev`;
  production and `npm run preview:cloudflare` use the Worker API.
