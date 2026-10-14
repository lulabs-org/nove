import type { RouteConfig } from '../../shared/types/index';
import { TaskManagement } from './pages/TaskManagement';
import { ScheduleOutlined } from '@ant-design/icons';
import { PERMISSIONS } from '../../shared/utils/permissions';

export const taskRoutes: RouteConfig[] = [
  {
    path: '/tasks',
    element: <TaskManagement />,
    title: '任务调度',
    menu: true,
    icon: <ScheduleOutlined />,
    permission: PERMISSIONS.TASK.READ,
  },
];
