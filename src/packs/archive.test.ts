import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { readTopicPackArchive, writeTopicPackArchive } from "./archive";
import type { PortableTopic, TopicPackDocument } from "./types";

const questions = ["One?", "Two?", "Three?", "Four?", "Five?"];
const words = ["one", "two", "three", "four", "five"].map((word) => ({ word, translation: word, part: "noun" }));
const localized = (value: string) => ({ EN: value, PL: value, JA: value });
const localizedList = (value: string[]) => ({ EN: value, PL: value, JA: value });
const topic: PortableTopic = {
  id: "community-gardens", level: "B1", languages: ["EN", "PL"], category: "Environment",
  title: { EN: "Community gardens", PL: "Ogrody społeczne" },
  description: { EN: "Talk about shared gardens.", PL: "Porozmawiaj o wspólnych ogrodach." },
  mainPrompt: { EN: "What makes a shared garden work?", PL: "Co sprawia, że wspólny ogród działa?" },
  followUps: { EN: questions, PL: questions.map((item) => `PL ${item}`) },
  vocabulary: { EN: words, PL: words },
  facilitation: {
    durationMinutes: { min: 15, max: 25 },
    groupSize: { min: 2, max: 12 },
    objectives: localizedList(["Exchange perspectives"]),
    preparation: localized("Review the prompts."),
    warmUp: localized("Share one example."),
    tips: localizedList(["Invite a follow-up question."]),
    easier: localized("Use sentence starters."),
    harder: localized("Compare two viewpoints."),
  },
};

const pack: TopicPackDocument = {
  manifest: {
    schemaVersion: "1.0", id: "community-pack", version: "1.0.0",
    title: { EN: "Community conversations" }, description: { EN: "Local conversation lessons." },
    defaultLocale: "EN", locales: ["EN", "PL"],
    license: { spdx: "CC-BY-4.0", file: "LICENSE.md" },
    authors: [{ displayName: "Example contributor" }], compatibility: { linguaflow: ">=0.5.0" },
  },
  topics: [topic], assets: new Map(), licenseText: "Example license",
};

describe("topic pack archives", () => {
  it("round-trips a valid, review-transparent pack", () => {
    const result = readTopicPackArchive(writeTopicPackArchive(pack));
    expect(result.valid).toBe(true);
    expect(result.pack?.manifest.id).toBe("community-pack");
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "review.unverified", severity: "warning" }));
  });

  it("rejects missing localized content", () => {
    const invalid = structuredClone(topic);
    invalid.title.PL = "";
    const result = readTopicPackArchive(writeTopicPackArchive({ ...pack, topics: [invalid] }));
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "localized.missing", path: "topics[0].title.PL" }));
  });

  it("rejects unsafe archive paths instead of silently skipping them", () => {
    const archive = zipSync({
      "manifest.json": strToU8("{}"),
      "../outside.json": strToU8("{}"),
    });
    const result = readTopicPackArchive(archive);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "archive.path" }));
  });
});
