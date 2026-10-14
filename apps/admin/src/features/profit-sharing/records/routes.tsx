import type { RouteConfig } from '../../../shared/types';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { RecordList } from './RecordList';

export const recordsRoutes: RouteConfig[] = [
  {
    path: '/profit-sharing/records',
    title: '分润流水',
    menu: true,
    element: <RecordList />,
    permission: PERMISSIONS.PROFIT_SHARING.READ,
  },
];
