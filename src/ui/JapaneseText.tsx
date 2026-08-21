import { useEffect, useState, useSyncExternalStore } from "react";
import type { Locale } from "../domain/types";
import {
  japaneseReadings,
  type JapaneseReadingEntry,
} from "../platform/japaneseReadings";

export function JapaneseText({
  text,
  language,
  className,
}: {
  text: string;
  language: Locale;
  className?: string;
}) {
  const preferences = useSyncExternalStore(
    japaneseReadings.subscribe,
    japaneseReadings.getPreferences,
    japaneseReadings.getPreferences,
  );
  const [loaded, setLoaded] = useState<{
    text: string;
    entry?: JapaneseReadingEntry;
  }>();
  const needsReadings =
    language === "JA" && (preferences.furigana || preferences.romaji);

  useEffect(() => {
    let active = true;
    if (!needsReadings) return;
    void japaneseReadings
      .loadEntry(text)
      .then((next) => {
        if (active) setLoaded({ text, entry: next });
      })
      .catch(() => {
        if (active) setLoaded({ text });
      });
    return () => {
      active = false;
    };
  }, [needsReadings, text]);

  const entry = loaded?.text === text ? loaded.entry : undefined;

  if (language !== "JA") return <>{text}</>;

  return (
    <span className={`japanese-reading ${className ?? ""}`} lang="ja">
      <span className="japanese-reading-primary">
        {preferences.furigana && entry
          ? entry.segments.map((segment, index) =>
              segment.reading ? (
                <ruby key={`${segment.text}-${index}`}>
                  {segment.text}
                  <rp>（</rp>
                  <rt>{segment.reading}</rt>
                  <rp>）</rp>
                </ruby>
              ) : (
                segment.text
              ),
            )
          : text}
      </span>
      {preferences.romaji && entry?.romaji ? (
        <span className="japanese-romaji" aria-hidden="true" lang="en">
          {entry.romaji}
        </span>
      ) : null}
    </span>
  );
}
