import { ShareAltOutlined } from '@ant-design/icons';
import type { RouteConfig } from '../../../shared/types';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { ChannelManagement } from './pages/ChannelManagement';

export const channelRoutes: RouteConfig[] = [
  {
    path: '/channels',
    element: <ChannelManagement />,
    title: '渠道管理',
    menu: true,
    permission: PERMISSIONS.CHANNEL.READ,
    icon: <ShareAltOutlined />,
  },
];
