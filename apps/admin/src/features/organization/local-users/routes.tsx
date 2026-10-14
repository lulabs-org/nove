import type { RouteConfig } from '../../../shared/types';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { UserManagement } from './UserManagement';

export const userRoutes: RouteConfig[] = [
  {
    path: '/user-management',
    element: <UserManagement />,
    title: '系统账号',
    menu: true,
    permission: PERMISSIONS.USER.READ,
  },
];
