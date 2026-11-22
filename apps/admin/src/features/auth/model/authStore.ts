/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 14:31:04
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-23 20:23:05
 * @FilePath: /nove-admin/src/features/auth/model/authStore.ts
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login, getMe, logout as logoutApi } from '../api/api';
import {
  getAccessToken,
  getSessionEpoch,
  isCurrentSession,
  onAuthStateChange,
  removeSession,
  saveSession,
} from './session';
import type { LoginRequest, User } from './types';
import { canAccessPermission } from './permissions';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkPermission: (permission: string) => boolean;
  initialize: () => Promise<void>;
  clearAuth: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      loading: true,

      initialize: async () => {
        if (!getAccessToken()) {
          set({ loading: false, isAuthenticated: false });
          return;
        }

        const epoch = getSessionEpoch();
        try {
          const userData = await getMe();
          // 拉取期间会话已变化（退出或切换账号），不能把旧身份写回
          if (!isCurrentSession(epoch)) {
            set({ loading: false });
            return;
          }
          set({ user: userData, isAuthenticated: true, loading: false });
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          if (isCurrentSession(epoch)) {
            removeSession();
          }
          set({ loading: false });
        }
      },

      login: async (credentials: LoginRequest) => {
        const response = await login(credentials);
        // 先用新 token 拉取用户，成功后再一次性提交会话
        const userData = await getMe({
          headers: { Authorization: `Bearer ${response.accessToken}` },
        });
        saveSession(response.accessToken, userData);
      },

      logout: async () => {
        const epoch = getSessionEpoch();
        try {
          await logoutApi();
        } catch (error) {
          // 退出接口失败时保留当前会话
          console.error('Logout error:', error);
          return;
        }
        // 退出请求期间已切换到其他会话时，不能清掉新会话
        if (isCurrentSession(epoch)) {
          removeSession();
        }
      },

      checkPermission: (permission: string) => {
        return canAccessPermission(get().user, permission);
      },

      clearAuth: () => {
        removeSession();
      },

      setUser: (user: User | null) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);

// 本标签页及其他标签页的会话变化都在这里落到界面状态；回调中只更新状态
onAuthStateChange((event, { user }) => {
  if (event === 'SIGNED_IN') {
    useAuthStore.setState({ user, isAuthenticated: true, loading: false });
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  }
});
