import type { CreatePermission, PermissionItem } from './api/permissionManagementApi';

export type ActiveTab = 'permissions' | 'dataRules';
export type PermissionModalMode = 'create' | 'edit';
export type DataRuleModalMode = 'create' | 'edit';
export type PermissionType = CreatePermission['type'];

export interface PermissionFilters {
  page: number;
  pageSize: number;
  keyword?: string;
  resource?: string;
  type?: PermissionType;
  active?: boolean;
}

export interface DataRuleFilters {
  page: number;
  pageSize: number;
  name?: string;
  code?: string;
  resource?: string;
  action?: string;
  active?: boolean;
}

export interface PermissionFormValues {
  name?: string;
  code?: string;
  description?: string;
  resource?: string;
  action?: string;
  type?: PermissionType;
  parentId?: string;
  level?: number | null;
  sortOrder?: number | null;
  active?: boolean;
  oauthDelegatable?: boolean;
}

export interface DataRuleFormValues {
  name?: string;
  description?: string;
  resource?: string;
  action?: string;
  condition?: string;
  active?: boolean;
}

export interface FlatPermission extends PermissionItem {
  depth: number;
  pathName: string;
}

export interface PermissionResourceGroup {
  resource: string;
  count: number;
  activeCount: number;
}

export const PERMISSION_TYPE_OPTIONS: Array<{
  label: string;
  value: PermissionType;
  color: string;
}> = [
  { label: '菜单', value: 'MENU', color: 'processing' },
  { label: '按钮', value: 'BUTTON', color: 'purple' },
  { label: '接口', value: 'API', color: 'blue' },
  { label: '数据', value: 'DATA', color: 'cyan' },
  { label: '字段', value: 'FIELD', color: 'gold' },
];
