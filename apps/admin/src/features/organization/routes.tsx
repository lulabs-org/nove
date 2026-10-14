import type { RouteConfig } from '../../shared/types';
import { TeamOutlined } from '@ant-design/icons';
import { menuGroup } from '../../shared/utils/routes';
import { memberRoutes } from './members/routes';
import { userRoutes } from './local-users/routes';
import { platformUserRoutes } from './platform-users/routes';

const organizationRouteList: RouteConfig[] = [
  ...memberRoutes,
  ...userRoutes,
  ...platformUserRoutes,
];

export const organizationRoutes = menuGroup('/organization', '组织架构', <TeamOutlined />, [
  ...organizationRouteList,
]);
