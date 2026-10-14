/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-08-10
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-08-10
 * @FilePath: /nove-admin/src/features/enterprise-overview/DashboardPage.tsx
 * @Description: Dashboard page showing organization overview, user info, quick links and stats
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */
import { Skeleton, Spin } from 'antd';
import {
  CalendarOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/useAuth';
import { PERMISSIONS } from '../../shared/utils/permissions';
import { useOrganizationControllerGetOrganization } from '../../shared/lib/api/orval/business/admin-organizations';
import { useOrganizationControllerGetOrganizationStats } from '../../shared/lib/api/orval/business/admin-organizations';
import './DashboardPage.css';

interface StatCardProps {
  label: string;
  value: number | string;
  onClick?: () => void;
}

function StatCard({ label, value, onClick }: StatCardProps) {
  return (
    <div className="dashboard-stat-card" onClick={onClick}>
      <div className="dashboard-stat-card-label">{label}</div>
      <div className="dashboard-stat-card-value">{value}</div>
    </div>
  );
}

interface QuickLinkProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}

function QuickLink({ icon, title, desc, onClick }: QuickLinkProps) {
  return (
    <div className="dashboard-quick-link" onClick={onClick}>
      <div className="dashboard-quick-link-icon">{icon}</div>
      <div className="dashboard-quick-link-text">
        <div className="dashboard-quick-link-title">{title}</div>
        <div className="dashboard-quick-link-desc">{desc}</div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, checkPermission } = useAuth();
  const orgId = user?.currentOrgId;

  const hasOrgRead = checkPermission(PERMISSIONS.ORGANIZATION.READ);

  const { data: org, isLoading: orgLoading } = useOrganizationControllerGetOrganization(
    orgId || '',
    { query: { enabled: !!orgId && hasOrgRead } }
  );

  const { data: stats, isLoading: statsLoading } = useOrganizationControllerGetOrganizationStats(
    orgId || '',
    { query: { enabled: !!orgId && hasOrgRead } }
  );

  if (hasOrgRead && (orgLoading || statsLoading)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  const orgName = org?.name || orgId || '-';
  const orgDisplayId = orgId || '-';
  const firstChar = orgName.trim().charAt(0) || '?';
  const quickLinks: QuickLinkProps[] = [];
  if (checkPermission(PERMISSIONS.USER.READ)) {
    quickLinks.push({
      icon: <TeamOutlined />,
      title: '成员与部门',
      desc: '管理组织成员和部门架构',
      onClick: () => navigate('/users/list'),
    });
  }
  if (checkPermission(PERMISSIONS.ROLE.READ)) {
    quickLinks.push({
      icon: <IdcardOutlined />,
      title: '角色管理',
      desc: '配置角色与权限',
      onClick: () => navigate('/users/roles'),
    });
  }
  if (checkPermission(PERMISSIONS.MEETING.READ)) {
    quickLinks.push({
      icon: <CalendarOutlined />,
      title: '会议管理',
      desc: '查看会议记录',
      onClick: () => navigate('/meetings'),
    });
  }
  if (checkPermission(PERMISSIONS.TASK.READ)) {
    quickLinks.push({
      icon: <ScheduleOutlined />,
      title: '任务调度',
      desc: '管理一次性与周期任务',
      onClick: () => navigate('/tasks'),
    });
  }
  if (checkPermission(PERMISSIONS.PERMISSION.READ)) {
    quickLinks.push({
      icon: <SafetyCertificateOutlined />,
      title: '权限管理',
      desc: '查看系统权限',
      onClick: () => navigate('/permissions'),
    });
  }
  quickLinks.push({
    icon: <SettingOutlined />,
    title: '个人设置',
    desc: '管理个人资料',
    onClick: () => navigate('/settings/profile'),
  });

  return (
    <div className="dashboard-page">
      {/* Organization header */}
      <div className="dashboard-card">
        <div className="dashboard-org-header">
          <div className="dashboard-org-avatar">{firstChar}</div>
          <div>
            <div className="dashboard-org-name">{orgName}</div>
            <div className="dashboard-org-id">组织编号：{orgDisplayId}</div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="dashboard-card">
        <div className="dashboard-section-title">快捷入口</div>
        <div className="dashboard-quick-links">
          {quickLinks.map((link, index) => (
            <QuickLink key={index} {...link} />
          ))}
        </div>
      </div>

      {/* Stats - admin only */}
      {hasOrgRead && stats && (
        <div className="dashboard-card">
          <div className="dashboard-section-title">组织统计</div>
          <div className="dashboard-stats-row">
            <StatCard
              label="组织总人数"
              value={stats.totalUsers}
              onClick={() => navigate('/users/list')}
            />
            <StatCard
              label="部门数"
              value={stats.totalDepartments}
              onClick={() => navigate('/users/list')}
            />
            <StatCard
              label="超级管理员"
              value={stats.adminUsers}
              onClick={() => navigate('/users/roles')}
            />
            <StatCard
              label="管理员"
              value={stats.adminUsers}
              onClick={() => navigate('/users/roles')}
            />
          </div>
        </div>
      )}

      {hasOrgRead && !stats && (
        <div className="dashboard-card">
          <Skeleton active paragraph={{ rows: 3 }} />
        </div>
      )}
    </div>
  );
}
