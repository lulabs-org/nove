import type { RouteConfig } from '../../../shared/types/index';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import { PermissionManagement } from './PermissionManagement';
import { PERMISSIONS } from '../../../shared/utils/permissions';

export const permissionRoutes: RouteConfig[] = [
  {
    path: '/permissions',
    element: <PermissionManagement />,
    title: '权限资源',
    menu: true,
    permission: PERMISSIONS.PERMISSION.READ,
    icon: <SafetyCertificateOutlined />,
  },
];
