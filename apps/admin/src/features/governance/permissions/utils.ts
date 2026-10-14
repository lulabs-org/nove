import type { PermissionItem } from './api/permissionManagementApi';
import { PERMISSION_TYPE_OPTIONS, type FlatPermission, type PermissionType } from './types';

export function displayString(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value : '';
}

export function displayNullableText(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

export function formatDateTime(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN', { hour12: false });
}

export function getPermissionTypeMeta(type?: string) {
  return (
    PERMISSION_TYPE_OPTIONS.find((item) => item.value === type) || {
      label: type || '-',
      value: (type || 'API') as PermissionType,
      color: 'default',
    }
  );
}

export function flattenPermissions(
  tree: PermissionItem[],
  depth = 0,
  parentPath = ''
): FlatPermission[] {
  return tree.flatMap((permission) => {
    const pathName = parentPath ? `${parentPath} / ${permission.name}` : permission.name;
    return [
      { ...permission, depth, pathName },
      ...flattenPermissions(permission.children || [], depth + 1, pathName),
    ];
  });
}

export function toQueryParams<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== '' && value !== undefined && value !== null
    )
  ) as Partial<T>;
}
