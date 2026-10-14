/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 09:56:13
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-07 13:03:05
 * @FilePath: /nove-admin/src/features/auth/api/service.ts
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */
const TOKEN_KEY = 'auth_token';

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
};
