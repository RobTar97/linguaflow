import type { LanguageCode, VocabularyItem } from "./types";

export interface ConversationContent {
  mainPrompt: Partial<Record<LanguageCode, string>>;
  followUps: Partial<Record<LanguageCode, string[]>>;
  vocabulary: Partial<Record<LanguageCode, VocabularyItem[]>>;
}

export interface ConversationQuestion {
  target: string;
  support?: string;
}

export interface ConversationSessionView {
  index: number;
  total: number;
  question: ConversationQuestion;
  isFirst: boolean;
  isLast: boolean;
  progress: number;
}

export interface ConversationSession {
  readonly questions: readonly ConversationQuestion[];
  readonly vocabulary: readonly VocabularyItem[];
  view(index: number): ConversationSessionView;
  next(index: number): number;
  previous(index: number): number;
}

function boundedIndex(index: number, total: number) {
  return Math.min(Math.max(Number.isFinite(index) ? Math.trunc(index) : 0, 0), Math.max(0, total - 1));
}

export function createConversationSession(
  content: ConversationContent,
  targetLanguage: LanguageCode,
  supportLanguage: LanguageCode,
): ConversationSession {
  if (targetLanguage === supportLanguage) {
    throw new Error("A Conversation session requires different target and support languages.");
  }
  const targetPrompt = content.mainPrompt[targetLanguage];
  if (!targetPrompt) {
    throw new Error(`The Topic does not contain a ${targetLanguage} prompt.`);
  }
  const targetQuestions = [targetPrompt, ...(content.followUps[targetLanguage] ?? [])];
  const supportPrompt = content.mainPrompt[supportLanguage];
  const supportQuestions = supportPrompt
    ? [supportPrompt, ...(content.followUps[supportLanguage] ?? [])]
    : [];
  const questions = targetQuestions.map((target, index) => ({
    target,
    ...(supportQuestions[index] ? { support: supportQuestions[index] } : {}),
  }));

  return {
    questions,
    vocabulary: content.vocabulary[targetLanguage] ?? [],
    view(index) {
      const safeIndex = boundedIndex(index, questions.length);
      return {
        index: safeIndex,
        total: questions.length,
        question: questions[safeIndex],
        isFirst: safeIndex === 0,
        isLast: safeIndex === questions.length - 1,
        progress: (safeIndex + 1) / questions.length,
      };
    },
    next(index) {
      return boundedIndex(index + 1, questions.length);
    },
    previous(index) {
      return boundedIndex(index - 1, questions.length);
    },
  };
}
