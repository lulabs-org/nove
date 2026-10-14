/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-23 13:40:42
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-23 14:19:29
 * @FilePath: /nove-admin/src/features/platform-governance/api-keys/routes.tsx
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */
import type { RouteConfig } from '../../../shared/types/index';
import { ApiKeyManagement } from './ApiKeyManagement';
import { KeyOutlined } from '@ant-design/icons';
import { PERMISSIONS } from '../../../shared/utils/permissions';

export const apiKeyRoutes: RouteConfig[] = [
  {
    path: '/api-keys',
    element: <ApiKeyManagement />,
    title: 'API Keys',
    menu: true,
    permission: PERMISSIONS.API_KEY.READ,
    icon: <KeyOutlined />,
  },
];
