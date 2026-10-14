/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 07:14:49
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-07 11:26:25
 * @FilePath: /nove-admin/src/shared/components/PublicLayout.tsx
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */
import Layout from 'antd/es/layout';
import { Outlet } from 'react-router-dom';

const { Content } = Layout;

interface PublicLayoutProps {
  children?: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
        }}
      >
        {children || <Outlet />}
      </Content>
    </Layout>
  );
}
