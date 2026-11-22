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
import { useAuthStore } from './authStore';
import { removeSession, saveSession } from './session';

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
      expect(apiMocks.getMe).toHaveBeenCalledWith({
        headers: { Authorization: 'Bearer new-token' },
      });
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
    });

    it('commits nothing and re-throws error if getMe fails after login', async () => {
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

    it('preserves auth when logout API throws an error', async () => {
      authService.setToken('active-token');
      useAuthStore.setState({ isAuthenticated: true, user: mockUser });
      apiMocks.logout.mockRejectedValueOnce(new Error('Network error'));

      await useAuthStore.getState().logout();

      expect(authService.getToken()).toBe('active-token');
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
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

    it('responds to a session ended by the kernel', () => {
      authService.setToken('expired-token');
      useAuthStore.setState({ isAuthenticated: true, user: mockUser });

      removeSession();

      expect(authService.getToken()).toBeNull();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('session races', () => {
    const otherUser: User = { ...mockUser, id: 'user-2', name: '其他用户' };

    function deferred<T>() {
      let resolve!: (value: T) => void;
      const promise = new Promise<T>((r) => {
        resolve = r;
      });
      return { promise, resolve };
    }

    it('does not write back the old user when initialize finishes after an account switch', async () => {
      authService.setToken('token-a');
      const me = deferred<User>();
      apiMocks.getMe.mockReturnValueOnce(me.promise);
      useAuthStore.setState({ loading: true });

      const pending = useAuthStore.getState().initialize();
      saveSession('token-b', otherUser);
      me.resolve(mockUser);
      await pending;

      const state = useAuthStore.getState();
      expect(state.user).toEqual(otherUser);
      expect(state.loading).toBe(false);
      expect(authService.getToken()).toBe('token-b');
    });

    it('does not clear the new session when an earlier initialize fails late', async () => {
      authService.setToken('token-a');
      let rejectMe!: (error: Error) => void;
      apiMocks.getMe.mockReturnValueOnce(
        new Promise<User>((_, reject) => {
          rejectMe = reject;
        })
      );

      const pending = useAuthStore.getState().initialize();
      saveSession('token-b', otherUser);
      rejectMe(new Error('Unauthorized'));
      await pending;

      expect(authService.getToken()).toBe('token-b');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('does not clear the new session when an earlier logout finishes late', async () => {
      authService.setToken('token-a');
      useAuthStore.setState({ isAuthenticated: true, user: mockUser });
      const logoutCall = deferred<undefined>();
      apiMocks.logout.mockReturnValueOnce(logoutCall.promise);

      const pending = useAuthStore.getState().logout();
      saveSession('token-b', otherUser);
      logoutCall.resolve(undefined);
      await pending;

      expect(authService.getToken()).toBe('token-b');
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(otherUser);
    });
  });

  describe('checkPermission', () => {
    it('delegates to canAccessPermission using the store user', () => {
      useAuthStore.setState({ user: mockUser });

      expect(useAuthStore.getState().checkPermission('user:read')).toBe(true);
      expect(useAuthStore.getState().checkPermission('admin:secret')).toBe(false);
    });
  });
});
