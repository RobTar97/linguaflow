import { categoryCopy, topics as coreTopics } from "../content/topics";
import { moreTopics } from "../content/moreTopics";
import { expandedTopics } from "../content/expandedTopics";
import { categoryTopics } from "../content/categoryTopics";
import type { Category, Level } from "../domain/types";
import { enrichCoreTopic } from "../packs/coreMetadata";
import { createTopicCatalog } from "./createTopicCatalog";

export type { TopicCatalog, TopicQuery } from "./createTopicCatalog";
export { createTopicCatalog } from "./createTopicCatalog";

const topics = [...coreTopics, ...moreTopics, ...expandedTopics, ...categoryTopics].map(enrichCoreTopic);

export const topicCatalog = createTopicCatalog(topics);
export const topicCategories = Object.keys(categoryCopy) as Category[];
export const cefrLevels: Level[] = ["A1", "A2", "B1", "B2", "C1"];
