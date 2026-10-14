import type { RouteConfig } from '../../../shared/types/index';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { OrderManagement } from './pages/OrderManagement';

export const orderRoutes: RouteConfig[] = [
  {
    path: '/orders',
    element: <OrderManagement />,
    title: '订单列表',
    menu: true,
    permission: PERMISSIONS.ORDER.READ,
  },
];
