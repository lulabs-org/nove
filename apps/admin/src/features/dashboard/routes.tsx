/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 07:04:11
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-08-10
 * @FilePath: /nove-admin/src/features/enterprise-overview/routes.tsx
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */

import type { RouteConfig } from '../../shared/types/index';
import { PieChartOutlined } from '@ant-design/icons';
import { DashboardPage } from './DashboardPage';

export const dashboardRoutes: RouteConfig[] = [
  {
    path: '/',
    element: <DashboardPage />,
    title: '企业概览',
    menu: true,
    icon: <PieChartOutlined />,
  },
];
