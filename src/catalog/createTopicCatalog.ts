import type { Category, LanguageCode, Level, Locale, Topic } from "../domain/types";

export interface TopicQuery {
  category?: Category | "all";
  level?: Level | "all";
  nativeLanguage?: LanguageCode;
  targetLanguage?: LanguageCode;
  search?: string;
  savedIds?: ReadonlySet<string>;
  savedOnly?: boolean;
}
export interface TopicCatalog {
  all(): readonly Topic[];
  get(id: string): Topic | undefined;
  browse(query: TopicQuery): Topic[];
  recommend(goal: { nativeLanguage: LanguageCode; targetLanguage: LanguageCode; level: Level }): Topic[];
  validate(): string[];
}

function supportsGoal(topic: Topic, nativeLanguage?: LanguageCode, targetLanguage?: LanguageCode) {
  if (!nativeLanguage || !targetLanguage) return true;
  return nativeLanguage !== targetLanguage && topic.languages.includes(nativeLanguage) && topic.languages.includes(targetLanguage);
}

export function createTopicCatalog(topics: readonly Topic[]): TopicCatalog {
  const searchIndex = new Map(topics.map((topic) => [topic.id, [
    ...Object.values(topic.title), ...Object.values(topic.description),
    ...Object.values(topic.mainPrompt), ...Object.values(topic.followUps).flat(),
    ...Object.values(topic.vocabulary).flatMap((items) => items.flatMap(({ word, translation }) => [word, translation])),
    topic.category,
  ].join(" ").toLocaleLowerCase()]));
  return {
    all: () => topics,
    get: (id) => topics.find((topic) => topic.id === id),
    browse(query) {
      const search = query.search?.trim().toLocaleLowerCase() ?? "";
      return topics.filter((topic) =>
        (!query.savedOnly || query.savedIds?.has(topic.id)) &&
        (!query.category || query.category === "all" || topic.category === query.category) &&
        (!query.level || query.level === "all" || topic.level === query.level) &&
        supportsGoal(topic, query.nativeLanguage, query.targetLanguage) &&
        (!search || searchIndex.get(topic.id)?.includes(search)),
      );
    },
    recommend(goal) {
      const exact = this.browse({ ...goal });
      const pair = this.browse({ nativeLanguage: goal.nativeLanguage, targetLanguage: goal.targetLanguage });
      return [...exact, ...pair.filter((topic) => !exact.some((match) => match.id === topic.id))];
    },
    validate() {
      const issues: string[] = [];
      const ids = new Set<string>();
      for (const topic of topics) {
        if (ids.has(topic.id)) issues.push(`Duplicate topic id: ${topic.id}`);
        ids.add(topic.id);
        if (topic.languages[0] === topic.languages[1]) issues.push(`${topic.id}: language pair must contain two languages`);
        if (!Number.isInteger(topic.artIndex) || topic.artIndex < 0 || topic.artIndex > 11) issues.push(`${topic.id}: artwork index must be between 0 and 11`);
        for (const locale of ["EN", "PL", "JA"] as Locale[]) {
          if (!topic.title[locale]?.trim()) issues.push(`${topic.id}: missing ${locale} title`);
          if (!topic.description[locale]?.trim()) issues.push(`${topic.id}: missing ${locale} description`);
          if (!topic.mainPrompt[locale]?.trim()) issues.push(`${topic.id}: missing ${locale} main prompt`);
          if (topic.followUps[locale]?.length < 5) issues.push(`${topic.id}: ${locale} needs at least 5 follow-up questions`);
          if (topic.followUps[locale]?.some((question) => !question.trim())) issues.push(`${topic.id}: ${locale} contains an empty follow-up question`);
          if (new Set(topic.followUps[locale]).size !== topic.followUps[locale].length) issues.push(`${topic.id}: ${locale} contains duplicate follow-up questions`);
          if (topic.vocabulary[locale]?.length < 5 || topic.vocabulary[locale]?.length > 6) issues.push(`${topic.id}: ${locale} needs 5 or 6 vocabulary items`);
          if (topic.vocabulary[locale]?.some(({ word, translation, part }) => !word.trim() || !translation.trim() || !part.trim())) issues.push(`${topic.id}: ${locale} contains incomplete vocabulary`);
        }
      }
      return issues;
    },
  };
}
