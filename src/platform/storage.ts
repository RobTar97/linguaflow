export interface KeyValueStorage {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

export const browserStorage: KeyValueStorage = {
  get<T>(key: string, fallback: T): T {
    try {
      const value = window.localStorage.getItem(key);
      return value ? (JSON.parse(value) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T) {
    window.localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key: string) {
    window.localStorage.removeItem(key);
  },
};
