import { ProjectOutlined } from '@ant-design/icons';
import type { RouteConfig } from '../../shared/types';
import { PERMISSIONS } from '../../shared/utils/permissions';
import { ProjectManagement } from './pages/ProjectManagement';

export const projectRoutes: RouteConfig[] = [
  {
    path: '/projects',
    element: <ProjectManagement />,
    title: '项目管理',
    menu: true,
    permission: PERMISSIONS.PROJECT.READ,
    icon: <ProjectOutlined />,
  },
];
