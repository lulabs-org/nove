import { describe, expect, it } from 'vitest';
import { canAccessPermission } from './permissions';
import type { User } from './types';

const baseUser: User = {
  id: 'user-1',
  email: 'admin@example.com',
  emailVerified: true,
  phoneVerified: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  name: '管理员',
  roles: [],
  permissions: [],
  active: true,
};

describe('canAccessPermission', () => {
  it('grants every permission to SUPER_ADMIN, including newly added permissions', () => {
    expect(canAccessPermission({ ...baseUser, roles: ['SUPER_ADMIN'] }, 'system:config:read')).toBe(
      true
    );
  });

  it('keeps exact and resource wildcard permission checks for other roles', () => {
    expect(canAccessPermission({ ...baseUser, permissions: ['system:*'] }, 'system:config')).toBe(
      true
    );
    expect(canAccessPermission(baseUser, 'system:config')).toBe(false);
  });
});
