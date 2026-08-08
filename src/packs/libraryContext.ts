import { createContext, useContext } from "react";
import type { TopicCatalog } from "../catalog/createTopicCatalog";
import type { InstalledPackRecord, TopicPackDocument } from "./types";

export interface TopicLibraryValue {
  catalog: TopicCatalog;
  packs: InstalledPackRecord[];
  ready: boolean;
  install(pack: TopicPackDocument): Promise<void>;
  remove(key: string): Promise<void>;
}

export const TopicLibraryContext = createContext<TopicLibraryValue | null>(null);

export function useTopicLibrary() {
  const value = useContext(TopicLibraryContext);
  if (!value) throw new Error("useTopicLibrary must be used inside TopicLibraryProvider");
  return value;
}
