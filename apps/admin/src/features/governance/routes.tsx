import { SafetyCertificateOutlined } from '@ant-design/icons';
import { menuGroup } from '../../shared/utils/routes';
import { permissionRoutes } from './permissions';
import { apiKeyRoutes } from './api-keys/routes';
import { integrationsRoutes } from './integrations';
import { oauthClientRoutes } from './oauth-clients';
import { skillRoutes } from './skills/routes';

const governanceRouteList = [
  ...permissionRoutes,
  ...apiKeyRoutes,
  ...oauthClientRoutes,
  ...integrationsRoutes,
  ...skillRoutes,
];

export const governanceRoutes = menuGroup(
  '/governance',
  '平台治理',
  <SafetyCertificateOutlined />,
  governanceRouteList
);
