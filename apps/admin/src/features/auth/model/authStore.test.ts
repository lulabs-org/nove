import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from './types';

const apiMocks = vi.hoisted(() => ({
  login: vi.fn(),
  getMe: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../api/api', () => ({
  login: apiMocks.login,
  getMe: apiMocks.getMe,
  logout: apiMocks.logout,
}));

import { authService } from '../api/service';
import { AUTH_STORAGE_KEY, syncAuthFromStorageEvent, useAuthStore } from './authStore';

const mockUser: User = {
  id: 'user-1',
  email: 'test@proflu.cn',
  username: 'testuser',
  name: '测试用户',
  roles: ['ADMIN'],
  permissions: ['user:read', 'user:write'],
  emailVerified: true,
  phoneVerified: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  active: true,
};

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      loading: false,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialize', () => {
    it('sets isAuthenticated=false and loading=false when no token is present', async () => {
      useAuthStore.setState({ loading: true });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(apiMocks.getMe).not.toHaveBeenCalled();
    });

    it('fetches current user and sets authenticated when token is present', async () => {
      authService.setToken('valid-token');
      apiMocks.getMe.mockResolvedValueOnce(mockUser);
      useAuthStore.setState({ loading: true });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
    });

    it('clears token and marks unauthenticated if getMe fails on initialize', async () => {
      authService.setToken('expired-token');
      apiMocks.getMe.mockRejectedValueOnce(new Error('Unauthorized'));
      useAuthStore.setState({ loading: true });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(authService.getToken()).toBeNull();
    });
  });

  describe('login', () => {
    it('sets token and fetches user on successful login', async () => {
      apiMocks.login.mockResolvedValueOnce({ accessToken: 'new-token' });
      apiMocks.getMe.mockResolvedValueOnce(mockUser);

      await useAuthStore.getState().login({
        type: 'email_password',
        email: 'test@proflu.cn',
        password: 'Password123',
      });

      expect(authService.getToken()).toBe('new-token');
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
    });

    it('clears auth and re-throws error if getMe fails after login', async () => {
      apiMocks.login.mockResolvedValueOnce({ accessToken: 'temp-token' });
      apiMocks.getMe.mockRejectedValueOnce(new Error('Profile fetch failed'));

      await expect(
        useAuthStore.getState().login({
          type: 'email_password',
          email: 'test@proflu.cn',
          password: 'Password123',
        })
      ).rejects.toThrow('Profile fetch failed');

      expect(authService.getToken()).toBeNull();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('calls logout API and clears store & token on success', async () => {
      authService.setToken('active-token');
      useAuthStore.setState({ isAuthenticated: true, user: mockUser });
      apiMocks.logout.mockResolvedValueOnce(undefined);

      await useAuthStore.getState().logout();

      expect(apiMocks.logout).toHaveBeenCalled();
      expect(authService.getToken()).toBeNull();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('still clears local auth when logout API throws an error', async () => {
      authService.setToken('active-token');
      useAuthStore.setState({ isAuthenticated: true, user: mockUser });
      apiMocks.logout.mockRejectedValueOnce(new Error('Network error'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await useAuthStore.getState().logout();

      expect(consoleError).toHaveBeenCalledWith('Logout error:', expect.any(Error));
      consoleError.mockRestore();
      expect(authService.getToken()).toBeNull();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('setUser', () => {
    it('updates current user in store', () => {
      useAuthStore.setState({ isAuthenticated: true, user: mockUser });
      const updatedUser = { ...mockUser, name: '已更新用户' };

      useAuthStore.getState().setUser(updatedUser);

      expect(useAuthStore.getState().user).toEqual(updatedUser);
    });

    it('allows setting user to null', () => {
      useAuthStore.setState({ isAuthenticated: true, user: mockUser });

      useAuthStore.getState().setUser(null);

      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('clearAuth', () => {
    it('clears token and resets store state', () => {
      authService.setToken('sample-token');
      useAuthStore.setState({ isAuthenticated: true, user: mockUser });

      useAuthStore.getState().clearAuth();

      expect(authService.getToken()).toBeNull();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('responds to auth-unauthorized window event', () => {
      authService.setToken('expired-token');
      useAuthStore.setState({ isAuthenticated: true, user: mockUser });

      window.dispatchEvent(new Event('auth-unauthorized'));

      expect(authService.getToken()).toBeNull();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('checkPermission', () => {
    it('delegates to canAccessPermission using the store user', () => {
      useAuthStore.setState({ user: mockUser });

      expect(useAuthStore.getState().checkPermission('user:read')).toBe(true);
      expect(useAuthStore.getState().checkPermission('admin:secret')).toBe(false);
    });
  });

  describe('cross-tab sync', () => {
    const otherUser: User = { ...mockUser, id: 'user-2', name: '另一个用户' };

    const storageEvent = (init: StorageEventInit) =>
      new StorageEvent('storage', { storageArea: localStorage, ...init });

    it('adopts the account another tab signed in with', async () => {
      useAuthStore.setState({ isAuthenticated: true, user: mockUser });
      const persisted = JSON.stringify({
        state: { isAuthenticated: true, user: otherUser },
        version: 0,
      });
      localStorage.setItem(AUTH_STORAGE_KEY, persisted);

      window.dispatchEvent(storageEvent({ key: AUTH_STORAGE_KEY, newValue: persisted }));

      await vi.waitFor(() => expect(useAuthStore.getState().user).toEqual(otherUser));
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('logs out when another tab logs out', async () => {
      useAuthStore.setState({ isAuthenticated: true, user: mockUser });
      const persisted = JSON.stringify({
        state: { isAuthenticated: false, user: null },
        version: 0,
      });
      localStorage.setItem(AUTH_STORAGE_KEY, persisted);

      window.dispatchEvent(storageEvent({ key: AUTH_STORAGE_KEY, newValue: persisted }));

      await vi.waitFor(() => expect(useAuthStore.getState().user).toBeNull());
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it.each([
      ['the auth entry is removed', { key: AUTH_STORAGE_KEY, newValue: null }],
      ['storage is cleared', { key: null }],
    ])('logs out when %s in another tab', (_label, init) => {
      useAuthStore.setState({ isAuthenticated: true, user: mockUser });

      syncAuthFromStorageEvent(storageEvent(init));

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('ignores token refreshes and other keys', () => {
      useAuthStore.setState({ isAuthenticated: true, user: mockUser });

      syncAuthFromStorageEvent(storageEvent({ key: 'auth_token', newValue: 'refreshed-token' }));

      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
  });
});
