import type { RouteConfig } from '../../../shared/types';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { PayslipList } from './PayslipList';

export const payslipsRoutes: RouteConfig[] = [
  {
    path: '/profit-sharing/payslips',
    title: '工资条',
    menu: true,
    element: <PayslipList />,
    permission: PERMISSIONS.PROFIT_SHARING.READ,
  },
];
