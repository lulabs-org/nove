import type { RouteConfig } from '../../../shared/types';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { SkillManagement } from './SkillManagement';

export const skillRoutes: RouteConfig[] = [
  {
    path: '/skills',
    element: <SkillManagement />,
    title: '技能管理',
    menu: true,
    permission: PERMISSIONS.SKILL.READ,
  },
];
