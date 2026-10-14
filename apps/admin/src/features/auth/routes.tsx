/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 07:27:09
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-07 13:10:45
 * @FilePath: /nove-admin/src/features/auth/routes.tsx
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */
import type { RouteConfig } from '../../shared/types/index';
import { LoginPage } from './pages/LoginPage';
import { OAuthConsentPage } from './oauth/OAuthConsentPage';

export const authRoutes: RouteConfig[] = [
  {
    path: '/login',
    element: <LoginPage />,
    title: '登录',
    hidden: true,
  },
  {
    path: '/oauth/consent',
    element: <OAuthConsentPage />,
    title: 'CLI 授权',
    hidden: true,
  },
];
