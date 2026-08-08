import type { WorkspaceProfile } from "../domain/types";

export const LEARNER_DATA_SCHEMA_VERSION = 1;

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
export function parseLearnerData(value: unknown): { data?: LearnerDataExport; errors: string[] } {
  const errors: string[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { errors: ["The file does not contain a learner data object."] };
  const data = value as Partial<LearnerDataExport>;
  if (data.schemaVersion !== LEARNER_DATA_SCHEMA_VERSION) errors.push("This learner data version is not supported.");
  if (!data.library || !Array.isArray(data.library.savedTopicIds) || !Array.isArray(data.library.vocabularyBookmarks) || !data.library.topicNotes || typeof data.library.topicNotes !== "object") {
    errors.push("The learner library is incomplete.");
  }
  if (data.library?.savedTopicIds?.some((item) => typeof item !== "string") || data.library?.vocabularyBookmarks?.some((item) => typeof item !== "string") || Object.values(data.library?.topicNotes ?? {}).some((item) => typeof item !== "string")) {
    errors.push("The learner library contains invalid values.");
  }
  if (data.profile && (!data.profile.goal || typeof data.profile.name !== "string")) errors.push("The profile is invalid.");
  return { data: errors.length ? undefined : data as LearnerDataExport, errors };
}
