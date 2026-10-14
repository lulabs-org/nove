import {
  orgMemberControllerCreateMember,
  orgMemberControllerDeleteMember,
  orgMemberControllerGetMember,
  orgMemberControllerListMembers,
  orgMemberControllerUpdateMember,
  orgMemberControllerUpdateMemberDepartments,
  orgMemberControllerUpdateMemberStatus,
} from '../../../../shared/lib/api/orval/business/admin-org-members';
import {
  departmentControllerCreateDepartment,
  departmentControllerDeleteDepartment,
  departmentControllerGetDepartmentTree,
  departmentControllerUpdateDepartment,
} from '../../../../shared/lib/api/orval/business/admin-departments';
import { organizationControllerGetOrganization } from '../../../../shared/lib/api/orval/business/admin-organizations';
import { roleControllerFindAll } from '../../../../shared/lib/api/orval/business/admin-roles';
import { mutator } from '../../../../shared/lib/api/mutator';
import type {
  CreateDepartmentDto,
  CreateOrgMemberDto,
  DepartmentDto,
  DepartmentTreeDto,
  OrgMemberControllerListMembersParams,
  OrgMemberDetailDto,
  OrgMemberListItemDto,
  OrganizationDto,
  RoleDto,
  UpdateDepartmentDto,
  UpdateMemberDepartmentsDto,
  UpdateMemberStatusDto,
  UpdateOrgMemberDto,
} from '../../../../shared/lib/api/orval/business/schemas';

export interface OrgMember {
  id: string;
  userId: string;
  type: OrgMemberListItemDto['type'];
  status: OrgMemberListItemDto['status'];
  orgDisplayName?: string | null;
  employeeNo?: string | null;
  title?: string | null;
  joinedAt: string;
  user?: {
    username?: string | null;
    email?: string | null;
    countryCode?: string | null;
    phone?: string | null;
    profile?: { displayName?: string | null; avatar?: string | null } | null;
  } | null;
  primaryDept?: { id: string; name: string } | null;
}
export type OrgMemberDetail = OrgMemberDetailDto;
export interface MemberRoleOption {
  id: string;
  userId: string;
  displayName?: string | null;
  email?: string | null;
  avatar?: string | null;
  departmentNames: string[];
  roleIds: string[];
  roleBindings?: { id: string; roleId: string }[];
}
export interface MemberRoleOptionParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  roleId?: string;
  assignment?: 'assigned' | 'unassigned';
}
export type OrgMemberListParams = OrgMemberControllerListMembersParams;
export type CreateOrgMember = CreateOrgMemberDto;
export type UpdateOrgMember = UpdateOrgMemberDto;
export type UpdateOrgMemberStatus = UpdateMemberStatusDto;
export type UpdateOrgMemberDepartments = UpdateMemberDepartmentsDto;
export type CreateDepartment = Omit<CreateDepartmentDto, 'code'> & {
  code?: string;
};
export type UpdateDepartment = Omit<UpdateDepartmentDto, 'parentId' | 'leaderUserId'> & {
  parentId?: string | null;
  leaderUserId?: string | null;
};

export interface OrgMemberListResponse {
  data: OrgMember[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MemberRoleOptionListResponse {
  data: MemberRoleOption[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const orgMemberApi = {
  async list(orgId: string, params: OrgMemberListParams): Promise<OrgMemberListResponse> {
    const result = await orgMemberControllerListMembers(orgId, params);
    return {
      data: result.items as unknown as OrgMember[],
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  },

  async roleOptions(
    orgId: string,
    params: MemberRoleOptionParams
  ): Promise<MemberRoleOptionListResponse> {
    const result = await mutator<{
      items: MemberRoleOption[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>({
      url: `/admin/orgs/${orgId}/member-role-options`,
      method: 'GET',
      params,
    });
    return {
      data: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  },

  create(orgId: string, data: CreateOrgMember): Promise<OrgMemberDetail> {
    return orgMemberControllerCreateMember(orgId, data);
  },

  getById(memberId: string): Promise<OrgMemberDetail> {
    return orgMemberControllerGetMember(memberId);
  },

  update(memberId: string, data: UpdateOrgMember): Promise<OrgMemberDetail> {
    return orgMemberControllerUpdateMember(memberId, data);
  },

  updateStatus(memberId: string, data: UpdateOrgMemberStatus): Promise<OrgMemberDetail> {
    return orgMemberControllerUpdateMemberStatus(memberId, data);
  },

  updateDepartments(memberId: string, data: UpdateOrgMemberDepartments): Promise<OrgMemberDetail> {
    return orgMemberControllerUpdateMemberDepartments(memberId, data);
  },

  delete(memberId: string): Promise<void> {
    return orgMemberControllerDeleteMember(memberId);
  },

  departments(orgId: string): Promise<DepartmentTreeDto[]> {
    return departmentControllerGetDepartmentTree(orgId);
  },

  async roles(): Promise<RoleDto[]> {
    const result = await roleControllerFindAll({ active: true, page: 1, pageSize: 100 });
    return result.items;
  },

  organization(orgId: string): Promise<OrganizationDto> {
    return organizationControllerGetOrganization(orgId);
  },

  createDepartment(orgId: string, data: CreateDepartment): Promise<DepartmentDto> {
    return departmentControllerCreateDepartment(orgId, data as CreateDepartmentDto);
  },

  updateDepartment(deptId: string, data: UpdateDepartment): Promise<DepartmentDto> {
    return departmentControllerUpdateDepartment(deptId, data as UpdateDepartmentDto);
  },

  deleteDepartment(deptId: string): Promise<void> {
    return departmentControllerDeleteDepartment(deptId);
  },
};
