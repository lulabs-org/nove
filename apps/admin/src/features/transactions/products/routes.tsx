import { AppstoreOutlined } from '@ant-design/icons';
import type { RouteConfig } from '../../../shared/types';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { ProductManagement } from './pages/ProductManagement';

export const productRoutes: RouteConfig[] = [
  {
    path: '/products',
    element: <ProductManagement />,
    title: '产品管理',
    menu: true,
    permission: PERMISSIONS.PRODUCT.READ,
    icon: <AppstoreOutlined />,
  },
];
