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
  | "Environment";

export type LocalizedText = Record<Locale, string>;

export interface VocabularyItem {
  word: string;
  translation: string;
  part: string;
}

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
  atlas?: 1 | 2;
}

export type WorkspaceRole = "learner" | "teacher" | "student";

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
  teacherName: string;
  targetLanguage: LanguageCode;
  supportLanguage: LanguageCode;
  level: Level;
  questionIndex: number;
  participants: RoomParticipant[];
  createdAt: string;
}
