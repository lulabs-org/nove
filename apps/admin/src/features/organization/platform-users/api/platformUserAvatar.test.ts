import { describe, expect, it } from 'vitest';
import { normalizePlatformUserAvatar } from './platformUserAvatar';

describe('normalizePlatformUserAvatar', () => {
  it('preserves image URLs and other response fields', () => {
    const user = { id: 'platform-user', avatarUrl: 'https://example.com/avatar.png' };
    expect(normalizePlatformUserAvatar(user)).toEqual(user);
  });

  it.each([null, undefined])('preserves an absent avatar (%s)', (avatarUrl) => {
    expect(normalizePlatformUserAvatar({ avatarUrl }).avatarUrl).toBe(avatarUrl);
  });

  it('does not pass object-shaped schema values to an image source', () => {
    expect(normalizePlatformUserAvatar({ avatarUrl: { unexpected: true } }).avatarUrl).toBeNull();
  });
});
