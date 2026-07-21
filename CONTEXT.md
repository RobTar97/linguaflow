# LinguaFlow context

Use this glossary when discussing product behavior or naming code.

- **Interface language**: language used by navigation and instructions.
- **Support language**: language used for translations and explanations.
- **Target language**: language participants are encouraged to speak.
- **Learning goal**: interface language, support language, target language,
  and CEFR level stored together.
- **Topic**: an authored conversation unit containing one main prompt,
  follow-up questions, vocabulary, metadata, and artwork.
- **Conversation session**: independent learner practice through one topic.
- **Room**: a teacher-led shared topic state identified by a short code.
- **Teacher**: creates a room and controls the active question.
- **Student**: joins a room and follows the shared question.
- **Learner**: browses and practises independently.
- **Live room**: cross-device room state synchronized through a Cloudflare
  Durable Object and automatically deleted eight hours after creation.
- **Local room adapter**: development-only browser storage used by `npm run dev`;
  production and `npm run preview:cloudflare` use the Worker API.
