import { Breadcrumb } from 'antd';
import theme from 'antd/es/theme';
import { matchPath, useLocation } from 'react-router-dom';
import type { RouteConfig } from '../../shared/types';

interface RouteBreadcrumbProps {
  routes: RouteConfig[];
}

function findRouteTrail(routes: RouteConfig[], pathname: string): string[] {
  for (const route of routes) {
    if (route.children?.length) {
      const childTrail = findRouteTrail(route.children, pathname);
      if (childTrail.length) return [route.title, ...childTrail];
    }

    if (matchPath({ path: route.path, end: true }, pathname)) {
      return [route.title];
    }
  }

  return [];
}

export function RouteBreadcrumb({ routes }: RouteBreadcrumbProps) {
  const { token } = theme.useToken();
  const { pathname } = useLocation();
  if (pathname === '/') return null;

  const trail = findRouteTrail(routes, pathname);
  if (!trail.length) return null;

  return (
    <div
      style={{
        height: 44,
        flex: '0 0 44px',
        display: 'flex',
        alignItems: 'center',
        margin: '0 -12px',
        padding: '0 24px',
        background: token.colorBgLayout,
      }}
    >
      <Breadcrumb
        separator="〉"
        items={trail.map((title) => ({ title }))}
        style={{ color: token.colorTextSecondary, fontSize: 13 }}
      />
    </div>
  );
}
