import type { RouteConfig } from '../../../shared/types';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { RuleList } from './RuleList';

export const rulesRoutes: RouteConfig[] = [
  {
    path: '/profit-sharing/rules',
    title: '分润规则',
    menu: true,
    element: <RuleList />,
    permission: PERMISSIONS.PROFIT_SHARING.READ,
  },
];
