import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../../shared/utils/permissions';
import { routes } from './index';

describe('application routes', () => {
  it.each([
    {
      path: '/organization',
      title: '组织架构',
      childPaths: ['/users/list', '/users/roles', '/user-management', '/platform-users'],
    },
    {
      path: '/transactions',
      title: '交易管理',
      childPaths: ['/products', '/channels', '/orders', '/order-refunds'],
    },
    {
      path: '/governance',
      title: '平台治理',
      childPaths: [
        '/permissions',
        '/api-keys',
        '/oauth-clients',
        '/settings/integrations',
        '/skills',
      ],
    },
    {
      path: '/settings',
      title: '企业设置',
      childPaths: ['/settings/organization'],
    },
  ])('composes $title routes in the application layer', ({ path, title, childPaths }) => {
    const moduleRoute = routes.find((route) => route.path === path);

    expect(moduleRoute).toMatchObject({
      title,
      menu: true,
    });
    expect(moduleRoute?.children?.map((route) => route.path)).toEqual(childPaths);
  });

  it('preserves order child permissions', () => {
    const orderRoutes = routes.find((route) => route.path === '/transactions')?.children?.slice(-2);

    expect(orderRoutes).toMatchObject([
      { permission: PERMISSIONS.ORDER.READ },
      { permission: PERMISSIONS.ORDER_REFUND.READ },
    ]);
  });

  it('requires skill read permission for the management page', () => {
    const governance = routes.find((route) => route.path === '/governance');
    expect(governance?.children?.find((route) => route.path === '/skills')?.permission).toBe(
      PERMISSIONS.SKILL.READ
    );
  });

  it('uses account and identity language for organization users', () => {
    const organizationRoutes = routes.find((route) => route.path === '/organization')?.children;

    expect(organizationRoutes?.find((route) => route.path === '/user-management')?.title).toBe(
      '系统账号'
    );
    expect(organizationRoutes?.find((route) => route.path === '/platform-users')?.title).toBe(
      '平台身份'
    );
    expect(organizationRoutes?.find((route) => route.path === '/users/list')?.permission).toBe(
      PERMISSIONS.ORG_MEMBER.READ
    );
    expect(organizationRoutes?.find((route) => route.path === '/platform-users')?.permission).toBe(
      PERMISSIONS.PLATFORM_USER.READ
    );
  });

  it('protects every profit sharing page with the backend read permission', () => {
    const profitSharing = routes.find((route) => route.path === '/profit-sharing');

    expect(profitSharing?.children).toHaveLength(4);
    expect(
      profitSharing?.children?.every(
        (route) => route.permission === PERMISSIONS.PROFIT_SHARING.READ
      )
    ).toBe(true);
  });

  it('exposes project management as an independent top-level route', () => {
    expect(routes.find((route) => route.path === '/projects')).toMatchObject({
      title: '项目管理',
      menu: true,
      permission: PERMISSIONS.PROJECT.READ,
    });
  });

  it('labels scheduled work as task scheduling', () => {
    expect(routes.find((route) => route.path === '/tasks')).toMatchObject({
      title: '任务调度',
      menu: true,
      permission: PERMISSIONS.TASK.READ,
    });
  });

  it('exposes minute management as an independent top-level route', () => {
    expect(routes.find((route) => route.path === '/minutes')).toMatchObject({
      title: '妙记管理',
      menu: true,
      permission: PERMISSIONS.MINUTE.READ,
    });
    expect(routes.find((route) => route.path === '/minutes/:id')).toMatchObject({
      title: '妙记详情',
      menu: false,
      permission: PERMISSIONS.MINUTE.READ,
    });
  });

  it('keeps the legacy meeting detail route as a hidden redirect entry', () => {
    expect(routes.find((route) => route.path === '/meetings/:id')).toMatchObject({
      title: '会议妙记重定向',
      menu: false,
      permission: PERMISSIONS.MEETING.READ,
    });
  });
});
