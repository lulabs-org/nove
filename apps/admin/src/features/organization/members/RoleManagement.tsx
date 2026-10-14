import Alert from 'antd/es/alert';
import Avatar from 'antd/es/avatar';
import Button from 'antd/es/button';
import Card from 'antd/es/card';
import Checkbox from 'antd/es/checkbox';
import Dropdown from 'antd/es/dropdown';
import Empty from 'antd/es/empty';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import InputNumber from 'antd/es/input-number';
import message from 'antd/es/message';
import Modal from 'antd/es/modal';
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import Switch from 'antd/es/switch';
import Table from 'antd/es/table';
import Tabs from 'antd/es/tabs';
import Tag from 'antd/es/tag';
import Tooltip from 'antd/es/tooltip';
import Typography from 'antd/es/typography';
import type { MenuProps } from 'antd/es/menu';
import type { TableProps } from 'antd/es/table';
import {
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  ExportOutlined,
  FolderOutlined,
  ImportOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  UserOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDeferredValue, useMemo, useState, type Key } from 'react';
import { Perm } from '../../../app/guards/Perm';
import { useAuth } from '../../../shared/hooks/useAuth';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { orgMemberApi, type MemberRoleOption } from './api/orgMemberApi';
import {
  roleManagementApi,
  type CreateRole,
  type Role,
  type UpdateRole,
} from './api/roleManagementApi';
import {
  permissionManagementApi,
  type PermissionItem,
} from '../../governance/permissions/api/permissionManagementApi';
import {
  explainCondition,
  getActionMeta,
} from '../../governance/permissions/components/dataRuleConstants';
import './RoleManagement.css';

const { TextArea } = Input;
const { Text, Title } = Typography;

type RoleModalMode = 'create' | 'edit';

interface RoleFormValues {
  name?: string;
  code?: string;
  description?: string;
  level?: number | null;
  active?: boolean;
}

interface AddMemberFormValues {
  membershipIds?: string[];
}

interface FlatPermission extends PermissionItem {
  depth: number;
}

interface PermissionResourceGroup {
  resource: string;
  label: string;
  permissions: FlatPermission[];
}

const ROLE_TYPE_META: Record<string, { label: string; color: string }> = {
  SYSTEM: { label: '系统角色', color: 'blue' },
  CUSTOM: { label: '自定义', color: 'default' },
};

const PERMISSION_TYPE_META: Record<string, { label: string; color: string }> = {
  MENU: { label: '菜单', color: 'processing' },
  BUTTON: { label: '按钮', color: 'purple' },
  API: { label: '接口', color: 'blue' },
  DATA: { label: '数据', color: 'cyan' },
  FIELD: { label: '字段', color: 'gold' },
};

const PERMISSION_RESOURCE_LABELS: Record<string, string> = {
  'api-key': 'API Keys',
  channel: '渠道管理',
  dashboard: '企业概览',
  'data-permission': '数据权限',
  dept: '部门管理',
  finance: '财务管理',
  'mcp-tool': 'MCP 工具',
  meeting: '会议管理',
  minute: '会议纪要',
  'minute-summary': '纪要总结',
  'oauth-client': 'OAuth 客户端',
  order: '订单管理',
  'order-refund': '订单售后',
  org: '组织管理',
  'org-member': '组织成员',
  permission: '权限资源',
  'platform-user': '平台身份',
  product: '产品管理',
  role: '角色管理',
  'speaker-summary': '参会者总结',
  system: '系统配置',
  'tracking-report': '追踪报告',
  user: '用户管理',
};

const AVATAR_COLORS = ['#3370ff', '#00a870', '#ff8800', '#7b61ff', '#e65050', '#14a9a0'];

function displayString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : '';
}

function getMemberName(member: MemberRoleOption) {
  return displayString(member.displayName) || displayString(member.email) || member.userId;
}

function getMemberEmail(member: MemberRoleOption) {
  return displayString(member.email) || '-';
}

function getAvatarText(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.length > 2 ? trimmed.slice(-2) : trimmed;
}

function getAvatarColor(seed: string) {
  const sum = seed.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function getRoleDescription(role?: Role | null) {
  if (!role?.description) return '';
  return typeof role.description === 'string' ? role.description : '';
}

function getDepartmentText(member: MemberRoleOption) {
  return member.departmentNames.length ? member.departmentNames.join('、') : '-';
}

function flattenPermissionTree(tree: PermissionItem[], depth = 0): FlatPermission[] {
  return tree.flatMap((permission) => [
    { ...permission, depth },
    ...flattenPermissionTree(permission.children || [], depth + 1),
  ]);
}

function collectPermissionIds(permission: PermissionItem): string[] {
  return [
    permission.id,
    ...(permission.children || []).flatMap((child) => collectPermissionIds(child)),
  ];
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell.replace(/"/g, '""');
          return `"${value}"`;
        })
        .join(',')
    )
    .join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function RoleManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentOrgId = user?.currentOrgId;
  const [roleKeyword, setRoleKeyword] = useState('');
  const [memberKeyword, setMemberKeyword] = useState('');
  const deferredMemberKeyword = useDeferredValue(memberKeyword);
  const [memberPage, setMemberPage] = useState(1);
  const [eligibleKeyword, setEligibleKeyword] = useState('');
  const deferredEligibleKeyword = useDeferredValue(eligibleKeyword);
  const [selectedRoleId, setSelectedRoleId] = useState<string>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleModalMode, setRoleModalMode] = useState<RoleModalMode>('create');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [removal, setRemoval] = useState<{
    orgId: string;
    roleName: string;
    members: MemberRoleOption[];
    bindingIds: string[];
  } | null>(null);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [permissionKeyword, setPermissionKeyword] = useState('');
  const [permissionResource, setPermissionResource] = useState('all');
  const [showSelectedPermissions, setShowSelectedPermissions] = useState(false);
  const [permissionCheckedKeys, setPermissionCheckedKeys] = useState<string[]>([]);
  const [activePermissionTab, setActivePermissionTab] = useState<'functional' | 'dataRules'>(
    'functional'
  );
  const [selectedDataRuleIds, setSelectedDataRuleIds] = useState<string[]>([]);

  const dataRulesQuery = useQuery({
    queryKey: ['role-management-all-data-rules'],
    queryFn: () => permissionManagementApi.listDataRules({ page: 1, pageSize: 100 }),
    enabled: permissionModalOpen,
  });

  const [roleForm] = Form.useForm<RoleFormValues>();
  const [addMemberForm] = Form.useForm<AddMemberFormValues>();

  const rolesQuery = useQuery({
    queryKey: ['role-management-roles', roleKeyword],
    queryFn: () =>
      roleManagementApi.list({
        page: 1,
        pageSize: 100,
        name: roleKeyword.trim() || undefined,
      }),
  });

  const roles = rolesQuery.data?.data || [];
  const selectedRole = roles.find((role) => role.id === selectedRoleId) || roles[0];

  const membersQuery = useQuery({
    queryKey: [
      'role-management-members',
      currentOrgId,
      selectedRole?.id,
      deferredMemberKeyword,
      memberPage,
    ],
    queryFn: () =>
      orgMemberApi.roleOptions(currentOrgId!, {
        page: memberPage,
        pageSize: 20,
        keyword: deferredMemberKeyword.trim() || undefined,
        roleId: selectedRole!.id,
        assignment: 'assigned',
      }),
    enabled: !!currentOrgId && !!selectedRole,
  });

  const eligibleMembersQuery = useQuery({
    queryKey: [
      'role-management-eligible-members',
      currentOrgId,
      selectedRole?.id,
      deferredEligibleKeyword,
    ],
    queryFn: () =>
      orgMemberApi.roleOptions(currentOrgId!, {
        page: 1,
        pageSize: 100,
        keyword: deferredEligibleKeyword.trim() || undefined,
        roleId: selectedRole!.id,
        assignment: 'unassigned',
      }),
    enabled: addMemberOpen && !!currentOrgId && !!selectedRole,
  });

  const permissionTreeQuery = useQuery({
    queryKey: ['role-management-permission-tree'],
    queryFn: permissionManagementApi.permissionTree,
  });

  const permissionTree = useMemo(() => permissionTreeQuery.data || [], [permissionTreeQuery.data]);
  const flatPermissions = useMemo(() => flattenPermissionTree(permissionTree), [permissionTree]);
  const checkedPermissionSet = useMemo(
    () => new Set(permissionCheckedKeys),
    [permissionCheckedKeys]
  );
  const permissionResourceGroups = useMemo(() => {
    const groups = new Map<string, FlatPermission[]>();
    flatPermissions.forEach((permission) => {
      const resource = permission.resource || 'other';
      groups.set(resource, [...(groups.get(resource) || []), permission]);
    });
    return Array.from(groups.entries())
      .map<PermissionResourceGroup>(([resource, permissions]) => ({
        resource,
        label: PERMISSION_RESOURCE_LABELS[resource] || resource,
        permissions,
      }))
      .sort((first, second) => first.label.localeCompare(second.label, 'zh-CN'));
  }, [flatPermissions]);
  const visiblePermissions = useMemo(() => {
    const keyword = permissionKeyword.trim().toLowerCase();
    return flatPermissions.filter((permission) => {
      const resource = permission.resource || 'other';
      if (permissionResource !== 'all' && resource !== permissionResource) return false;
      if (showSelectedPermissions && !checkedPermissionSet.has(permission.id)) return false;
      if (!keyword) return true;
      return [permission.name, permission.code, resource].some((value) =>
        (value || '').toLowerCase().includes(keyword)
      );
    });
  }, [
    checkedPermissionSet,
    flatPermissions,
    permissionKeyword,
    permissionResource,
    showSelectedPermissions,
  ]);

  const roleMembers = membersQuery.data?.data || [];
  const eligibleMembers = eligibleMembersQuery.data?.data || [];

  const saveRoleMutation = useMutation({
    mutationFn: (values: RoleFormValues) => {
      if (!currentOrgId) throw new Error('Missing organization');
      const payload = {
        name: values.name?.trim() || '',
        description: values.description?.trim() || undefined,
        level: values.level ?? 10,
        active: values.active ?? true,
      };

      if (roleModalMode === 'edit' && editingRole) {
        const updatePayload: UpdateRole = payload;
        return roleManagementApi.update(editingRole.id, updatePayload);
      }

      const createPayload: CreateRole = {
        ...payload,
        orgId: currentOrgId,
        code: values.code?.trim() || '',
        type: 'CUSTOM',
      };
      return roleManagementApi.create(createPayload);
    },
    onSuccess: async (role) => {
      message.success(roleModalMode === 'edit' ? '角色已更新' : '角色已新增');
      setRoleModalOpen(false);
      setEditingRole(null);
      roleForm.resetFields();
      await queryClient.invalidateQueries({ queryKey: ['role-management-roles'] });
      setSelectedRoleId(role.id);
      setMemberPage(1);
    },
    onError: () => {
      message.error(roleModalMode === 'edit' ? '更新角色失败' : '新增角色失败');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => roleManagementApi.delete(roleId),
    onSuccess: async (_, roleId) => {
      message.success('角色已删除');
      if (selectedRoleId === roleId) setSelectedRoleId(undefined);
      await queryClient.invalidateQueries({ queryKey: ['role-management-roles'] });
    },
    onError: () => {
      message.error('删除角色失败');
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (values: AddMemberFormValues) => {
      if (!currentOrgId || !selectedRole) throw new Error('Missing role');
      const membershipIds = values.membershipIds || [];
      await Promise.all(
        membershipIds.map((membershipId) =>
          roleManagementApi.bindMember(currentOrgId, {
            roleId: selectedRole.id,
            membershipId,
          })
        )
      );
    },
    onSuccess: async () => {
      message.success('成员已添加到角色');
      setAddMemberOpen(false);
      setEligibleKeyword('');
      addMemberForm.resetFields();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['role-management-members', currentOrgId] }),
        queryClient.invalidateQueries({
          queryKey: ['role-management-eligible-members', currentOrgId],
        }),
      ]);
    },
    onError: () => {
      message.error('添加角色成员失败');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (request: NonNullable<typeof removal>) => {
      const results = await Promise.allSettled(
        request.bindingIds.map((id) => roleManagementApi.unbindMember(request.orgId, id))
      );
      return results.filter((result) => result.status === 'rejected').length;
    },
    onSuccess: async (failed, request) => {
      if (failed) message.error(`有 ${failed} 条角色绑定移除失败，请刷新后重试`);
      else message.success('已从角色中移除成员');
      setRemoval(null);
      setSelectedRowKeys([]);
      setMemberPage(1);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['role-management-members', request.orgId] }),
        queryClient.invalidateQueries({
          queryKey: ['role-management-eligible-members', request.orgId],
        }),
      ]);
    },
  });

  const requestRemoval = (members: MemberRoleOption[]) => {
    if (!currentOrgId || !selectedRole || !members.length || selectedRole.code === 'SUPER_ADMIN')
      return;
    const bindingIds = members.flatMap((member) =>
      (member.roleBindings || [])
        .filter((binding) => binding.roleId === selectedRole.id)
        .map((binding) => binding.id)
    );
    if (
      members.some(
        (member) => !member.roleBindings?.some((binding) => binding.roleId === selectedRole.id)
      )
    ) {
      message.error('未获取到角色绑定信息，请刷新页面后重试');
      return;
    }
    setRemoval({ orgId: currentOrgId, roleName: selectedRole.name, members, bindingIds });
  };

  const updateRolePermissionsMutation = useMutation({
    mutationFn: async ({
      roleId,
      permissionIds,
      dataRuleIds,
    }: {
      roleId: string;
      permissionIds: string[];
      dataRuleIds: string[];
    }) => {
      await Promise.all([
        roleManagementApi.update(roleId, { permissionIds }),
        roleManagementApi.setRoleDataRules(roleId, dataRuleIds),
      ]);
    },
    onSuccess: async () => {
      message.success('角色权限与数据规则已更新');
      setPermissionModalOpen(false);
      setPermissionKeyword('');
      await queryClient.invalidateQueries({ queryKey: ['role-management-roles'] });
    },
    onError: () => {
      message.error('更新角色权限失败');
    },
  });

  const handleOpenCreateRole = () => {
    setRoleModalMode('create');
    setEditingRole(null);
    roleForm.setFieldsValue({
      name: '',
      code: '',
      description: '',
      level: 10,
      active: true,
    });
    setRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: Role) => {
    setRoleModalMode('edit');
    setEditingRole(role);
    roleForm.setFieldsValue({
      name: role.name,
      code: role.code,
      description: getRoleDescription(role),
      level: role.level,
      active: role.active,
    });
    setRoleModalOpen(true);
  };

  const handleOpenPermissionModal = () => {
    if (!selectedRole) return;
    setPermissionCheckedKeys(selectedRole.permissionIds || []);
    setPermissionKeyword('');
    setPermissionResource('all');
    setShowSelectedPermissions(false);
    setActivePermissionTab('functional');
    roleManagementApi
      .getRoleDataRules(selectedRole.id)
      .then((rules) => {
        setSelectedDataRuleIds(rules.map((r) => r.id));
      })
      .catch(() => {
        setSelectedDataRuleIds([]);
      });
    setPermissionModalOpen(true);
  };

  const handlePermissionCheck = (permission: PermissionItem, checked: boolean) => {
    const permissionIds = collectPermissionIds(permission);
    setPermissionCheckedKeys((prev) => {
      const next = new Set(prev);
      permissionIds.forEach((permissionId) => {
        if (checked) next.add(permissionId);
        else next.delete(permissionId);
      });
      return Array.from(next);
    });
  };

  const handleSaveRolePermissions = () => {
    if (!selectedRole) return;
    updateRolePermissionsMutation.mutate({
      roleId: selectedRole.id,
      permissionIds: permissionCheckedKeys,
      dataRuleIds: selectedDataRuleIds,
    });
  };

  const handleRoleMenuClick = (key: string, role: Role) => {
    if (key === 'edit') {
      handleOpenEditRole(role);
      return;
    }

    if (key === 'delete') {
      Modal.confirm({
        title: '确定删除该角色吗？',
        content: role.name,
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => deleteRoleMutation.mutate(role.id),
      });
    }
  };

  const getRoleMenuItems = (role: Role): MenuProps['items'] => [
    {
      key: 'edit',
      label: '编辑角色',
      icon: <EditOutlined />,
      disabled: role.type === 'SYSTEM',
    },
    {
      key: 'delete',
      label: '删除角色',
      icon: <DeleteOutlined />,
      danger: true,
      disabled: role.type === 'SYSTEM',
    },
  ];

  const exportMembers = async () => {
    if (!selectedRole || !currentOrgId) return;
    try {
      const firstPage = await orgMemberApi.roleOptions(currentOrgId, {
        page: 1,
        pageSize: 100,
        roleId: selectedRole.id,
        assignment: 'assigned',
      });
      const remainingPages = await Promise.all(
        Array.from({ length: Math.max(0, firstPage.totalPages - 1) }, (_, index) =>
          orgMemberApi.roleOptions(currentOrgId, {
            page: index + 2,
            pageSize: 100,
            roleId: selectedRole.id,
            assignment: 'assigned',
          })
        )
      );
      const members = [firstPage, ...remainingPages].flatMap((page) => page.data);
      downloadCsv(`${selectedRole.name}-成员.csv`, [
        ['姓名', '电子邮箱', '所属部门', '管理范围'],
        ...members.map((member) => [
          getMemberName(member),
          getMemberEmail(member),
          getDepartmentText(member),
          '全部',
        ]),
      ]);
    } catch {
      message.error('导出角色成员失败');
    }
  };

  const importExportItems: MenuProps['items'] = [
    {
      key: 'export',
      label: '导出当前角色成员',
      icon: <ExportOutlined />,
    },
    {
      key: 'import',
      label: '批量导入成员',
      icon: <ImportOutlined />,
      disabled: true,
    },
  ];

  const memberColumns: TableProps<MemberRoleOption>['columns'] = [
    {
      title: '姓名',
      key: 'name',
      width: 130,
      render: (_, record) => {
        const name = getMemberName(record);
        return (
          <span className="org-role-member-name">
            <Avatar
              size={32}
              style={{ backgroundColor: getAvatarColor(record.id) }}
              src={displayString(record.avatar) || undefined}
            >
              {getAvatarText(name)}
            </Avatar>
            <span className="org-role-member-name-text">{name}</span>
          </span>
        );
      },
    },
    {
      title: '电子邮箱',
      key: 'email',
      width: 170,
      ellipsis: true,
      render: (_, record) => getMemberEmail(record),
    },
    {
      title: '所属部门',
      key: 'department',
      width: 150,
      ellipsis: true,
      render: (_, record) => getDepartmentText(record),
    },
    {
      title: '管理范围',
      key: 'scope',
      width: 86,
      render: () => '全部',
    },
    {
      title: '操作',
      key: 'action',
      width: 72,
      render: (_, record) => (
        <Perm permission={PERMISSIONS.ROLE.UPDATE}>
          <Button
            type="link"
            danger
            size="small"
            disabled={selectedRole?.code === 'SUPER_ADMIN'}
            onClick={() => requestRemoval([record])}
          >
            移除
          </Button>
        </Perm>
      ),
    },
  ];

  const renderRoleList = () => {
    if (rolesQuery.isLoading) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="角色加载中" />;
    }

    if (!roles.length) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无角色" />;
    }

    return roles.map((role) => {
      const typeMeta = ROLE_TYPE_META[role.type] || ROLE_TYPE_META.CUSTOM;
      return (
        <div
          key={role.id}
          className={`org-role-item${selectedRole?.id === role.id ? ' is-active' : ''}`}
        >
          <button
            type="button"
            className="org-role-item-main"
            onClick={() => {
              setSelectedRoleId(role.id);
              setSelectedRowKeys([]);
              setMemberPage(1);
            }}
          >
            <UserSwitchOutlined />
            <span className="org-role-item-name">{role.name}</span>
            {role.type === 'SYSTEM' && <Tag color={typeMeta.color}>{typeMeta.label}</Tag>}
          </button>
          <Dropdown
            trigger={['click']}
            menu={{
              items: getRoleMenuItems(role),
              onClick: ({ key, domEvent }) => {
                domEvent.stopPropagation();
                handleRoleMenuClick(key, role);
              },
            }}
          >
            <Button
              type="text"
              size="small"
              className="org-role-item-menu"
              icon={<EllipsisOutlined />}
              onClick={(event) => event.stopPropagation()}
            />
          </Dropdown>
        </div>
      );
    });
  };

  const renderPermissions = (permissions: FlatPermission[]) => {
    if (!permissions.length) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前范围暂无权限" />;
    }

    return permissions.map((permission) => {
      const descendantIds = collectPermissionIds(permission);
      const selectedDescendantCount = descendantIds.filter((id) =>
        checkedPermissionSet.has(id)
      ).length;
      const checked = checkedPermissionSet.has(permission.id);
      const typeMeta = PERMISSION_TYPE_META[permission.type] || {
        label: permission.type,
        color: 'default',
      };

      return (
        <div key={permission.id} className="org-role-permission-node">
          <label className="org-role-permission-node-main">
            <Checkbox
              checked={checked}
              indeterminate={!checked && selectedDescendantCount > 0}
              onChange={(event) => handlePermissionCheck(permission, event.target.checked)}
            />
            <span
              className="org-role-permission-copy"
              style={{ paddingLeft: permission.depth * 12 }}
            >
              <span className="org-role-permission-name">{permission.name}</span>
              <span className="org-role-permission-code">{permission.code}</span>
            </span>
            <Tag color={typeMeta.color}>{typeMeta.label}</Tag>
          </label>
        </div>
      );
    });
  };

  return (
    <div className="org-role-page">
      {!currentOrgId && (
        <Alert
          type="warning"
          showIcon
          message="当前账号未关联组织"
          description="请联系管理员将账号加入组织后再管理组织角色。"
          style={{ marginBottom: 16 }}
        />
      )}

      <div className="org-role-shell">
        <aside className="org-role-list-pane">
          <Input
            allowClear
            className="org-role-search"
            prefix={<SearchOutlined />}
            placeholder="搜索角色"
            value={roleKeyword}
            onChange={(event) => setRoleKeyword(event.target.value)}
          />

          <div className="org-role-list">{renderRoleList()}</div>

          <Perm permission={PERMISSIONS.ROLE.CREATE}>
            <Button
              block
              className="org-role-new-button"
              onClick={handleOpenCreateRole}
              disabled={!currentOrgId}
            >
              新增角色
            </Button>
          </Perm>
        </aside>

        <main className="org-role-content">
          {selectedRole ? (
            <>
              <div className="org-role-header">
                <div className="org-role-title">
                  <Title level={4}>{selectedRole.name}</Title>
                  <Text type="secondary" ellipsis className="org-role-code">
                    {selectedRole.code}
                  </Text>
                </div>
                <span className="org-role-count">
                  <UserOutlined />
                  {membersQuery.data?.total || 0}
                </span>
              </div>

              <div className="org-role-toolbar">
                <Input
                  allowClear
                  className="org-role-member-search"
                  prefix={<SearchOutlined />}
                  placeholder="搜索成员姓名"
                  value={memberKeyword}
                  onChange={(event) => {
                    setMemberKeyword(event.target.value);
                    setSelectedRowKeys([]);
                    setMemberPage(1);
                  }}
                />
                <Space size="small" wrap>
                  <Perm permission={PERMISSIONS.ROLE.ASSIGN_PERMISSION}>
                    <Tooltip title={selectedRole.type === 'SYSTEM' ? '系统角色不可配置权限' : ''}>
                      <span>
                        <Button
                          icon={<SafetyCertificateOutlined />}
                          onClick={handleOpenPermissionModal}
                          disabled={selectedRole.type === 'SYSTEM'}
                        >
                          配置权限
                        </Button>
                      </span>
                    </Tooltip>
                  </Perm>
                  <Perm permission={PERMISSIONS.ROLE.UPDATE}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        addMemberForm.resetFields();
                        setEligibleKeyword('');
                        setAddMemberOpen(true);
                      }}
                      disabled={!currentOrgId || !selectedRole.active}
                    >
                      添加成员
                    </Button>
                  </Perm>
                  <Dropdown
                    menu={{
                      items: importExportItems,
                      onClick: ({ key }) => {
                        if (key === 'export') void exportMembers();
                      },
                    }}
                  >
                    <Button>批量导入/导出</Button>
                  </Dropdown>
                  <Perm permission={PERMISSIONS.ROLE.UPDATE}>
                    <Button
                      danger
                      disabled={selectedRole.code === 'SUPER_ADMIN' || !selectedRowKeys.length}
                      onClick={() =>
                        requestRemoval(
                          roleMembers.filter((member) => selectedRowKeys.includes(member.id))
                        )
                      }
                    >
                      移除成员{selectedRowKeys.length ? `（${selectedRowKeys.length}）` : ''}
                    </Button>
                  </Perm>
                </Space>
              </div>

              {selectedRole.code === 'SUPER_ADMIN' && (
                <Alert
                  type="info"
                  showIcon
                  message="超级管理员受保护，不支持在此移除。"
                  style={{ marginBottom: 12 }}
                />
              )}
              <Table
                columns={memberColumns}
                dataSource={roleMembers}
                rowKey="id"
                loading={membersQuery.isLoading || membersQuery.isFetching}
                rowSelection={{
                  getCheckboxProps: () => ({ disabled: selectedRole.code === 'SUPER_ADMIN' }),
                  selectedRowKeys,
                  onChange: setSelectedRowKeys,
                }}
                pagination={{
                  current: membersQuery.data?.page || memberPage,
                  pageSize: membersQuery.data?.pageSize || 20,
                  total: membersQuery.data?.total || 0,
                  showSizeChanger: false,
                  onChange: (page) => {
                    setMemberPage(page);
                    setSelectedRowKeys([]);
                  },
                }}
                locale={{
                  emptyText: (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无角色成员" />
                  ),
                }}
              />
            </>
          ) : (
            <div className="org-role-empty">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择角色" />
            </div>
          )}
        </main>
      </div>

      <Modal
        title={`从「${removal?.roleName || ''}」移除成员`}
        open={!!removal}
        onCancel={() => {
          if (!removeMemberMutation.isPending) setRemoval(null);
        }}
        onOk={() => {
          if (removal) removeMemberMutation.mutate(removal);
        }}
        confirmLoading={removeMemberMutation.isPending}
        okText="确认移除"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        <p>将移除 {removal?.members.map(getMemberName).join('、')} 的此角色权限。</p>
        <p>成员仍保留在组织中，其他角色不受影响。</p>
      </Modal>

      <Modal
        title={roleModalMode === 'edit' ? '编辑角色' : '新增角色'}
        open={roleModalOpen}
        onOk={() => roleForm.validateFields().then((values) => saveRoleMutation.mutate(values))}
        onCancel={() => {
          setRoleModalOpen(false);
          setEditingRole(null);
          roleForm.resetFields();
        }}
        confirmLoading={saveRoleMutation.isPending}
        okText="保存"
        cancelText="取消"
        width={560}
        destroyOnHidden
      >
        <Form form={roleForm} layout="vertical">
          <div className="org-role-form-section">角色信息</div>
          <Form.Item
            label="角色名称"
            name="name"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item
            label="角色编码"
            name="code"
            rules={[{ required: roleModalMode === 'create', message: '请输入角色编码' }]}
          >
            <Input disabled={roleModalMode === 'edit'} placeholder="请输入角色编码" />
          </Form.Item>
          <Form.Item label="角色描述" name="description">
            <TextArea rows={3} placeholder="请输入角色描述" />
          </Form.Item>
          <Form.Item label="角色级别" name="level">
            <InputNumber min={1} max={999} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="启用状态" name="active" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`添加成员到 ${selectedRole?.name || '角色'}`}
        open={addMemberOpen}
        onOk={() =>
          addMemberForm.validateFields().then((values) => addMemberMutation.mutate(values))
        }
        onCancel={() => {
          setAddMemberOpen(false);
          setEligibleKeyword('');
          addMemberForm.resetFields();
        }}
        confirmLoading={addMemberMutation.isPending}
        okText="添加"
        cancelText="取消"
        width={640}
        destroyOnHidden
      >
        <Form form={addMemberForm} layout="vertical">
          <Form.Item
            label="成员"
            name="membershipIds"
            rules={[{ required: true, message: '请选择成员' }]}
          >
            <Select
              mode="multiple"
              showSearch
              filterOption={false}
              onSearch={setEligibleKeyword}
              loading={eligibleMembersQuery.isLoading || eligibleMembersQuery.isFetching}
              placeholder="搜索并选择成员"
              options={eligibleMembers.map((member) => {
                const name = getMemberName(member);
                const email = getMemberEmail(member);
                return {
                  label: `${name}${email === '-' ? '' : ` (${email})`}`,
                  value: member.id,
                };
              })}
              notFoundContent="暂无可添加成员"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`配置 ${selectedRole?.name || '角色'} 权限`}
        open={permissionModalOpen}
        onOk={handleSaveRolePermissions}
        onCancel={() => {
          setPermissionModalOpen(false);
          setPermissionKeyword('');
          setPermissionResource('all');
          setShowSelectedPermissions(false);
        }}
        okText="保存"
        cancelText="取消"
        width={960}
        confirmLoading={updateRolePermissionsMutation.isPending}
        destroyOnHidden
      >
        <Tabs
          activeKey={activePermissionTab}
          onChange={(key) => setActivePermissionTab(key as 'functional' | 'dataRules')}
          items={[
            {
              key: 'functional',
              label: `功能权限 (${permissionCheckedKeys.length})`,
              children: (
                <div className="org-role-permission-modal">
                  <div className="org-role-permission-toolbar">
                    <Input
                      allowClear
                      prefix={<SearchOutlined />}
                      placeholder="搜索权限名称、编码或资源"
                      value={permissionKeyword}
                      onChange={(event) => setPermissionKeyword(event.target.value)}
                    />
                    <Space size="small">
                      <Button
                        onClick={() => {
                          setPermissionCheckedKeys((current) =>
                            Array.from(
                              new Set([...current, ...visiblePermissions.map((item) => item.id)])
                            )
                          );
                        }}
                        disabled={!visiblePermissions.length}
                      >
                        选择当前结果
                      </Button>
                      <Button
                        onClick={() => {
                          const visibleIds = new Set(visiblePermissions.map((item) => item.id));
                          setPermissionCheckedKeys((current) =>
                            current.filter((id) => !visibleIds.has(id))
                          );
                        }}
                        disabled={
                          !visiblePermissions.some((item) => checkedPermissionSet.has(item.id))
                        }
                      >
                        清除当前结果
                      </Button>
                    </Space>
                  </div>
                  <div className="org-role-permission-summary">
                    <Text type="secondary">
                      已选择 {permissionCheckedKeys.length} / {flatPermissions.length} 项权限
                    </Text>
                    <Button
                      type={showSelectedPermissions ? 'primary' : 'text'}
                      size="small"
                      onClick={() => setShowSelectedPermissions((current) => !current)}
                    >
                      {showSelectedPermissions ? '查看全部' : '仅看已选'}
                    </Button>
                  </div>
                  <div className="org-role-permission-browser">
                    <aside className="org-role-permission-groups" aria-label="权限分类">
                      <button
                        type="button"
                        className={`org-role-permission-group${permissionResource === 'all' ? ' is-active' : ''}`}
                        onClick={() => setPermissionResource('all')}
                      >
                        <span>
                          <FolderOutlined /> 全部权限
                        </span>
                        <span>{flatPermissions.length}</span>
                      </button>
                      {permissionResourceGroups.map((group) => {
                        const selectedCount = group.permissions.filter((permission) =>
                          checkedPermissionSet.has(permission.id)
                        ).length;
                        return (
                          <button
                            type="button"
                            key={group.resource}
                            className={`org-role-permission-group${permissionResource === group.resource ? ' is-active' : ''}`}
                            onClick={() => setPermissionResource(group.resource)}
                          >
                            <span>{group.label}</span>
                            <span>
                              {selectedCount ? `${selectedCount}/` : ''}
                              {group.permissions.length}
                            </span>
                          </button>
                        );
                      })}
                    </aside>
                    <div className="org-role-permission-list">
                      <div className="org-role-permission-list-header">
                        <Text strong>
                          {permissionResource === 'all'
                            ? '全部权限'
                            : permissionResourceGroups.find(
                                (group) => group.resource === permissionResource
                              )?.label || permissionResource}
                        </Text>
                        <Text type="secondary">{visiblePermissions.length} 项</Text>
                      </div>
                      <div className="org-role-permission-tree">
                        {permissionTreeQuery.isLoading ? (
                          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="权限加载中" />
                        ) : (
                          renderPermissions(visiblePermissions)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'dataRules',
              label: `数据规则 (${selectedDataRuleIds.length})`,
              children: (
                <div className="org-role-data-rules-pane">
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message="为该角色分配生效的数据规则。登录后，系统会自动合并该用户拥有的所有数据规则，并通过 CASL 引擎在数据库查询时动态执行数据隔离。"
                  />
                  {dataRulesQuery.isLoading ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="规则加载中..." />
                  ) : !dataRulesQuery.data?.data?.length ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="系统暂无数据规则，请前往「治理中心 - 权限管理 - 数据规则」新建规则"
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {Array.from(
                        dataRulesQuery.data.data.reduce((acc, rule) => {
                          const res = rule.resource || 'other';
                          acc.set(res, [...(acc.get(res) || []), rule]);
                          return acc;
                        }, new Map<string, typeof dataRulesQuery.data.data>())
                      ).map(([resource, rules]) => (
                        <Card
                          key={resource}
                          size="small"
                          title={
                            <Space>
                              <Tag color="cyan">{resource.toUpperCase()}</Tag>
                              <Text strong>{resource} 资源规则</Text>
                            </Space>
                          }
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {rules.map((rule) => {
                              const isChecked = selectedDataRuleIds.includes(rule.id);
                              const explanation = explainCondition(rule.condition, rule.resource);
                              return (
                                <div
                                  key={rule.id}
                                  className={`org-role-data-rule-card${isChecked ? ' is-selected' : ''}`}
                                  onClick={() => {
                                    setSelectedDataRuleIds((prev) =>
                                      isChecked
                                        ? prev.filter((id) => id !== rule.id)
                                        : [...prev, rule.id]
                                    );
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                    }}
                                  >
                                    <Space>
                                      <Checkbox checked={isChecked} />
                                      <Text strong>{rule.name}</Text>
                                      {(() => {
                                        const actionMeta = getActionMeta(rule.action);
                                        return <Tag color={actionMeta.color}>{actionMeta.key}</Tag>;
                                      })()}
                                      <span className="permission-code">{rule.code}</span>
                                    </Space>
                                    <Tag color={rule.active ? 'success' : 'default'}>
                                      {rule.active ? '启用' : '停用'}
                                    </Tag>
                                  </div>
                                  <div style={{ marginTop: 4, paddingLeft: 24 }}>
                                    <Text style={{ fontSize: 13, color: '#1677ff' }}>
                                      业务释义：{explanation}
                                    </Text>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
}
