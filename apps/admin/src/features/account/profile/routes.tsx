import type { RouteConfig } from '../../../shared/types';
import { ProfilePage } from './ProfilePage';

export const profileRoutes: RouteConfig[] = [
  {
    path: '/settings/profile',
    element: <ProfilePage />,
    title: '个人资料',
    menu: false,
  },
];
