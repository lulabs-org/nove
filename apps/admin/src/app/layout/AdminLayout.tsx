/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 07:14:19
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-23 20:38:26
 * @FilePath: /nove-admin/src/app/layout/AdminLayout.tsx
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */
import { Button, Divider, Layout } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import type { RouteConfig } from '../../shared/types';
import { Sidebar, SIDEBAR_BACKGROUND } from './Sidebar';
import { Topbar } from './Topbar';
import { RouteBreadcrumb } from './RouteBreadcrumb';
import './AdminLayout.css';

const { Content, Sider } = Layout;
const MOBILE_SIDER_QUERY = '(max-width: 760px)';
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'nove-admin:sidebar-collapsed';
const EXPANDED_SIDER_WIDTH = 200;
const COLLAPSED_SIDER_WIDTH = 80;

function getInitialCollapsedState() {
  if (typeof window === 'undefined') return false;

  try {
    const savedState = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    if (savedState === 'true') return true;
    if (savedState === 'false') return false;
  } catch {
    // Fall back to the responsive default when browser storage is unavailable.
  }

  return window.matchMedia(MOBILE_SIDER_QUERY).matches;
}

interface AdminLayoutProps {
  routes: RouteConfig[];
  children?: React.ReactNode;
}

export function AdminLayout({ routes, children }: AdminLayoutProps) {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(getInitialCollapsedState);

  const handleCollapsedChange = (nextCollapsed: boolean) => {
    setCollapsed(nextCollapsed);
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(nextCollapsed));
    } catch {
      // Keep the current session working even when browser storage is unavailable.
    }
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider
        className="admin-sidebar"
        width={EXPANDED_SIDER_WIDTH}
        theme="light"
        collapsible
        collapsed={collapsed}
        onCollapse={handleCollapsedChange}
        trigger={null}
        style={{
          background: SIDEBAR_BACKGROUND,
          height: 'calc(100vh - 64px)',
          position: 'fixed',
          left: 0,
          top: 64,
          zIndex: 99,
        }}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div
            className="admin-sidebar-scroll"
            style={{
              flex: 1,
              minHeight: 0,
              overflowX: 'hidden',
              overflowY: 'auto',
            }}
          >
            <Sidebar routes={routes} collapsed={collapsed} />
          </div>
          <div style={{ padding: '8px 12px 16px' }}>
            <Divider style={{ margin: '0 0 8px' }} />
            <Button
              type="text"
              block
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => handleCollapsedChange(!collapsed)}
              onMouseDown={(event) => event.preventDefault()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '0 8px' : '0 12px',
                height: 40,
                boxShadow: 'none',
                outline: 'none',
              }}
            >
              {collapsed ? null : '收起导航'}
            </Button>
          </div>
        </div>
      </Sider>
      <Layout
        className="admin-main-layout"
        style={{ marginLeft: collapsed ? COLLAPSED_SIDER_WIDTH : EXPANDED_SIDER_WIDTH }}
      >
        <Topbar
          collapsed={collapsed}
          sidebarWidth={collapsed ? COLLAPSED_SIDER_WIDTH : EXPANDED_SIDER_WIDTH}
        />
        <Content
          style={{
            marginTop: 64,
            padding: '0 12px 12px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <RouteBreadcrumb routes={routes} />
          <div
            style={{
              flex: 1,
              minHeight: 0,
              marginTop: pathname === '/' ? 12 : 0,
              padding: 24,
              overflow: 'auto',
              background: '#fff',
              borderRadius: 8,
            }}
          >
            {children || <Outlet />}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
