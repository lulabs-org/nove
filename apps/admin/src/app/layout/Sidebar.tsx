/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 06:33:21
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-23 14:26:06
 * @FilePath: /nove-admin/src/app/layout/Sidebar.tsx
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */

import Menu from 'antd/es/menu';
import type { RouteConfig } from '../../shared/types';
import { useLocation, useNavigate } from 'react-router-dom';
import type { MenuProps } from 'antd/es/menu';
import { useAuth } from '../../shared/hooks/useAuth';
import { useMemo, useState } from 'react';
import { getStoredOpenKeys, mergeOpenKeys, persistOpenKeys } from './sidebarOpenKeys';
import './Sidebar.css';

interface SidebarProps {
  routes: RouteConfig[];
  collapsed?: boolean;
}

export const SIDEBAR_BACKGROUND = '#f5f6f8';

function findActiveParentKeys(
  routes: RouteConfig[],
  pathname: string,
  parentKeys: string[] = []
): string[] {
  for (const route of routes) {
    if (route.path === pathname) return parentKeys;
    if (route.children?.length) {
      const childKeys = findActiveParentKeys(route.children, pathname, [...parentKeys, route.path]);
      if (childKeys.length) return childKeys;
    }
  }

  return [];
}

export function Sidebar({ routes, collapsed }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkPermission } = useAuth();

  const menuItems = generateMenuItems(routes);
  const selectedKeys = [location.pathname];
  const activeParentKeys = useMemo(
    () => findActiveParentKeys(routes, location.pathname),
    [routes, location.pathname]
  );
  const [openKeys, setOpenKeys] = useState<string[]>(getStoredOpenKeys);
  const visibleOpenKeys = mergeOpenKeys(openKeys, activeParentKeys);

  function generateMenuItems(routes: RouteConfig[], depth = 0): MenuProps['items'] {
    return routes
      .filter((route) => {
        if (!route.menu || route.hidden) return false;
        if (route.permission && !checkPermission(route.permission)) return false;
        if (route.children?.length && generateMenuItems(route.children, depth + 1)?.length === 0)
          return false;
        return true;
      })
      .map((route) => {
        const item: NonNullable<MenuProps['items']>[number] = {
          key: route.path,
          label: route.title,
          icon: depth === 0 ? route.icon : undefined,
        };

        if (route.children && route.children.length > 0) {
          const childItems = generateMenuItems(route.children, depth + 1) ?? [];
          (item as { children?: MenuProps['items'] }).children = collapsed
            ? [
                {
                  key: `${route.path}__popup-heading`,
                  label: <span className="sidebar-popup-heading-label">{route.title}</span>,
                  disabled: true,
                  className: 'sidebar-popup-heading',
                },
                ...childItems,
              ]
            : childItems;
        }

        return item;
      });
  }

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const handleOpenChange: MenuProps['onOpenChange'] = (nextOpenKeys) => {
    setOpenKeys(nextOpenKeys);
    persistOpenKeys(nextOpenKeys);
  };

  return (
    <Menu
      mode="inline"
      selectedKeys={selectedKeys}
      openKeys={collapsed ? undefined : visibleOpenKeys}
      onOpenChange={handleOpenChange}
      onClick={handleMenuClick}
      items={menuItems}
      inlineCollapsed={collapsed}
      triggerSubMenuAction="hover"
      subMenuOpenDelay={0.12}
      subMenuCloseDelay={0.18}
      style={{ height: '100%', borderRight: 0, background: SIDEBAR_BACKGROUND }}
    />
  );
}
