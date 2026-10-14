import { ShoppingCartOutlined } from '@ant-design/icons';
import { menuGroup } from '../../shared/utils/routes';
import { productRoutes } from './products/routes';
import { channelRoutes } from './channels/routes';
import { orderRoutes } from './orders';
import { orderRefundRoutes } from './order-refunds';

const transactionRouteList = [
  ...productRoutes,
  ...channelRoutes,
  ...orderRoutes,
  ...orderRefundRoutes,
];

export const transactionRoutes = menuGroup(
  '/transactions',
  '交易管理',
  <ShoppingCartOutlined />,
  transactionRouteList
);
