export const SIDEBAR_OPEN_KEYS_STORAGE_KEY = 'nove-admin:sidebar-open-keys';

export function mergeOpenKeys(storedKeys: string[], activeParentKeys: string[]): string[] {
  return Array.from(new Set([...storedKeys, ...activeParentKeys]));
}

export function getStoredOpenKeys(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const storedValue = window.localStorage.getItem(SIDEBAR_OPEN_KEYS_STORAGE_KEY);
    if (!storedValue) return [];

    const storedKeys: unknown = JSON.parse(storedValue);
    if (!Array.isArray(storedKeys) || !storedKeys.every((key) => typeof key === 'string')) {
      return [];
    }

    return storedKeys;
  } catch {
    return [];
  }
}

export function persistOpenKeys(openKeys: string[]): void {
  try {
    window.localStorage.setItem(SIDEBAR_OPEN_KEYS_STORAGE_KEY, JSON.stringify(openKeys));
  } catch {
    // Keep the current session working when browser storage is unavailable.
  }
}
