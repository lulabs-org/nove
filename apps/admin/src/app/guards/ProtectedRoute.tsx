/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 10:43:46
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-07 11:13:45
 * @FilePath: /nove-admin/src/shared/router/ProtectedRoute.tsx
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */
import { useAuth } from '../../shared/hooks/useAuth';
import Result from 'antd/es/result';
import Button from 'antd/es/button';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { isAuthenticated, loading, checkPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (permission && !checkPermission(permission)) {
    return (
      <Result
        status="403"
        title="无权限访问"
        subTitle="您没有访问此页面的权限"
        extra={
          <Button type="primary" onClick={() => (window.location.href = '/')}>
            返回首页
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
