import { AppstoreOutlined } from '@ant-design/icons';
import type { RouteConfig } from '../../../shared/types';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { OAuthClientManagement } from './OAuthClientManagement';

export const oauthClientRoutes: RouteConfig[] = [
  {
    path: '/oauth-clients',
    element: <OAuthClientManagement />,
    title: 'OAuth',
    menu: true,
    permission: PERMISSIONS.OAUTH_CLIENT.READ,
    icon: <AppstoreOutlined />,
  },
];
