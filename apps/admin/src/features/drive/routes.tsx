import { CloudOutlined } from '@ant-design/icons';
import type { RouteConfig } from '../../shared/types';
import { PERMISSIONS } from '../../shared/utils/permissions';
import { DrivePage } from './pages/DrivePage';

export const driveRoutes: RouteConfig[] = [
  {
    path: '/drive',
    element: <DrivePage />,
    title: '云盘管理',
    menu: true,
    permission: PERMISSIONS.DRIVE.READ,
    icon: <CloudOutlined />,
  },
];
