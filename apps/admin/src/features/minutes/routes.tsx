import { FileTextOutlined } from '@ant-design/icons';
import type { RouteConfig } from '../../shared/types';
import { PERMISSIONS } from '../../shared/utils/permissions';
import { MinuteDetail } from './pages/MinuteDetail';
import { MinuteList } from './pages/MinuteList';

export const minuteRoutes: RouteConfig[] = [
  {
    path: '/minutes',
    element: <MinuteList />,
    title: '妙记管理',
    menu: true,
    permission: PERMISSIONS.MINUTE.READ,
    icon: <FileTextOutlined />,
  },
  {
    path: '/minutes/:id',
    element: <MinuteDetail />,
    title: '妙记详情',
    menu: false,
    permission: PERMISSIONS.MINUTE.READ,
  },
];
