import type { RouteConfig } from '../../../shared/types';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { OrderRefundManagement } from './pages/OrderRefundManagement';

export const orderRefundRoutes: RouteConfig[] = [
  {
    path: '/order-refunds',
    element: <OrderRefundManagement />,
    title: '订单售后',
    menu: true,
    permission: PERMISSIONS.ORDER_REFUND.READ,
  },
];
