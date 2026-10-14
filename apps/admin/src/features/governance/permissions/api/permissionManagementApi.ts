import {
  permControllerCreate,
  permControllerDelete,
  permControllerFindAll,
  permControllerGetTree,
  permControllerUpdate,
} from '../../../../shared/lib/api/orval/business/admin-permissions';
import {
  dataPermRuleControllerCreate,
  dataPermRuleControllerDelete,
  dataPermRuleControllerFindAll,
  dataPermRuleControllerUpdate,
} from '../../../../shared/lib/api/orval/business/admin-data-permission-rules';
import type {
  CreateDataPermissionRuleDto,
  CreatePermissionDto,
  DataPermRuleControllerFindAllParams,
  DataPermissionRuleDto,
  PermControllerFindAllParams,
  PermissionTreeDto,
  UpdateDataPermissionRuleDto,
  UpdatePermissionDto,
} from '../../../../shared/lib/api/orval/business/schemas';

export type PermissionItem = PermissionTreeDto;
export type PermissionListParams = PermControllerFindAllParams & { keyword?: string };
export type CreatePermission = CreatePermissionDto;
export type UpdatePermission = UpdatePermissionDto;
export type DataPermissionRule = DataPermissionRuleDto;
export type DataPermissionRuleListParams = DataPermRuleControllerFindAllParams;
export type CreateDataPermissionRule = Omit<CreateDataPermissionRuleDto, 'code'>;
export type UpdateDataPermissionRule = UpdateDataPermissionRuleDto;

export interface PermissionListResult {
  data: PermissionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DataPermissionRuleListResult {
  data: DataPermissionRule[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const permissionManagementApi = {
  async listPermissions(params: PermissionListParams): Promise<PermissionListResult> {
    const result = await permControllerFindAll(params);
    return {
      data: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  },

  permissionTree(): Promise<PermissionItem[]> {
    return permControllerGetTree();
  },

  createPermission(data: CreatePermission): Promise<PermissionItem> {
    return permControllerCreate(data);
  },

  updatePermission(permissionId: string, data: UpdatePermission): Promise<PermissionItem> {
    return permControllerUpdate(permissionId, data);
  },

  deletePermission(permissionId: string): Promise<void> {
    return permControllerDelete(permissionId);
  },

  async listDataRules(params: DataPermissionRuleListParams): Promise<DataPermissionRuleListResult> {
    const result = await dataPermRuleControllerFindAll(params);
    return {
      data: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  },

  createDataRule(data: CreateDataPermissionRule): Promise<DataPermissionRule> {
    // The API now owns rule-code generation. The cast keeps this adapter
    // compatible with clients generated from the previous required-code schema.
    return dataPermRuleControllerCreate(data as CreateDataPermissionRuleDto);
  },

  updateDataRule(ruleId: string, data: UpdateDataPermissionRule): Promise<DataPermissionRule> {
    return dataPermRuleControllerUpdate(ruleId, data);
  },

  deleteDataRule(ruleId: string): Promise<void> {
    return dataPermRuleControllerDelete(ruleId);
  },
};
