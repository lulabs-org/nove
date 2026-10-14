/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 12:49:07
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-07 12:49:08
 * @FilePath: /nove-admin/src/features/auth/index.ts
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */
export type { LoginRequest, LoginResponse, User } from './model/types';
export { login, getMe, logout } from './api/api';
export { authService } from './api/service';

export { useAuthStore } from './model/authStore';
export { authRoutes } from './routes';
