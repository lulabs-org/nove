import { describe, expect, it } from 'vitest';
import { getUserIdentityDisplay } from './userDisplay';

describe('getUserIdentityDisplay', () => {
  it('does not repeat a username used as the primary label', () => {
    expect(
      getUserIdentityDisplay({ id: 'user-1', username: '13289389999', profile: null })
    ).toEqual({ primary: '13289389999', secondary: null });
  });

  it('keeps a distinct username below the display name', () => {
    expect(
      getUserIdentityDisplay({
        id: 'user-1',
        username: 'yangshiming',
        profile: { displayName: '杨仕明' },
      })
    ).toEqual({ primary: '杨仕明', secondary: '@yangshiming' });
  });

  it('uses the flat display name returned by the list endpoint', () => {
    expect(
      getUserIdentityDisplay({
        id: 'user-1',
        username: 'yangshiming',
        displayName: '杨仕明',
      })
    ).toEqual({ primary: '杨仕明', secondary: '@yangshiming' });
  });

  it('uses the user id as secondary context when there is no username', () => {
    expect(
      getUserIdentityDisplay({
        id: 'user-1',
        username: null,
        profile: { displayName: '杨仕明' },
      })
    ).toEqual({ primary: '杨仕明', secondary: 'user-1' });
  });
});
