import { Languages } from "lucide-react";
import { useSyncExternalStore } from "react";
import type { Locale } from "../domain/types";
import { japaneseReadings } from "../platform/japaneseReadings";

const labels: Record<
  Locale,
  { group: string; furigana: string; romaji: string }
> = {
  EN: {
    group: "Japanese reading support",
    furigana: "Furigana",
    romaji: "Rōmaji",
  },
  PL: {
    group: "Wsparcie czytania po japońsku",
    furigana: "Furigana",
    romaji: "Rōmaji",
  },
  JA: {
    group: "日本語の読み方サポート",
    furigana: "ふりがな",
    romaji: "ローマ字",
  },
};

export function JapaneseReadingControls({ locale }: { locale: Locale }) {
  const preferences = useSyncExternalStore(
    japaneseReadings.subscribe,
    japaneseReadings.getPreferences,
    japaneseReadings.getPreferences,
  );
  const copy = labels[locale];
  const active = preferences.furigana || preferences.romaji;

  return (
    <details className="japanese-reading-controls">
      <summary aria-label={copy.group} title={copy.group}>
        <Languages size={18} aria-hidden="true" />
        {active ? <span aria-hidden="true" /> : null}
      </summary>
      <div className="japanese-reading-menu" role="group" aria-label={copy.group}>
        <strong>{copy.group}</strong>
        <button
          className={preferences.furigana ? "is-active" : ""}
          type="button"
          aria-pressed={preferences.furigana}
          onClick={() => japaneseReadings.setFurigana(!preferences.furigana)}
        >
          {copy.furigana}
        </button>
        <button
          className={preferences.romaji ? "is-active" : ""}
          type="button"
          aria-pressed={preferences.romaji}
          onClick={() => japaneseReadings.setRomaji(!preferences.romaji)}
        >
          {copy.romaji}
        </button>
      </div>
    </details>
  );
}
