import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { inspectTopicPackArchive, writeAcceptedTopicPack } from "./intake";
import type { PortableTopic, TopicPackManifest } from "./types";

const manifest: TopicPackManifest = {
  schemaVersion: "1.0",
  id: "community-pack",
  version: "1.0.0",
  defaultLocale: "EN",
  locales: ["EN", "PL"],
  title: { EN: "Community", PL: "Społeczność" },
  description: { EN: "Pack", PL: "Pakiet" },
  license: { spdx: "MIT", file: "LICENSE" },
  authors: [{ displayName: "Ada" }],
  compatibility: { linguaflow: ">=0.5.0" },
};

const localized = { EN: "Text", PL: "Tekst" };
const localizedAll = { EN: "Text", PL: "Tekst", JA: "テキスト" };
const listsAll = { EN: ["Speak"], PL: ["Mów"], JA: ["話す"] };
const topic: PortableTopic = {
  id: "city-stories",
  level: "B1",
  languages: ["EN", "PL"],
  category: "Travel & Culture",
  title: localized,
  description: localized,
  mainPrompt: localized,
  followUps: { EN: ["1", "2", "3", "4", "5"], PL: ["1", "2", "3", "4", "5"] },
  vocabulary: {
    EN: ["a", "b", "c", "d", "e"].map((word) => ({ word, translation: word, part: "noun" })),
    PL: ["a", "b", "c", "d", "e"].map((word) => ({ word, translation: word, part: "noun" })),
  },
  facilitation: {
    durationMinutes: { min: 10, max: 20 },
    groupSize: { min: 1, max: 6 },
    objectives: listsAll,
    preparation: localizedAll,
    warmUp: localizedAll,
    tips: listsAll,
    easier: localizedAll,
    harder: localizedAll,
  },
};

function archive() {
  return zipSync({
    "manifest.json": strToU8(JSON.stringify(manifest)),
    "topics/city-stories.json": strToU8(JSON.stringify(topic)),
    LICENSE: strToU8("MIT"),
  });
}

describe("Topic pack intake", () => {
  it("provides one accepted result for preview and installation", () => {
    const result = inspectTopicPackArchive(archive());
    expect(result.validation.valid).toBe(true);
    expect(result.accepted?.record.key).toBe("community-pack@1.0.0");
    expect(result.accepted?.topics[0].id).toBe("community-pack:city-stories");
    expect(writeAcceptedTopicPack(result.accepted!)).toBeInstanceOf(Uint8Array);
  });

  it("never exposes an accepted pack after validation fails", () => {
    const result = inspectTopicPackArchive(new Uint8Array([1, 2, 3]));
    expect(result.validation.valid).toBe(false);
    expect(result.accepted).toBeUndefined();
  });
});
