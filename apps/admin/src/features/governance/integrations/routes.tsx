import type { RouteConfig } from '../../../shared/types';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { IntegrationsManagement } from './IntegrationsManagement';

export const integrationsRoutes: RouteConfig[] = [
  {
    path: '/settings/integrations',
    element: <IntegrationsManagement />,
    title: '服务集成',
    menu: true,
    permission: PERMISSIONS.SYSTEM.CONFIG_READ,
  },
];
