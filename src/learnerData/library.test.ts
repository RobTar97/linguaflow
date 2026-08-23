import { describe, expect, it } from "vitest";
import type { KeyValueStorage } from "../platform/storage";
import {
  createLearnerDataExport,
  createLearnerLibraryRepository,
  emptyLearnerLibrary,
  mergeLearnerLibrary,
  toggleSavedTopic,
  toggleVocabularyBookmark,
  writeTopicNote,
} from "./library";
import { parseLearnerData } from "./format";

function memoryStorage(initial: Record<string, unknown> = {}): KeyValueStorage {
  const values = new Map(Object.entries(initial));
  return {
    get: (key, fallback) => values.has(key) ? values.get(key) as typeof fallback : fallback,
    set: (key, value) => { values.set(key, value); },
    remove: (key) => { values.delete(key); },
  };
}

describe("Learner library", () => {
  it("owns saves, notes, and vocabulary mutations", () => {
    let library = toggleSavedTopic(emptyLearnerLibrary, "daily-routines");
    library = writeTopicNote(library, "daily-routines", "Practise the past tense");
    library = toggleVocabularyBookmark(library, "daily-routines:habit");
    expect(library).toEqual({
      savedIds: ["daily-routines"],
      topicNotes: { "daily-routines": "Practise the past tense" },
      vocabularyBookmarks: ["daily-routines:habit"],
    });
  });

  it("merges deterministically and makes note conflicts explicit", () => {
    const current = { savedIds: ["a"], topicNotes: { a: "local" }, vocabularyBookmarks: ["a:word"] };
    const imported = { savedTopicIds: ["a", "b"], topicNotes: { a: "imported", b: "new" }, vocabularyBookmarks: ["b:word"] };
    expect(mergeLearnerLibrary(current, imported)).toMatchObject({
      savedIds: ["a", "b"],
      topicNotes: { a: "local", b: "new" },
    });
    expect(mergeLearnerLibrary(current, imported, true).topicNotes.a).toBe("imported");
  });

  it("migrates the three legacy records into one record", () => {
    const repository = createLearnerLibraryRepository(memoryStorage({
      "linguaflow-saved": ["a"],
      "linguaflow-topic-notes-v1": { a: "note" },
      "linguaflow-vocabulary-bookmarks-v1": ["a:word"],
    }));
    expect(repository.load()).toEqual({ savedIds: ["a"], topicNotes: { a: "note" }, vocabularyBookmarks: ["a:word"] });
  });

  it("round-trips export through the versioned parser", () => {
    const exported = createLearnerDataExport({
      library: { savedIds: ["pack:topic"], topicNotes: { "pack:topic": "note" }, vocabularyBookmarks: [] },
      appVersion: "0.5.0",
      installedPacks: [{ id: "pack", version: "1.0.0" }],
      exportedAt: "2026-08-23T00:00:00.000Z",
    });
    expect(parseLearnerData(exported)).toEqual({ errors: [], data: exported });
  });
});
