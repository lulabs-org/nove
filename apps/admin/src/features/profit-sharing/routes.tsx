import type { RouteConfig } from '../../shared/types';
import { DollarOutlined } from '@ant-design/icons';
import { menuGroup } from '../../shared/utils/routes';
import { dashboardRoutes } from './dashboard/routes';
import { rulesRoutes } from './rules/routes';
import { recordsRoutes } from './records/routes';
import { payslipsRoutes } from './payslips/routes';

const profitSharingRouteList: RouteConfig[] = [
  ...dashboardRoutes,
  ...rulesRoutes,
  ...recordsRoutes,
  ...payslipsRoutes,
];

export const profitSharingRoutes: RouteConfig = menuGroup(
  '/profit-sharing',
  '分润结算',
  <DollarOutlined />,
  [...profitSharingRouteList]
);
