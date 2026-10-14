/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 13:18:53
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-09 21:34:00
 * @FilePath: /nove-admin/src/app/routes/index.tsx
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */

import type { RouteConfig } from '../../shared/types';
import { authRoutes } from '../../features/auth';
import { dashboardRoutes } from '../../features/dashboard';
import { organizationRoutes } from '../../features/organization';
import { transactionRoutes } from '../../features/transactions';
import { governanceRoutes } from '../../features/governance';
import { settingsRoutes } from '../../features/settings';
import { accountRoutes } from '../../features/account';
import { meetingRoutes } from '../../features/meetings';
import { minuteRoutes } from '../../features/minutes';
import { reportRoutes } from '../../features/reports';
import { taskRoutes } from '../../features/tasks';
import { errorRoutes } from '../../features/errors';
import { projectRoutes } from '../../features/projects';
import { profitSharingRoutes } from '../../features/profit-sharing';
import { driveRoutes } from '../../features/drive';

export const routes: RouteConfig[] = [
  ...authRoutes,
  ...dashboardRoutes,
  organizationRoutes,
  transactionRoutes,
  ...projectRoutes,
  ...meetingRoutes,
  ...minuteRoutes,
  ...driveRoutes,
  ...reportRoutes,
  ...taskRoutes,
  profitSharingRoutes,
  governanceRoutes,
  settingsRoutes,
  ...accountRoutes,
  ...errorRoutes,
];
