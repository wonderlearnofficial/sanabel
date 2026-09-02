type StorageAccess = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type SafeStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => boolean;
  removeItem: (key: string) => boolean;
  getJson: <T>(
    key: string,
    fallback: T,
    validate?: (value: unknown) => value is T,
  ) => T;
};

export const createSafeStorage = (
  resolveStorage: () => StorageAccess | null,
): SafeStorage => {
  const withStorage = <T>(operation: (storage: StorageAccess) => T, fallback: T): T => {
    try {
      const storage = resolveStorage();
      return storage ? operation(storage) : fallback;
    } catch {
      return fallback;
    }
  };

  const api: SafeStorage = {
    getItem: (key) => withStorage((storage) => storage.getItem(key), null),
    setItem: (key, value) =>
      withStorage((storage) => {
        storage.setItem(key, value);
        return true;
      }, false),
    removeItem: (key) =>
      withStorage((storage) => {
        storage.removeItem(key);
        return true;
      }, false),
    getJson: <T>(
      key: string,
      fallback: T,
      validate?: (value: unknown) => value is T,
    ): T => {
      const raw = api.getItem(key);
      if (raw === null) return fallback;

      try {
        const parsed: unknown = JSON.parse(raw);
        if (validate && !validate(parsed)) {
          api.removeItem(key);
          return fallback;
        }
        return parsed as T;
      } catch {
        // Clear only the corrupted value. Other cached preferences and the
        // authenticated session remain intact.
        api.removeItem(key);
        return fallback;
      }
    },
  };

  return api;
};

export const localStore = createSafeStorage(() =>
  typeof window === "undefined" ? null : window.localStorage,
);

export const sessionStore = createSafeStorage(() =>
  typeof window === "undefined" ? null : window.sessionStorage,
);
