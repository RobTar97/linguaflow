import { categoryCopy, topics as coreTopics } from "../content/topics";
import { moreTopics } from "../content/moreTopics";
import type {
  Category,
  LanguageCode,
  Level,
  Locale,
  Topic,
} from "../domain/types";

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
  recommend(goal: {
    nativeLanguage: LanguageCode;
    targetLanguage: LanguageCode;
    level: Level;
  }): Topic[];
  validate(): string[];
}

const topics = [...coreTopics, ...moreTopics];

function supportsGoal(
  topic: Topic,
  nativeLanguage?: LanguageCode,
  targetLanguage?: LanguageCode,
) {
  if (!nativeLanguage || !targetLanguage) return true;
  return (
    nativeLanguage !== targetLanguage &&
    topic.languages.includes(nativeLanguage) &&
    topic.languages.includes(targetLanguage)
  );
}

export const topicCatalog: TopicCatalog = {
  all() {
    return topics;
  },
  get(id) {
    return topics.find((topic) => topic.id === id);
  },
  browse(query) {
    const search = query.search?.trim().toLocaleLowerCase() ?? "";
    return topics.filter((topic) => {
      if (query.savedOnly && !query.savedIds?.has(topic.id)) return false;
      if (query.category && query.category !== "all" && topic.category !== query.category) {
        return false;
      }
      if (query.level && query.level !== "all" && topic.level !== query.level) {
        return false;
      }
      if (!supportsGoal(topic, query.nativeLanguage, query.targetLanguage)) {
        return false;
      }
      if (!search) return true;
      const searchable = [
        ...Object.values(topic.title),
        ...Object.values(topic.description),
        ...Object.values(categoryCopy[topic.category]),
      ]
        .join(" ")
        .toLocaleLowerCase();
      return searchable.includes(search);
    });
  },
  recommend(goal) {
    const exact = this.browse({
      nativeLanguage: goal.nativeLanguage,
      targetLanguage: goal.targetLanguage,
      level: goal.level,
    });
    const pair = this.browse({
      nativeLanguage: goal.nativeLanguage,
      targetLanguage: goal.targetLanguage,
    });
    return [
      ...exact,
      ...pair.filter((topic) => !exact.some((match) => match.id === topic.id)),
    ];
  },
  validate() {
    const issues: string[] = [];
    const ids = new Set<string>();
    for (const topic of topics) {
      if (ids.has(topic.id)) issues.push(`Duplicate topic id: ${topic.id}`);
      ids.add(topic.id);
      if (topic.languages[0] === topic.languages[1]) {
        issues.push(`${topic.id}: language pair must contain two languages`);
      }
      for (const locale of ["EN", "PL", "JA"] as Locale[]) {
        if (!topic.title[locale]?.trim()) issues.push(`${topic.id}: missing ${locale} title`);
        if (topic.followUps[locale]?.length < 4) {
          issues.push(`${topic.id}: ${locale} needs at least 4 follow-up questions`);
        }
        if (topic.vocabulary[locale]?.length < 4) {
          issues.push(`${topic.id}: ${locale} needs at least 4 vocabulary items`);
        }
      }
    }
    return issues;
  },
};

export const topicCategories = Object.keys(categoryCopy) as Category[];
export const cefrLevels: Level[] = ["A1", "A2", "B1", "B2", "C1"];
