import { DatabaseOutlined } from '@ant-design/icons';
import type { RouteConfig } from '../../shared/types';
import { PERMISSIONS } from '../../shared/utils/permissions';
import { QADataHubPage } from './pages/QADataHubPage';

export const qaRoutes: RouteConfig[] = [
  {
    path: '/qa',
    element: <QADataHubPage />,
    title: '问答数据',
    menu: true,
    permission: PERMISSIONS.QA.RECORD_READ,
    icon: <DatabaseOutlined />,
  },
];
