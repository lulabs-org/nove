import type { RouteConfig } from '../../../shared/types/index';
import { PlatformUserManagement } from './PlatformUserManagement';
import { PERMISSIONS } from '../../../shared/utils/permissions';

export const platformUserRoutes: RouteConfig[] = [
  {
    path: '/platform-users',
    element: <PlatformUserManagement />,
    title: '平台身份',
    menu: true,
    permission: PERMISSIONS.PLATFORM_USER.READ,
  },
];
