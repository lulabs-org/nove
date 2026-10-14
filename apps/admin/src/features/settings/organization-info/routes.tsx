import type { RouteConfig } from '../../../shared/types';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { OrganizationInfoPage } from './OrganizationInfoPage';

export const organizationInfoRoutes: RouteConfig[] = [
  {
    path: '/settings/organization',
    element: <OrganizationInfoPage />,
    title: '企业信息',
    menu: true,
    permission: PERMISSIONS.ORGANIZATION.READ,
  },
];
