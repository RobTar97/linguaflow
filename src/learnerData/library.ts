import type { WorkspaceProfile } from "../domain/types";
import type { KeyValueStorage } from "../platform/storage";
import {
  LEARNER_DATA_SCHEMA_VERSION,
  type LearnerDataExport,
} from "./format";

const LIBRARY_KEY = "linguaflow-learner-library-v1";
const LEGACY_SAVED_KEY = "linguaflow-saved";
const LEGACY_NOTES_KEY = "linguaflow-topic-notes-v1";
const LEGACY_VOCABULARY_KEY = "linguaflow-vocabulary-bookmarks-v1";

const MAX_SAVED_TOPICS = 5_000;
const MAX_TOPIC_ID_LENGTH = 160;
const MAX_NOTES = 2_000;
const MAX_NOTE_LENGTH = 2_000;
const MAX_VOCABULARY_BOOKMARKS = 10_000;
const MAX_BOOKMARK_LENGTH = 500;

export interface LearnerLibrary {
  savedIds: string[];
  topicNotes: Record<string, string>;
  vocabularyBookmarks: string[];
}

export const emptyLearnerLibrary: LearnerLibrary = {
  savedIds: [],
  topicNotes: {},
  vocabularyBookmarks: [],
};

function validString(value: unknown, maximumLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maximumLength;
}

function normalizeLibrary(value: unknown): LearnerLibrary {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...emptyLearnerLibrary, topicNotes: {} };
  }
  const input = value as Partial<LearnerLibrary>;
  const savedIds = Array.isArray(input.savedIds)
    ? Array.from(new Set(input.savedIds.filter((id) => validString(id, MAX_TOPIC_ID_LENGTH)))).slice(0, MAX_SAVED_TOPICS)
    : [];
  const vocabularyBookmarks = Array.isArray(input.vocabularyBookmarks)
    ? Array.from(new Set(input.vocabularyBookmarks.filter((key) => validString(key, MAX_BOOKMARK_LENGTH)))).slice(0, MAX_VOCABULARY_BOOKMARKS)
    : [];
  const notes = input.topicNotes && typeof input.topicNotes === "object" && !Array.isArray(input.topicNotes)
    ? Object.entries(input.topicNotes)
        .filter(([key, note]) => validString(key, MAX_TOPIC_ID_LENGTH) && typeof note === "string" && note.length <= MAX_NOTE_LENGTH)
        .slice(0, MAX_NOTES)
    : [];
  return { savedIds, topicNotes: Object.fromEntries(notes), vocabularyBookmarks };
}

export function createLearnerLibraryRepository(storage: KeyValueStorage) {
  return {
    load(): LearnerLibrary {
      const current = storage.get<unknown>(LIBRARY_KEY, null);
      if (current) return normalizeLibrary(current);
      const migrated = normalizeLibrary({
        savedIds: storage.get<string[]>(LEGACY_SAVED_KEY, []),
        topicNotes: storage.get<Record<string, string>>(LEGACY_NOTES_KEY, {}),
        vocabularyBookmarks: storage.get<string[]>(LEGACY_VOCABULARY_KEY, []),
      });
      if (
        migrated.savedIds.length ||
        Object.keys(migrated.topicNotes).length ||
        migrated.vocabularyBookmarks.length
      ) {
        storage.set(LIBRARY_KEY, migrated);
      }
      return migrated;
    },
    save(library: LearnerLibrary) {
      const normalized = normalizeLibrary(library);
      storage.set(LIBRARY_KEY, normalized);
      return normalized;
    },
  };
}

export function toggleSavedTopic(library: LearnerLibrary, topicId: string): LearnerLibrary {
  if (!validString(topicId, MAX_TOPIC_ID_LENGTH)) return library;
  const savedIds = library.savedIds.includes(topicId)
    ? library.savedIds.filter((id) => id !== topicId)
    : library.savedIds.length < MAX_SAVED_TOPICS
      ? [...library.savedIds, topicId]
      : library.savedIds;
  return { ...library, savedIds };
}

export function writeTopicNote(library: LearnerLibrary, topicId: string, note: string): LearnerLibrary {
  if (!validString(topicId, MAX_TOPIC_ID_LENGTH) || note.length > MAX_NOTE_LENGTH) return library;
  const topicNotes = { ...library.topicNotes };
  if (note.trim()) {
    if (!(topicId in topicNotes) && Object.keys(topicNotes).length >= MAX_NOTES) return library;
    topicNotes[topicId] = note;
  } else {
    delete topicNotes[topicId];
  }
  return { ...library, topicNotes };
}

export function toggleVocabularyBookmark(library: LearnerLibrary, key: string): LearnerLibrary {
  if (!validString(key, MAX_BOOKMARK_LENGTH)) return library;
  const vocabularyBookmarks = library.vocabularyBookmarks.includes(key)
    ? library.vocabularyBookmarks.filter((item) => item !== key)
    : library.vocabularyBookmarks.length < MAX_VOCABULARY_BOOKMARKS
      ? [...library.vocabularyBookmarks, key]
      : library.vocabularyBookmarks;
  return { ...library, vocabularyBookmarks };
}

export function mergeLearnerLibrary(
  current: LearnerLibrary,
  imported: LearnerDataExport["library"],
  replaceConflicts = false,
): LearnerLibrary {
  return normalizeLibrary({
    savedIds: [...current.savedIds, ...imported.savedTopicIds],
    topicNotes: replaceConflicts
      ? { ...current.topicNotes, ...imported.topicNotes }
      : { ...imported.topicNotes, ...current.topicNotes },
    vocabularyBookmarks: [...current.vocabularyBookmarks, ...imported.vocabularyBookmarks],
  });
}

export function createLearnerDataExport(input: {
  library: LearnerLibrary;
  appVersion: string;
  installedPacks: Array<{ id: string; version: string }>;
  profile?: WorkspaceProfile;
  exportedAt?: string;
}): LearnerDataExport {
  const library = normalizeLibrary(input.library);
  return {
    schemaVersion: LEARNER_DATA_SCHEMA_VERSION,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    appVersion: input.appVersion,
    ...(input.profile ? { profile: input.profile } : {}),
    library: {
      savedTopicIds: library.savedIds,
      topicNotes: library.topicNotes,
      vocabularyBookmarks: library.vocabularyBookmarks,
    },
    installedPacks: input.installedPacks.map(({ id, version }) => ({ id, version })),
  };
}
