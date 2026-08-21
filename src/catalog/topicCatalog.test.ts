import { describe, expect, it } from "vitest";
import { topicCatalog, topicCategories } from "./topicCatalog";
import type { LanguageCode, Level } from "../domain/types";
import japaneseReadings from "../../public/data/japanese-readings.json";

const pairs: Array<[LanguageCode, LanguageCode]> = [
  ["EN", "PL"],
  ["EN", "JA"],
  ["PL", "JA"],
];
const levels: Level[] = ["A1", "A2", "B1", "B2", "C1"];

describe("topicCatalog", () => {
  it("contains a healthy starter library", () => {
    expect(topicCatalog.all()).toHaveLength(48);
  });

  it("passes authored-content validation", () => {
    expect(topicCatalog.validate()).toEqual([]);
  });

  it("has generated reading support for every authored Japanese learning string", () => {
    const texts = new Set<string>();
    const add = (value: string | undefined) => {
      if (value?.trim() && /[\u3040-\u30ff\u3400-\u9fff]/u.test(value)) {
        texts.add(value.trim());
      }
    };

    for (const topic of topicCatalog.all()) {
      add(topic.title.JA);
      add(topic.description.JA);
      add(topic.mainPrompt.JA);
      topic.followUps.JA.forEach(add);
      topic.vocabulary.JA.forEach((item) => {
        add(item.word);
        add(item.translation);
        add(item.part);
      });
      topic.facilitation?.objectives.JA.forEach(add);
      topic.facilitation?.tips.JA.forEach(add);
      add(topic.facilitation?.preparation.JA);
      add(topic.facilitation?.warmUp.JA);
      add(topic.facilitation?.easier.JA);
      add(topic.facilitation?.harder.JA);
      add(topic.facilitation?.sensitiveContent?.JA);
    }

    for (const text of texts) {
      const entry = japaneseReadings[text as keyof typeof japaneseReadings];
      expect(entry, `Missing generated Japanese reading for: ${text}`).toBeDefined();
      expect(entry.segments.map((segment) => segment.text).join("")).toBe(text);
      expect(entry.romaji.trim()).not.toBe("");
    }
  });

  it.each(pairs)("supports the %s ↔ %s learning pair", (first, second) => {
    expect(
      topicCatalog.browse({
        nativeLanguage: first,
        targetLanguage: second,
      }).length,
    ).toBe(16);
  });

  it("offers twelve useful categories with multiple topics each", () => {
    expect(topicCategories).toHaveLength(12);
    for (const category of topicCategories) {
      expect(topicCatalog.browse({ category }).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("searches prompts, follow-ups, and vocabulary in every language", () => {
    expect(topicCatalog.browse({ search: "オーバーツーリズム" })[0]?.id).toBe(
      "ethical-tourism",
    );
    expect(topicCatalog.browse({ search: "niesprawiedliwą krytykę" })[0]?.id).toBe(
      "giving-feedback",
    );
    expect(topicCatalog.browse({ search: "weekly plan" })[0]?.id).toBe(
      "study-routines",
    );
    expect(topicCatalog.browse({ search: "市民科学" })[0]?.id).toBe(
      "citizen-science",
    );
    expect(topicCatalog.browse({ search: "finansowanie publiczne" })[0]?.id).toBe(
      "art-in-public-life",
    );
  });

  it.each(levels)("contains at least one %s topic", (level) => {
    expect(topicCatalog.browse({ level })).not.toHaveLength(0);
  });

  it("returns saved-only results without leaking unsaved topics", () => {
    const savedIds = new Set(["remote-work", "future-of-education"]);
    expect(
      topicCatalog
        .browse({ savedIds, savedOnly: true })
        .map((topic) => topic.id),
    ).toEqual(["remote-work", "future-of-education"]);
  });

  it("puts exact-level recommendations before pair fallbacks", () => {
    const recommendations = topicCatalog.recommend({
      nativeLanguage: "PL",
      targetLanguage: "JA",
      level: "B2",
    });
    expect(recommendations.slice(0, 2).every((topic) => topic.level === "B2")).toBe(
      true,
    );
  });
});
