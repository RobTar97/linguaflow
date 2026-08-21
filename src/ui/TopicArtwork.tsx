import type { CSSProperties } from "react";
import type { Topic } from "../domain/types";

export function TopicArtwork({ topic, locale, large = false }: { topic: Topic; locale: "EN" | "PL" | "JA"; large?: boolean }) {
  if (topic.artwork?.kind === "asset" && topic.artwork.objectUrl) {
    return (
      <img
        className={`topic-art pack-topic-art ${large ? "is-large" : ""}`}
        src={topic.artwork.objectUrl}
        alt={topic.title[locale]}
        loading="lazy"
        decoding="async"
      />
    );
  }
  const index = topic.artwork?.kind === "atlas" ? topic.artwork.index : topic.artIndex;
  const atlas = topic.artwork?.kind === "atlas" ? topic.artwork.atlas : topic.atlas;
  return <span
    className={`topic-art art-${index} ${large ? "is-large" : ""}`}
    data-atlas={atlas ?? 1}
    role="img"
    aria-label={topic.title[locale]}
    style={{ "--art-x": `${(index % 4) * 33.333}%`, "--art-y": `${Math.floor(index / 4) * 50}%` } as CSSProperties}
  />;
}
