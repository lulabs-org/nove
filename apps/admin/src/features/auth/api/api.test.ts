import { afterEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../model/types';

const authApiMock = vi.hoisted(() => ({
  authControllerGetMe: vi.fn(),
  authControllerLogin: vi.fn(),
  authControllerLogout: vi.fn(),
}));

vi.mock('../../../shared/lib/api/orval/business/auth', () => authApiMock);

import { login, logout, normalizeAuthUser } from './api';

const baseUser: Omit<User, 'permissions'> = {
  id: 'user-id',
  email: 'yangshiming@proflu.cn',
  countryCode: '+86',
  phone: '181****2522',
  emailVerified: false,
  phoneVerified: false,
  createdAt: '2026-01-03T23:41:54.850Z',
  lastLoginAt: '2026-06-13T22:28:29.225Z',
  username: '杨仕明',
  name: '杨仕明',
  roles: ['SUPER_ADMIN'],
  active: true,
};

describe('auth api helpers', () => {
  afterEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('adds a stable browser device identity to login requests', async () => {
    vi.spyOn(window.crypto, 'randomUUID').mockReturnValue('11111111-1111-4111-8111-111111111111');
    authApiMock.authControllerLogin.mockResolvedValue({
      accessToken: 'token',
      expiresIn: 900,
      user: { ...baseUser, permissions: [] },
    });

    await login({
      type: 'email_password',
      email: 'yangshiming@proflu.cn',
      password: 'Password1',
      clientType: 'web',
    });

    expect(authApiMock.authControllerLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: '11111111-1111-4111-8111-111111111111',
        deviceInfo: expect.stringContaining('Web ·'),
      })
    );
    expect(window.localStorage.getItem('nove-device-id')).toBe(
      '11111111-1111-4111-8111-111111111111'
    );
  });

  it('maps backend perm field to permissions', () => {
    const user = normalizeAuthUser({
      ...baseUser,
      perm: ['user:read', 'api_key:read'],
    });

    expect(user.permissions).toEqual(['user:read', 'api_key:read']);
  });

  it('defaults permissions to an empty list when perm is missing', () => {
    const user = normalizeAuthUser({
      ...baseUser,
    });

    expect(user.permissions).toEqual([]);
  });

  it('marks logout requests as web clients', async () => {
    authApiMock.authControllerLogout.mockResolvedValue(undefined);

    await logout();

    expect(authApiMock.authControllerLogout).toHaveBeenCalledWith({
      clientType: 'web',
    });
  });
});
