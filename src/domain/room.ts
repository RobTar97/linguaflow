import type {
  GuidedTrainingPlan,
  LanguageCode,
  LearningRoom,
  Level,
  RoomParticipant,
  RoomSessionMode,
  RoomTopicSnapshot,
  Topic,
} from "./types";

export const ROOM_LIFETIME_MS = 8 * 60 * 60 * 1000;
export const ROOM_CODE_PATTERN = /^[A-Z]{3}-[0-9]{3}$/;
export const PARTICIPANT_ID_PATTERN = /^[0-9a-f-]{16,80}$/;
export const MAX_ROOM_PARTICIPANTS = 50;
export const MAX_SHARED_QUESTION_INDEX = 20;
export const MAX_TRAINING_STEPS = 8;

const VALID_LANGUAGES = new Set<LanguageCode>(["EN", "PL", "JA"]);
const VALID_LEVELS = new Set<Level>(["A1", "A2", "B1", "B2", "C1"]);
const VALID_CATEGORIES = new Set<Topic["category"]>([
  "Daily Life", "Work & Career", "Travel & Culture", "People & Relationships",
  "Technology", "Health & Wellness", "Education", "Environment", "Food & Cooking",
  "Arts & Media", "Science & Nature", "Society & Ideas",
]);

export interface BuildLearningRoomInput {
  code: string;
  name: string;
  topic: Topic;
  teacherName: string;
  targetLanguage: LanguageCode;
  supportLanguage: LanguageCode;
  level: Level;
  sessionMode: RoomSessionMode;
  createdAt?: string;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isGuidedTrainingPlan(value: unknown): value is GuidedTrainingPlan {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const plan = value as Partial<GuidedTrainingPlan>;
  return (
    plan.mode === "guided-training" &&
    plan.version === 1 &&
    typeof plan.stepCount === "number" &&
    Number.isInteger(plan.stepCount) &&
    plan.stepCount >= 2 &&
    plan.stepCount <= MAX_TRAINING_STEPS
  );
}

export function maximumRoomCursor(room: Pick<LearningRoom, "sessionMode" | "trainingPlan">) {
  return room.sessionMode === "guided-training" && isGuidedTrainingPlan(room.trainingPlan)
    ? (room.trainingPlan.stepCount - 1) * 2
    : MAX_SHARED_QUESTION_INDEX;
}

export function isValidRoomCursor(
  room: Pick<LearningRoom, "sessionMode" | "trainingPlan">,
  cursor: unknown,
) {
  if (typeof cursor !== "number" || !Number.isInteger(cursor) || cursor < 0) {
    return false;
  }
  const maximum = maximumRoomCursor(room);
  if (cursor > maximum) return false;
  if (room.sessionMode !== "guided-training") return true;

  const stepIndex = Math.floor(cursor / 2);
  const paused = cursor % 2 === 1;
  return !paused || (stepIndex > 0 && stepIndex < room.trainingPlan!.stepCount - 1);
}

function validVocabulary(items: unknown) {
  return (
    Array.isArray(items) &&
    items.length >= 5 &&
    items.length <= 12 &&
    items.every((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return false;
      const word = item as { word?: unknown; translation?: unknown; part?: unknown };
      return (
        typeof word.word === "string" && word.word.length >= 1 && word.word.length <= 120 &&
        typeof word.translation === "string" && word.translation.length >= 1 && word.translation.length <= 160 &&
        typeof word.part === "string" && word.part.length >= 1 && word.part.length <= 40
      );
    })
  );
}

export function isRoomTopicSnapshot(
  value: unknown,
  topicId: string,
  targetLanguage: string | undefined,
  supportLanguage: string | undefined,
): value is RoomTopicSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const snapshot = value as RoomTopicSnapshot;
  const strings = JSON.stringify(snapshot);
  const requiredLanguages = [targetLanguage, supportLanguage].filter(
    (language): language is LanguageCode => VALID_LANGUAGES.has(language as LanguageCode),
  );
  return (
    strings.length <= 32_000 &&
    snapshot.id === topicId &&
    VALID_CATEGORIES.has(snapshot.category) &&
    Boolean(snapshot.title) &&
    (["EN", "PL", "JA"] as const).every((locale) => {
      const title = snapshot.title[locale];
      return typeof title === "string" && title.length >= 1 && title.length <= 160;
    }) &&
    Boolean(snapshot.mainPrompt) &&
    Object.keys(snapshot.mainPrompt).every((language) => VALID_LANGUAGES.has(language as LanguageCode)) &&
    requiredLanguages.every((language) => {
      const prompt = snapshot.mainPrompt[language];
      return typeof prompt === "string" && prompt.length >= 1 && prompt.length <= 500;
    }) &&
    Boolean(snapshot.followUps) &&
    Object.keys(snapshot.followUps).every((language) => VALID_LANGUAGES.has(language as LanguageCode)) &&
    Object.values(snapshot.followUps).every((items) => Array.isArray(items) && items.length >= 5 && items.length <= 12 && items.every((item) => typeof item === "string" && item.length >= 1 && item.length <= 500)) &&
    requiredLanguages.every((language) => {
      const items = snapshot.followUps[language];
      return Array.isArray(items) && items.length >= 5 && items.length <= 12 && items.every((item) => typeof item === "string" && item.length >= 1 && item.length <= 500);
    }) &&
    Boolean(snapshot.vocabulary) &&
    Object.keys(snapshot.vocabulary).every((language) => VALID_LANGUAGES.has(language as LanguageCode)) &&
    Object.values(snapshot.vocabulary).every(validVocabulary) &&
    requiredLanguages.every((language) => validVocabulary(snapshot.vocabulary[language])) &&
    Boolean(snapshot.provenance) &&
    typeof snapshot.provenance.packId === "string" &&
    snapshot.provenance.packId === topicId.split(":", 1)[0] &&
    typeof snapshot.provenance.packVersion === "string" && snapshot.provenance.packVersion.length <= 40 &&
    typeof snapshot.provenance.license === "string" && snapshot.provenance.license.length <= 80 &&
    Array.isArray(snapshot.provenance.authors) &&
    snapshot.provenance.authors.length >= 1 &&
    snapshot.provenance.authors.length <= 20 &&
    snapshot.provenance.authors.every((author) =>
      author &&
      typeof author.displayName === "string" && author.displayName.length >= 1 && author.displayName.length <= 100 &&
      (author.url === undefined || (typeof author.url === "string" && author.url.length <= 500 && isHttpUrl(author.url))),
    )
  );
}

export function buildRoomTopicSnapshot(
  topic: Topic,
  targetLanguage: LanguageCode,
  supportLanguage: LanguageCode,
): RoomTopicSnapshot | undefined {
  if (!topic.id.includes(":") || !topic.provenance) return undefined;
  return {
    id: topic.id,
    category: topic.category,
    title: { ...topic.title },
    mainPrompt: {
      [targetLanguage]: topic.mainPrompt[targetLanguage],
      [supportLanguage]: topic.mainPrompt[supportLanguage],
    },
    followUps: {
      [targetLanguage]: [...topic.followUps[targetLanguage]],
      [supportLanguage]: [...topic.followUps[supportLanguage]],
    },
    vocabulary: {
      [targetLanguage]: topic.vocabulary[targetLanguage].map((item) => ({ ...item })),
      [supportLanguage]: topic.vocabulary[supportLanguage].map((item) => ({ ...item })),
    },
    provenance: {
      packId: topic.provenance.packId,
      packVersion: topic.provenance.packVersion,
      license: topic.provenance.license,
      authors: topic.provenance.authors.map(({ displayName, url }) => ({
        displayName,
        ...(url ? { url } : {}),
      })),
    },
  };
}

export function buildLearningRoom(input: BuildLearningRoomInput): LearningRoom {
  if (
    input.targetLanguage === input.supportLanguage ||
    !input.topic.languages.includes(input.targetLanguage) ||
    !input.topic.languages.includes(input.supportLanguage)
  ) {
    throw new Error("The Topic does not support the selected language direction.");
  }
  const trainingPlan = input.sessionMode === "guided-training"
    ? { mode: "guided-training", version: 1, stepCount: MAX_TRAINING_STEPS } as const
    : undefined;
  const topicSnapshot = buildRoomTopicSnapshot(
    input.topic,
    input.targetLanguage,
    input.supportLanguage,
  );
  return {
    code: input.code,
    name: input.name,
    topicId: input.topic.id,
    ...(topicSnapshot ? { topicSnapshot } : {}),
    teacherName: input.teacherName,
    targetLanguage: input.targetLanguage,
    supportLanguage: input.supportLanguage,
    level: input.level,
    sessionMode: input.sessionMode,
    ...(trainingPlan ? { trainingPlan } : {}),
    questionIndex: 0,
    participants: [],
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

function cleanRoomTopicSnapshot(snapshot: RoomTopicSnapshot): RoomTopicSnapshot {
  return {
    id: snapshot.id,
    category: snapshot.category,
    title: { EN: snapshot.title.EN, PL: snapshot.title.PL, JA: snapshot.title.JA },
    mainPrompt: { ...snapshot.mainPrompt },
    followUps: Object.fromEntries(Object.entries(snapshot.followUps).map(([locale, items]) => [locale, [...items]])),
    vocabulary: Object.fromEntries(Object.entries(snapshot.vocabulary).map(([locale, items]) => [locale, items.map(({ word, translation, part }) => ({ word, translation, part }))])),
    provenance: {
      packId: snapshot.provenance.packId,
      packVersion: snapshot.provenance.packVersion,
      license: snapshot.provenance.license,
      authors: snapshot.provenance.authors.map(({ displayName, url }) => ({ displayName, ...(url ? { url } : {}) })),
    },
  };
}

export function normalizeRoomForCreation(value: unknown): LearningRoom | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const room = value as Partial<LearningRoom>;
  const validMode =
    (room.sessionMode === undefined && room.trainingPlan === undefined) ||
    (room.sessionMode === "shared-question" && room.trainingPlan === undefined) ||
    (room.sessionMode === "guided-training" && isGuidedTrainingPlan(room.trainingPlan));
  if (
    typeof room.code !== "string" || !ROOM_CODE_PATTERN.test(room.code) ||
    typeof room.name !== "string" || room.name.trim().length < 1 || room.name.trim().length > 80 ||
    typeof room.topicId !== "string" || !/^[a-z0-9-]+(?::[a-z0-9-]+)?$/.test(room.topicId) || room.topicId.length > 121 ||
    (room.topicId.includes(":")
      ? !isRoomTopicSnapshot(room.topicSnapshot, room.topicId, room.targetLanguage, room.supportLanguage)
      : room.topicSnapshot !== undefined) ||
    typeof room.teacherName !== "string" || room.teacherName.trim().length < 1 || room.teacherName.trim().length > 50 ||
    typeof room.targetLanguage !== "string" || !VALID_LANGUAGES.has(room.targetLanguage) ||
    typeof room.supportLanguage !== "string" || !VALID_LANGUAGES.has(room.supportLanguage) ||
    room.targetLanguage === room.supportLanguage ||
    typeof room.level !== "string" || !VALID_LEVELS.has(room.level) ||
    !isValidRoomCursor(room, room.questionIndex) ||
    typeof room.createdAt !== "string" || !Number.isFinite(Date.parse(room.createdAt)) ||
    !Array.isArray(room.participants) ||
    !validMode
  ) {
    return null;
  }

  const normalized: LearningRoom = {
    code: room.code,
    name: room.name.trim(),
    topicId: room.topicId,
    ...(room.topicSnapshot ? { topicSnapshot: cleanRoomTopicSnapshot(room.topicSnapshot) } : {}),
    teacherName: room.teacherName.trim(),
    targetLanguage: room.targetLanguage,
    supportLanguage: room.supportLanguage,
    level: room.level,
    questionIndex: room.questionIndex as number,
    participants: [],
    createdAt: room.createdAt,
  };
  if (room.sessionMode) normalized.sessionMode = room.sessionMode;
  if (room.trainingPlan && isGuidedTrainingPlan(room.trainingPlan)) {
    normalized.trainingPlan = { ...room.trainingPlan };
  }
  return normalized;
}

export function normalizeRoomParticipant(value: unknown): RoomParticipant | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const participant = value as Partial<RoomParticipant>;
  if (
    typeof participant.id !== "string" || !PARTICIPANT_ID_PATTERN.test(participant.id) ||
    typeof participant.name !== "string" || !participant.name.trim() || participant.name.trim().length > 50 ||
    !["ready", "speaking", "listening"].includes(String(participant.status))
  ) return null;
  return { id: participant.id, name: participant.name.trim(), status: participant.status! };
}

export function normalizeRoomSnapshot(value: unknown): LearningRoom | null {
  const room = normalizeRoomForCreation(value);
  if (!room || !value || typeof value !== "object" || Array.isArray(value)) return null;
  const participants = (value as Partial<LearningRoom>).participants;
  if (!Array.isArray(participants) || participants.length > MAX_ROOM_PARTICIPANTS) return null;
  const normalized = participants.map(normalizeRoomParticipant);
  if (normalized.some((participant) => !participant)) return null;
  const ids = normalized.map((participant) => participant!.id);
  if (new Set(ids).size !== ids.length) return null;
  return { ...room, participants: normalized as RoomParticipant[] };
}
