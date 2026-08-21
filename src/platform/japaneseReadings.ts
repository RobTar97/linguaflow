import { browserStorage } from "./storage";

export interface JapaneseReadingPreferences {
  furigana: boolean;
  romaji: boolean;
}

export interface JapaneseReadingEntry {
  segments: Array<{ text: string; reading?: string }>;
  romaji: string;
}

const STORAGE_KEY = "linguaflow-japanese-reading-preferences";
const listeners = new Set<() => void>();
let cachedPreferences: JapaneseReadingPreferences | undefined;
let readingsPromise: Promise<Record<string, JapaneseReadingEntry>> | undefined;

function readPreferences() {
  if (!cachedPreferences) {
    cachedPreferences =
      typeof window === "undefined"
        ? { furigana: false, romaji: false }
        : browserStorage.get<JapaneseReadingPreferences>(STORAGE_KEY, {
            furigana: false,
            romaji: false,
          });
  }
  return cachedPreferences;
}

function updatePreferences(next: JapaneseReadingPreferences) {
  cachedPreferences = next;
  if (typeof window !== "undefined") {
    browserStorage.set(STORAGE_KEY, next);
  }
  listeners.forEach((listener) => listener());
}

async function loadEntry(text: string) {
  if (typeof window === "undefined") return undefined;
  readingsPromise ??= fetch("/data/japanese-readings.json", {
    cache: "force-cache",
  }).then(async (response) => {
    if (!response.ok) throw new Error("Japanese reading data is unavailable.");
    return (await response.json()) as Record<string, JapaneseReadingEntry>;
  });
  return (await readingsPromise)[text];
}

export const japaneseReadings = {
  getPreferences: readPreferences,
  setFurigana(enabled: boolean) {
    updatePreferences({ ...readPreferences(), furigana: enabled });
  },
  setRomaji(enabled: boolean) {
    updatePreferences({ ...readPreferences(), romaji: enabled });
  },
  loadEntry,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
