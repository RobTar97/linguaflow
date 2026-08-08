import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createTopicCatalog } from "../catalog/createTopicCatalog";
import { installedRecord, topicsFromInstalledPack } from "./normalize";
import { topicPackRepository } from "./repository";
import type { InstalledPackRecord } from "./types";
import { TopicLibraryContext, type TopicLibraryValue } from "./libraryContext";

export function TopicLibraryProvider({ children }: { children: ReactNode }) {
  const [packs, setPacks] = useState<InstalledPackRecord[]>([]);
  const [bundledPacks, setBundledPacks] = useState<InstalledPackRecord[]>([]);
  const [coreTopics, setCoreTopics] = useState<readonly import("../domain/types").Topic[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    setPacks(await topicPackRepository.all());
    setReady(true);
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([
      topicPackRepository.all(),
      import("../catalog/topicCatalog"),
      import("./bundled"),
    ]).then(async ([records, core, bundled]) => {
      const approved = await Promise.all(bundled.bundledPackUrls.map(async (url) => {
        const [{ readTopicPackArchive }, response] = await Promise.all([import("./archive"), fetch(url)]);
        const result = response.ok ? readTopicPackArchive(new Uint8Array(await response.arrayBuffer())) : null;
        return result?.pack ? installedRecord(result.pack) : null;
      }));
      if (active) {
        setPacks(records);
        setBundledPacks(approved.filter((pack): pack is InstalledPackRecord => Boolean(pack)));
        setCoreTopics(core.topicCatalog.all());
        setReady(true);
      }
    });
    return () => { active = false; };
  }, []);

  const catalog = useMemo(() => createTopicCatalog([
    ...coreTopics,
    ...bundledPacks.flatMap(topicsFromInstalledPack),
    ...packs.flatMap(topicsFromInstalledPack),
  ]), [bundledPacks, coreTopics, packs]);

  const value = useMemo<TopicLibraryValue>(() => ({
    catalog,
    packs: [...bundledPacks, ...packs],
    ready,
    async install(pack) { await topicPackRepository.put(installedRecord(pack)); await refresh(); },
    async remove(key) { await topicPackRepository.remove(key); await refresh(); },
  }), [bundledPacks, catalog, packs, ready, refresh]);

  if (!ready) return <main className="route-loading" role="status"><span aria-hidden="true" />LinguaFlow</main>;
  return <TopicLibraryContext.Provider value={value}>{children}</TopicLibraryContext.Provider>;
}
