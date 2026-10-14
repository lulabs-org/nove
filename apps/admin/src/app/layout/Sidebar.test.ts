import { beforeEach, describe, expect, it } from 'vitest';
import { getStoredOpenKeys, mergeOpenKeys, SIDEBAR_OPEN_KEYS_STORAGE_KEY } from './sidebarOpenKeys';

describe('Sidebar open menu persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('restores manually opened menus and keeps the active parent open', () => {
    window.localStorage.setItem(SIDEBAR_OPEN_KEYS_STORAGE_KEY, JSON.stringify(['/transactions']));

    expect(mergeOpenKeys(getStoredOpenKeys(), ['/governance'])).toEqual([
      '/transactions',
      '/governance',
    ]);
  });

  it('falls back to the active parent when stored state is invalid', () => {
    window.localStorage.setItem(SIDEBAR_OPEN_KEYS_STORAGE_KEY, '{invalid json');

    expect(mergeOpenKeys(getStoredOpenKeys(), ['/governance'])).toEqual(['/governance']);
  });
});
