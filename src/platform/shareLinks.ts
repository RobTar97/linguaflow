import type { LanguageCode, Level } from "../domain/types";

const ROOM_CODE_PATTERN = /^[A-Z]{3}-[0-9]{3}$/;
const TOPIC_ID_PATTERN = /^[a-z0-9-]{1,80}$/;
const LANGUAGES = new Set<LanguageCode>(["EN", "PL", "JA"]);
const LEVELS = new Set<Level>(["A1", "A2", "B1", "B2", "C1"]);

export interface PracticeLinkState {
  topicId: string;
  targetLanguage: LanguageCode;
  supportLanguage: LanguageCode;
  level: Level;
}

export type ShareIntent =
  | { kind: "join"; code: string }
  | ({ kind: "practice" } & PracticeLinkState);

function currentSearch() {
  return typeof window === "undefined" ? "" : window.location.search;
}

function currentUrl() {
  return typeof window === "undefined"
    ? "https://linguaflow.example/"
    : window.location.href;
}

export function readShareIntent(search = currentSearch()): ShareIntent | null {
  const params = new URLSearchParams(search);
  const room = params.get("room")?.trim().toUpperCase() ?? "";
  if (ROOM_CODE_PATTERN.test(room)) return { kind: "join", code: room };

  const topicId = params.get("practice")?.trim() ?? "";
  const targetLanguage = params.get("target") as LanguageCode | null;
  const supportLanguage = params.get("support") as LanguageCode | null;
  const level = params.get("level") as Level | null;
  if (
    TOPIC_ID_PATTERN.test(topicId) &&
    targetLanguage &&
    supportLanguage &&
    targetLanguage !== supportLanguage &&
    LANGUAGES.has(targetLanguage) &&
    LANGUAGES.has(supportLanguage) &&
    level &&
    LEVELS.has(level)
  ) {
    return {
      kind: "practice",
      topicId,
      targetLanguage,
      supportLanguage,
      level,
    };
  }

  return null;
}

export function buildJoinUrl(code: string, base = currentUrl()) {
  const url = new URL("/app/", base);
  url.searchParams.set("room", code.trim().toUpperCase());
  return url.toString();
}

export function buildPracticeUrl(
  state: PracticeLinkState,
  base = currentUrl(),
) {
  const url = new URL("/app/", base);
  url.searchParams.set("practice", state.topicId);
  url.searchParams.set("target", state.targetLanguage);
  url.searchParams.set("support", state.supportLanguage);
  url.searchParams.set("level", state.level);
  return url.toString();
}
