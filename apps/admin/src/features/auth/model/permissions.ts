import type { User } from './types';

export function canAccessPermission(user: User | null, permission: string): boolean {
  if (!user) return false;

  if (user.roles.includes('SUPER_ADMIN')) return true;

  if (user.permissions.includes(permission)) return true;

  const parts = permission.split(':');
  return parts.length === 2 && user.permissions.includes(`${parts[0]}:*`);
}
