/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 10:43:46
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-09 03:25:34
 * @FilePath: /nove-admin/src/features/auth/model/types.ts
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */
export type LoginType =
  | 'username_password'
  | 'email_password'
  | 'email_code'
  | 'phone_password'
  | 'phone_code';

export interface LoginRequest {
  type: LoginType;
  username?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  password?: string;
  code?: string;
  clientType?: 'web' | 'app';
  deviceInfo?: string;
  deviceId?: string;
}

export interface UserProfile {
  name: string;
  bio: string;
  fullName: string;
  gender: string;
}

export interface User {
  id: string;
  email: string;
  countryCode?: string | null;
  phone?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  username?: string | null;
  name: string;
  avatar?: string;
  roles: string[];
  currentOrgId?: string;
  permissions: string[];
  active: boolean;
  profile?: UserProfile | null;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  expiresIn: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
}
