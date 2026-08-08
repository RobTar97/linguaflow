export type Locale = "EN" | "PL" | "JA";
export type LanguageCode = Locale;
export type Level = "A1" | "A2" | "B1" | "B2" | "C1";
export type Category =
  | "Daily Life"
  | "Work & Career"
  | "Travel & Culture"
  | "People & Relationships"
  | "Technology"
  | "Health & Wellness"
  | "Education"
  | "Environment"
  | "Food & Cooking"
  | "Arts & Media"
  | "Science & Nature"
  | "Society & Ideas";

export type LocalizedText = Record<Locale, string>;

export interface VocabularyItem {
  word: string;
  translation: string;
  part: string;
}

export interface ContributorIdentity {
  displayName: string;
  url?: string;
}

export type ReviewKind =
  | "language"
  | "cefr"
  | "facilitation"
  | "accessibility";

export interface ReviewAssertion {
  kind: ReviewKind;
  locale?: Locale;
  reviewer: ContributorIdentity;
  reviewedAt: string;
  notes?: string;
}

export interface TopicProvenance {
  packId: string;
  packVersion: string;
  license: string;
  authors: ContributorIdentity[];
  sourceUrl?: string;
  sourceRevision?: string;
  reviews: ReviewAssertion[];
}

export interface FacilitationGuide {
  durationMinutes: { min: number; max: number };
  groupSize: { min: number; max: number };
  objectives: Record<Locale, string[]>;
  preparation: LocalizedText;
  warmUp: LocalizedText;
  tips: Record<Locale, string[]>;
  easier: LocalizedText;
  harder: LocalizedText;
  sensitiveContent?: LocalizedText;
}

export type TopicArtwork =
  | { kind: "atlas"; index: number; atlas?: 1 | 2 | 3 }
  | { kind: "asset"; path: string; objectUrl?: string };

export interface Topic {
  id: string;
  level: Level;
  languages: [Locale, Locale];
  category: Category;
  title: LocalizedText;
  description: LocalizedText;
  mainPrompt: LocalizedText;
  followUps: Record<Locale, string[]>;
  vocabulary: Record<Locale, VocabularyItem[]>;
  artIndex: number;
  atlas?: 1 | 2 | 3;
  artwork?: TopicArtwork;
  facilitation?: FacilitationGuide;
  provenance?: TopicProvenance;
}

export type WorkspaceRole = "learner" | "teacher" | "student";

export type RoomSessionMode = "shared-question" | "guided-training";

export interface GuidedTrainingPlan {
  mode: "guided-training";
  version: 1;
  stepCount: number;
}

export interface LearningGoal {
  interfaceLocale: Locale;
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  level: Level;
}

export interface WorkspaceProfile {
  name: string;
  role: WorkspaceRole;
  goal: LearningGoal;
  setupComplete: boolean;
}

export interface RoomParticipant {
  id: string;
  name: string;
  status: "ready" | "speaking" | "listening";
}

export interface LearningRoom {
  code: string;
  name: string;
  topicId: string;
  topicSnapshot?: RoomTopicSnapshot;
  teacherName: string;
  targetLanguage: LanguageCode;
  supportLanguage: LanguageCode;
  level: Level;
  /**
   * Optional for rooms created before guided training was introduced.
   * The room service treats missing mode metadata as shared-question mode.
   */
  sessionMode?: RoomSessionMode;
  trainingPlan?: GuidedTrainingPlan;
  questionIndex: number;
  participants: RoomParticipant[];
  createdAt: string;
}

export interface RoomTopicSnapshot {
  id: string;
  category: Category;
  title: LocalizedText;
  mainPrompt: Partial<Record<LanguageCode, string>>;
  followUps: Partial<Record<LanguageCode, string[]>>;
  vocabulary: Partial<Record<LanguageCode, VocabularyItem[]>>;
  provenance: Pick<TopicProvenance, "packId" | "packVersion" | "license" | "authors">;
}
