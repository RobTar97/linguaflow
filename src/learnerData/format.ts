import type { Level, Locale, WorkspaceProfile, WorkspaceRole } from "../domain/types";

export const LEARNER_DATA_SCHEMA_VERSION = 1;
export const LEARNER_DATA_MAX_BYTES = 1024 * 1024;

const locales = new Set<Locale>(["EN", "PL", "JA"]);
const levels = new Set<Level>(["A1", "A2", "B1", "B2", "C1"]);
const roles = new Set<WorkspaceRole>(["learner", "teacher", "student"]);

export interface LearnerDataExport {
  schemaVersion: 1;
  exportedAt: string;
  appVersion: string;
  profile?: WorkspaceProfile;
  library: {
    savedTopicIds: string[];
    topicNotes: Record<string, string>;
    vocabularyBookmarks: string[];
  };
  installedPacks: Array<{ id: string; version: string }>;
}

function boundedStrings(value: unknown, maximumItems: number, maximumLength: number) {
  return (
    Array.isArray(value) &&
    value.length <= maximumItems &&
    value.every((item) => typeof item === "string" && item.length > 0 && item.length <= maximumLength)
  );
}

function validProfile(value: unknown): value is WorkspaceProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const profile = value as Partial<WorkspaceProfile>;
  const goal = profile.goal;
  return (
    typeof profile.name === "string" &&
    profile.name.trim().length >= 1 &&
    profile.name.length <= 50 &&
    typeof profile.role === "string" &&
    roles.has(profile.role as WorkspaceRole) &&
    profile.setupComplete === true &&
    Boolean(goal) &&
    locales.has(goal!.interfaceLocale) &&
    locales.has(goal!.nativeLanguage) &&
    locales.has(goal!.targetLanguage) &&
    goal!.nativeLanguage !== goal!.targetLanguage &&
    levels.has(goal!.level)
  );
}

export function parseLearnerData(value: unknown): { data?: LearnerDataExport; errors: string[] } {
  const errors: string[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { errors: ["The file does not contain a learner data object."] };
  }
  const input = value as Partial<LearnerDataExport>;
  if (input.schemaVersion !== LEARNER_DATA_SCHEMA_VERSION) errors.push("This learner data version is not supported.");
  if (typeof input.exportedAt !== "string" || !Number.isFinite(Date.parse(input.exportedAt))) errors.push("The export date is invalid.");
  if (typeof input.appVersion !== "string" || input.appVersion.length < 1 || input.appVersion.length > 40) errors.push("The application version is invalid.");

  const library = input.library;
  if (!library || typeof library !== "object") {
    errors.push("The learner library is incomplete.");
  } else {
    if (!boundedStrings(library.savedTopicIds, 5_000, 160)) errors.push("Saved topic identifiers are invalid or exceed the import limit.");
    if (!boundedStrings(library.vocabularyBookmarks, 10_000, 500)) errors.push("Vocabulary bookmarks are invalid or exceed the import limit.");
    if (!library.topicNotes || typeof library.topicNotes !== "object" || Array.isArray(library.topicNotes)) {
      errors.push("Private topic notes are invalid.");
    } else {
      const notes = Object.entries(library.topicNotes);
      if (notes.length > 2_000 || notes.some(([key, note]) => key.length < 1 || key.length > 160 || typeof note !== "string" || note.length > 2_000)) {
        errors.push("Private topic notes are invalid or exceed the import limit.");
      }
    }
  }

  if (!Array.isArray(input.installedPacks) || input.installedPacks.length > 100 || input.installedPacks.some((pack) =>
    !pack ||
    typeof pack.id !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pack.id) ||
    pack.id.length > 60 ||
    typeof pack.version !== "string" ||
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(pack.version) ||
    pack.version.length > 40
  )) {
    errors.push("Installed-pack references are invalid.");
  }
  if (input.profile !== undefined && !validProfile(input.profile)) errors.push("The profile or language goal is invalid.");
  if (errors.length || !library || !input.installedPacks) return { errors };

  return {
    errors: [],
    data: {
      schemaVersion: LEARNER_DATA_SCHEMA_VERSION,
      exportedAt: input.exportedAt!,
      appVersion: input.appVersion!,
      ...(input.profile ? { profile: input.profile } : {}),
      library: {
        savedTopicIds: Array.from(new Set(library.savedTopicIds)),
        topicNotes: Object.fromEntries(Object.entries(library.topicNotes)),
        vocabularyBookmarks: Array.from(new Set(library.vocabularyBookmarks)),
      },
      installedPacks: input.installedPacks.map(({ id, version }) => ({ id, version })),
    },
  };
}
