import type { RouteConfig } from '../../../shared/types';
import { SecurityPage } from './SecurityPage';

export const securityRoutes: RouteConfig[] = [
  {
    path: '/settings/security',
    element: <SecurityPage />,
    title: '安全设置',
    menu: false,
  },
];
