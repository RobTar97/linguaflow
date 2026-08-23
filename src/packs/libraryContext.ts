import { createContext, useContext } from "react";
import type { TopicCatalog } from "../catalog/createTopicCatalog";
import type { InstalledPackRecord } from "./types";
import type { AcceptedTopicPack } from "./intake";

export interface TopicLibraryValue {
  catalog: TopicCatalog;
  packs: InstalledPackRecord[];
  bundledPackKeys: ReadonlySet<string>;
  ready: boolean;
  install(pack: AcceptedTopicPack): Promise<void>;
  remove(key: string): Promise<void>;
}

export const TopicLibraryContext = createContext<TopicLibraryValue | null>(null);

export function useTopicLibrary() {
  const value = useContext(TopicLibraryContext);
  if (!value) throw new Error("useTopicLibrary must be used inside TopicLibraryProvider");
  return value;
}
