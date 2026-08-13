import { describe, expect, it } from "vitest";
import { parseLearnerData, type LearnerDataExport } from "./format";

const valid: LearnerDataExport = {
  schemaVersion: 1,
  exportedAt: "2026-08-12T00:00:00.000Z",
  appVersion: "0.5.0",
  profile: {
    name: "Kasia",
    role: "learner",
    setupComplete: true,
    goal: { interfaceLocale: "EN", nativeLanguage: "PL", targetLanguage: "EN", level: "B1" },
  },
  library: {
    savedTopicIds: ["remote-work", "remote-work"],
    topicNotes: { "remote-work": "Useful phrases" },
    vocabularyBookmarks: ["remote-work:EN:flexibility"],
  },
  installedPacks: [{ id: "community-pack", version: "1.0.0" }],
};

describe("learner data import", () => {
  it("normalizes a valid export and removes duplicate saves", () => {
    const result = parseLearnerData(valid);
    expect(result.errors).toEqual([]);
    expect(result.data?.library.savedTopicIds).toEqual(["remote-work"]);
  });

  it("rejects a profile with an unsupported target language", () => {
    const input = structuredClone(valid) as unknown as { profile: { goal: { targetLanguage: string } } };
    input.profile.goal.targetLanguage = "FR";
    expect(parseLearnerData(input).errors).toContain("The profile or language goal is invalid.");
  });

  it("rejects notes that exceed the local data contract", () => {
    const input = structuredClone(valid);
    input.library.topicNotes["remote-work"] = "x".repeat(2_001);
    expect(parseLearnerData(input).errors).toContain("Private topic notes are invalid or exceed the import limit.");
  });
});
