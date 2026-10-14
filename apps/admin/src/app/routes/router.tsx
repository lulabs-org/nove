/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 10:43:46
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-07 12:53:59
 * @FilePath: /nove-admin/src/app/routes/router.tsx
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */
import type { RouteConfig } from '../../shared/types';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { AdminLayout } from '../layout/AdminLayout';
import { PublicLayout } from '../layout/PublicLayout';
import { ProtectedRoute } from '../guards/ProtectedRoute';
import { PublicRoute } from '../guards/PublicRoute';

export function generateRoutes(routeConfigs: RouteConfig[]): RouteObject[] {
  return routeConfigs.map((config) => {
    const route: RouteObject = {
      path: config.path,
      element: config.element,
    };

    if (config.children) {
      route.children = generateRoutes(config.children);
    }

    if (config.redirect) {
      route.element = <Navigate to={config.redirect} replace />;
    }

    return route;
  });
}

export function createAppRouter(routeConfigs: RouteConfig[]) {
  const publicRoutes = routeConfigs.filter((route) => route.path === '/login');
  const consentRoutes = routeConfigs.filter((route) => route.path === '/oauth/consent');
  const adminRoutes = routeConfigs.filter(
    (route) => route.path !== '/login' && route.path !== '/oauth/consent'
  );

  const routes: RouteObject[] = [
    {
      path: '/login',
      element: (
        <PublicRoute>
          <PublicLayout>
            <Outlet />
          </PublicLayout>
        </PublicRoute>
      ),
      children: generateRoutes(publicRoutes),
    },
    {
      path: '/oauth/consent',
      element: (
        <ProtectedRoute>
          <PublicLayout>
            <Outlet />
          </PublicLayout>
        </ProtectedRoute>
      ),
      children: generateRoutes(consentRoutes),
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <AdminLayout routes={adminRoutes}>
            <Outlet />
          </AdminLayout>
        </ProtectedRoute>
      ),
      children: generateProtectedRoutes(adminRoutes),
    },
  ];
  return createBrowserRouter(routes);
}

export function generateProtectedRoutes(routeConfigs: RouteConfig[]): RouteObject[] {
  const result: RouteObject[] = [];

  for (const config of routeConfigs) {
    // menuOnly 节点不创建真实路由，子路由展平到同级注册
    if (config.menuOnly) {
      if (config.children) {
        result.push(...generateProtectedRoutes(config.children));
      }
      continue;
    }

    const route: RouteObject = {
      path: config.path,
      element: <ProtectedRoute permission={config.permission}>{config.element}</ProtectedRoute>,
    };

    if (config.children) {
      route.children = generateProtectedRoutes(config.children);
    }

    if (config.redirect) {
      route.element = <Navigate to={config.redirect} replace />;
    }

    result.push(route);
  }

  return result;
}
