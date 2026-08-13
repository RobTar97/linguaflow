import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { InstalledPackRecord } from "./types";

interface PackDatabase extends DBSchema {
  packs: { key: string; value: InstalledPackRecord };
}

export interface TopicPackRepository {
  all(): Promise<InstalledPackRecord[]>;
  replace(pack: InstalledPackRecord): Promise<void>;
  remove(key: string): Promise<void>;
}

class IndexedDbTopicPackRepository implements TopicPackRepository {
  private database: Promise<IDBPDatabase<PackDatabase>>;

  constructor() {
    this.database = openDB<PackDatabase>("linguaflow-topic-packs", 1, {
      upgrade(database) { database.createObjectStore("packs", { keyPath: "key" }); },
    });
  }

  async all() { return (await this.database).getAll("packs"); }
  async replace(pack: InstalledPackRecord) {
    const database = await this.database;
    const transaction = database.transaction("packs", "readwrite");
    const existing = await transaction.store.getAll();
    await Promise.all(
      existing
        .filter((item) => item.manifest.id === pack.manifest.id)
        .map((item) => transaction.store.delete(item.key)),
    );
    await transaction.store.put(pack);
    await transaction.done;
  }
  async remove(key: string) { await (await this.database).delete("packs", key); }
}

export const topicPackRepository: TopicPackRepository = new IndexedDbTopicPackRepository();
