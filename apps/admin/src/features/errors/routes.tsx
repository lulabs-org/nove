import type { RouteConfig } from '../../shared/types';
import { NotFoundPage } from './NotFoundPage';

export const errorRoutes: RouteConfig[] = [
  {
    path: '/404',
    element: <NotFoundPage />,
    title: '404',
    hidden: true,
  },
  {
    path: '*',
    element: <NotFoundPage />,
    title: 'Not Found',
    hidden: true,
  },
];
