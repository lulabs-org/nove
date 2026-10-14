/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 07:27:09
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-23 20:40:06
 * @FilePath: /nove-admin/src/app/layout/Topbar.tsx
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */
import Layout from 'antd/es/layout';
import Dropdown from 'antd/es/dropdown';
import Avatar from 'antd/es/avatar';
import Space from 'antd/es/space';
import Modal from 'antd/es/modal';
import theme from 'antd/es/theme';
import {
  SafetyOutlined,
  UserOutlined,
  LogoutOutlined,
  ExclamationCircleFilled,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/useAuth';
import './Topbar.css';

const { Header } = Layout;

interface TopbarProps {
  collapsed: boolean;
  sidebarWidth: number;
}

export function Topbar({ collapsed, sidebarWidth }: TopbarProps) {
  const { user, logout } = useAuth();
  const { token } = theme.useToken();

  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/settings/profile">个人资料</Link>,
    },
    {
      key: 'security',
      icon: <SafetyOutlined />,
      label: <Link to="/settings/security">安全设置</Link>,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        Modal.confirm({
          title: `确认退出登录"${user?.name || user?.email || 'Admin'}"吗？`,
          icon: <ExclamationCircleFilled style={{ color: token.colorWarning }} />,
          content: '退出登录不会丢失任何数据，你仍可以随时登录本账号',
          centered: true,
          okText: '退出',
          cancelText: '返回',
          okButtonProps: { danger: true },
          onOk: () => logout(),
        });
      },
    },
  ];

  return (
    <Header
      style={{
        background: '#fff',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        right: 0,
        left: 0,
        zIndex: 100,
      }}
    >
      <Link
        to="/"
        aria-label="返回企业概览"
        className={`admin-brand-link${collapsed ? ' is-collapsed' : ''}`}
        style={{
          width: sidebarWidth,
          flex: `0 0 ${sidebarWidth}px`,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 600,
          color: '#17233d',
          textDecoration: 'none',
        }}
      >
        <img className="admin-brand-logo" src="/favicon.svg" alt="" width={32} height={32} />
        <span className="admin-brand-title" aria-hidden={collapsed}>
          Nove System
        </span>
      </Link>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', padding: '0 24px' }}>
        <Dropdown menu={{ items: menuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar src={user?.avatar} icon={<UserOutlined />} />
            <span>{user?.name || user?.email || 'Admin'}</span>
          </Space>
        </Dropdown>
      </div>
    </Header>
  );
}
