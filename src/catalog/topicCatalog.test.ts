import { describe, expect, it } from "vitest";
import { topicCatalog } from "./topicCatalog";
import type { LanguageCode, Level } from "../domain/types";

const pairs: Array<[LanguageCode, LanguageCode]> = [
  ["EN", "PL"],
  ["EN", "JA"],
  ["PL", "JA"],
];
const levels: Level[] = ["A1", "A2", "B1", "B2", "C1"];

describe("topicCatalog", () => {
  it("contains a healthy starter library", () => {
    expect(topicCatalog.all()).toHaveLength(36);
  });

  it("passes authored-content validation", () => {
    expect(topicCatalog.validate()).toEqual([]);
  });

  it.each(pairs)("supports the %s ↔ %s learning pair", (first, second) => {
    expect(
      topicCatalog.browse({
        nativeLanguage: first,
        targetLanguage: second,
      }).length,
    ).toBeGreaterThanOrEqual(12);
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
