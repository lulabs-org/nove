import Alert from 'antd/es/alert';
import Avatar from 'antd/es/avatar';
import Button from 'antd/es/button';
import Checkbox from 'antd/es/checkbox';
import DatePicker from 'antd/es/date-picker';
import Drawer from 'antd/es/drawer';
import Dropdown from 'antd/es/dropdown';
import Empty from 'antd/es/empty';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import message from 'antd/es/message';
import Modal from 'antd/es/modal';
import Popconfirm from 'antd/es/popconfirm';
import Radio from 'antd/es/radio';
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import Table from 'antd/es/table';
import Tabs from 'antd/es/tabs';
import Tag from 'antd/es/tag';
import Tooltip from 'antd/es/tooltip';
import Typography from 'antd/es/typography';
import type { MenuProps } from 'antd/es/menu';
import type { TableProps } from 'antd/es/table';
import {
  ApartmentOutlined,
  BankOutlined,
  CheckCircleFilled,
  DeleteOutlined,
  DragOutlined,
  EditOutlined,
  EllipsisOutlined,
  LeftOutlined,
  PlusOutlined,
  ReloadOutlined,
  RightOutlined,
  SearchOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo, useState, type CSSProperties, type Key } from 'react';
import { Perm } from '../../../app/guards/Perm';
import { useAuth } from '../../../shared/hooks/useAuth';
import {
  useTableDeleteMutation,
  useTableMutation,
  useTableQuery,
  type TableQueryParams,
} from '../../../shared/hooks/useTableQuery';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import {
  orgMemberApi,
  type CreateDepartment,
  type CreateOrgMember,
  type OrgMember,
  type OrgMemberDetail,
  type OrgMemberListParams,
  type UpdateDepartment,
  type UpdateOrgMember,
  type UpdateOrgMemberDepartments,
} from './api/orgMemberApi';
import type { DepartmentTreeDto, RoleDto } from '../../../shared/lib/api/orval/business/schemas';
import {
  buildCreateMemberPayload,
  DEFAULT_MEMBER_COUNTRY_CODE,
  getMemberApiErrorMessage,
  hasMemberContact,
  type CreateMemberFormValues,
} from './lib/memberCreation';
import './OrgMemberManagement.css';

const { Search } = Input;
const { Text, Title } = Typography;

type MemberType = 'INTERNAL' | 'EXTERNAL';
type MemberStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'LEFT';
type OrgMemberTab = 'members' | 'departments' | 'left';
type DepartmentModalMode = 'create' | 'edit';

interface DepartmentOption {
  label: string;
  value: string;
}

interface DepartmentRow extends DepartmentTreeDto {
  depth: number;
  pathName: string;
}

interface MemberFormValues extends CreateMemberFormValues {
  primaryDeptId?: string;
  departmentIds?: string[];
  joinedAt?: dayjs.Dayjs;
}

interface DepartmentFormValues {
  name?: string;
  code?: string;
  parentId?: string;
  leaderUserId?: string;
  description?: string;
  active?: boolean;
}

interface BatchDepartmentValues {
  primaryDeptId?: string;
  departmentIds?: string[];
}

const ROOT_DEPARTMENT_ID = '__root__';
const TREE_PANE_DEFAULT_WIDTH = 276;
const TREE_PANE_MIN_WIDTH = 220;
const TREE_PANE_MAX_WIDTH = 420;
const TREE_PANE_COLLAPSED_WIDTH = 0;

const MEMBER_TYPE_OPTIONS: Array<{ label: string; value: MemberType }> = [
  { label: '正式', value: 'INTERNAL' },
  { label: '外部', value: 'EXTERNAL' },
];

const MEMBER_STATUS_META: Record<MemberStatus, { label: string; color: string }> = {
  INVITED: { label: '已邀请', color: 'processing' },
  ACTIVE: { label: '正常', color: 'success' },
  SUSPENDED: { label: '已停用', color: 'warning' },
  LEFT: { label: '已离职', color: 'default' },
};

const AVATAR_COLORS = ['#3370ff', '#00a870', '#ff8800', '#7b61ff', '#e65050', '#14a9a0'];

function displayString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : '';
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN', { hour12: false });
}

function getProfileDisplayName(profile: unknown) {
  if (!profile || typeof profile !== 'object') return '';
  return displayString((profile as { displayName?: unknown }).displayName);
}

function getMemberName(member: OrgMember | OrgMemberDetail) {
  return (
    displayString(member.orgDisplayName) ||
    getProfileDisplayName(member.user?.profile) ||
    displayString(member.user?.username) ||
    displayString(member.user?.email) ||
    displayString(member.user?.phone) ||
    member.userId ||
    member.id
  );
}

function getMemberContact(member: OrgMember | OrgMemberDetail) {
  const email = displayString(member.user?.email);
  const phone = displayString(member.user?.phone);
  const phoneWithCountryCode = phone
    ? `${displayString(member.user?.countryCode)} ${phone}`.trim()
    : '';
  const username = displayString(member.user?.username);
  return email || phoneWithCountryCode || username || '-';
}

function getMemberTypeLabel(type?: string) {
  return MEMBER_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? type ?? '-';
}

function getMemberStatusMeta(status?: string) {
  return (
    MEMBER_STATUS_META[(status as MemberStatus) || 'ACTIVE'] ?? {
      label: status || '-',
      color: 'default',
    }
  );
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

function flattenDepartments(
  tree: DepartmentTreeDto[],
  depth = 0,
  parentPath = ''
): DepartmentRow[] {
  return tree.flatMap((dept) => {
    const pathName = parentPath ? `${parentPath} / ${dept.name}` : dept.name;
    return [
      { ...dept, depth, pathName },
      ...flattenDepartments(dept.children || [], depth + 1, pathName),
    ];
  });
}

function flattenDepartmentOptions(tree: DepartmentTreeDto[], depth = 0): DepartmentOption[] {
  return tree.flatMap((dept) => [
    { label: `${'　'.repeat(depth)}${dept.name}`, value: dept.id },
    ...flattenDepartmentOptions(dept.children || [], depth + 1),
  ]);
}

function filterDepartmentTree(tree: DepartmentTreeDto[], keyword: string): DepartmentTreeDto[] {
  const value = keyword.trim().toLowerCase();
  if (!value) return tree;

  return tree
    .map((dept) => {
      const children = filterDepartmentTree(dept.children || [], keyword);
      const matched =
        dept.name.toLowerCase().includes(value) || dept.code.toLowerCase().includes(value);

      return matched || children.length ? { ...dept, children } : null;
    })
    .filter((dept): dept is DepartmentTreeDto => Boolean(dept));
}

function normalizeDepartmentIds(primaryDeptId?: string, departmentIds?: string[]) {
  const ids = departmentIds ? [...departmentIds] : [];
  if (primaryDeptId && !ids.includes(primaryDeptId)) ids.unshift(primaryDeptId);
  return [...new Set(ids)];
}

function getSelectedDepartmentName(
  selectedDeptId: string | undefined,
  departmentIndex: Map<string, DepartmentRow>,
  orgName: string
) {
  return selectedDeptId ? departmentIndex.get(selectedDeptId)?.name || '部门' : orgName;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function OrgMemberManagement() {
  const { user, checkPermission } = useAuth();
  const queryClient = useQueryClient();
  const currentOrgId = user?.currentOrgId;
  const canReadOrganization = checkPermission(PERMISSIONS.ORGANIZATION.READ);
  const canReadDepartments = checkPermission(PERMISSIONS.DEPARTMENT.READ);
  const canReadRoles = checkPermission(PERMISSIONS.ROLE.READ);
  const [activeTab, setActiveTab] = useState<OrgMemberTab>('members');
  const [selectedDeptId, setSelectedDeptId] = useState<string | undefined>();
  const [deptKeyword, setDeptKeyword] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [filters, setFilters] = useState<TableQueryParams>({
    page: 1,
    pageSize: 10,
    keyword: '',
    includeChildren: true,
    type: undefined,
    status: undefined,
  });

  const [memberForm] = Form.useForm<MemberFormValues>();
  const [detailEditForm] = Form.useForm<MemberFormValues>();
  const createMemberType = Form.useWatch('type', memberForm);
  const [departmentForm] = Form.useForm<DepartmentFormValues>();
  const [batchDepartmentForm] = Form.useForm<BatchDepartmentValues>();

  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [departmentModalMode, setDepartmentModalMode] = useState<DepartmentModalMode>('create');
  const [editingDepartment, setEditingDepartment] = useState<DepartmentTreeDto | null>(null);
  const [batchDepartmentOpen, setBatchDepartmentOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailMember, setDetailMember] = useState<OrgMemberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailEditing, setDetailEditing] = useState(false);
  const [treePaneWidth, setTreePaneWidth] = useState(TREE_PANE_DEFAULT_WIDTH);
  const [treePaneCollapsed, setTreePaneCollapsed] = useState(false);

  const { data: organization } = useQuery({
    queryKey: ['org-member-organization', currentOrgId],
    queryFn: () => orgMemberApi.organization(currentOrgId!),
    enabled: !!currentOrgId && canReadOrganization,
  });

  const {
    data: departmentTree = [],
    isFetching: departmentFetching,
    refetch: refetchDepartments,
  } = useQuery({
    queryKey: ['org-member-departments', currentOrgId],
    queryFn: () => orgMemberApi.departments(currentOrgId!),
    enabled: !!currentOrgId && canReadDepartments,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['org-member-roles'],
    queryFn: orgMemberApi.roles,
    enabled: canReadRoles,
  });

  const { data: leaderMemberList, isFetching: leaderMembersFetching } = useQuery({
    queryKey: ['org-department-leaders', currentOrgId],
    queryFn: () => orgMemberApi.list(currentOrgId!, { page: 1, pageSize: 1000 }),
    enabled: !!currentOrgId && departmentModalOpen,
  });

  const orgName = organization?.name || '当前组织';
  const allDepartments = useMemo(() => flattenDepartments(departmentTree), [departmentTree]);
  const departmentOptions = useMemo(
    () => flattenDepartmentOptions(departmentTree),
    [departmentTree]
  );
  const parentDepartmentOptions = useMemo(
    () =>
      allDepartments.map((department) => ({
        label: department.pathName,
        value: department.id,
      })),
    [allDepartments]
  );
  const leaderOptions = useMemo(
    () =>
      (leaderMemberList?.data || [])
        .filter((member) => member.status === 'INVITED' || member.status === 'ACTIVE')
        .map((member) => {
          const name = getMemberName(member);
          const contact = getMemberContact(member);
          return {
            label: contact === '-' ? name : `${name}（${contact}）`,
            value: member.userId,
          };
        }),
    [leaderMemberList]
  );
  const departmentIndex = useMemo(
    () => new Map(allDepartments.map((dept) => [dept.id, dept])),
    [allDepartments]
  );
  const filteredDepartmentTree = useMemo(
    () => filterDepartmentTree(departmentTree, deptKeyword),
    [departmentTree, deptKeyword]
  );
  const selectedScopeName = getSelectedDepartmentName(selectedDeptId, departmentIndex, orgName);
  const treePaneColumnWidth = treePaneCollapsed ? TREE_PANE_COLLAPSED_WIDTH : treePaneWidth;
  const structureShellStyle =
    activeTab === 'members'
      ? ({ '--org-tree-pane-width': `${treePaneColumnWidth}px` } as CSSProperties)
      : undefined;
  const memberQueryKey = currentOrgId
    ? `org-members-${currentOrgId}-${activeTab}`
    : 'org-members-no-org';

  const memberParams = useMemo<TableQueryParams>(
    () => ({
      ...filters,
      deptId: activeTab === 'members' || activeTab === 'left' ? selectedDeptId : undefined,
      status: activeTab === 'left' ? 'LEFT' : filters.status,
      includeChildren: filters.includeChildren,
    }),
    [activeTab, filters, selectedDeptId]
  );

  const {
    data: memberList,
    isLoading,
    isFetching,
    refetch,
  } = useTableQuery<OrgMember>({
    queryKey: memberQueryKey,
    queryFn: (params) => {
      if (!currentOrgId || activeTab === 'departments') {
        return Promise.resolve({ data: [], total: 0, page: 1, pageSize: params.pageSize || 10 });
      }

      const { sortField, sortOrder, ...queryParams } = params;
      void sortField;
      void sortOrder;
      return orgMemberApi.list(currentOrgId, queryParams as OrgMemberListParams);
    },
    params: memberParams,
    enabled: !!currentOrgId && activeTab !== 'departments',
  });

  const createMemberMutation = useTableMutation({
    queryKey: memberQueryKey,
    mutationFn: (data: CreateOrgMember) => orgMemberApi.create(currentOrgId!, data),
    onSuccess: () => {
      message.success('成员已添加');
      closeMemberModal();
    },
    onError: (error) => {
      message.error(getMemberApiErrorMessage(error, '添加成员失败'));
    },
  });

  const updateMemberMutation = useTableMutation({
    queryKey: memberQueryKey,
    mutationFn: ({ memberId, data }: { memberId: string; data: UpdateOrgMember }) =>
      orgMemberApi.update(memberId, data),
    onError: () => {
      message.error('保存成员失败');
    },
  });

  const updateDepartmentMutation = useTableMutation({
    queryKey: memberQueryKey,
    mutationFn: ({ memberId, data }: { memberId: string; data: UpdateOrgMemberDepartments }) =>
      orgMemberApi.updateDepartments(memberId, data),
    onError: () => {
      message.error('调整成员部门失败');
    },
  });

  const statusMutation = useTableMutation({
    queryKey: memberQueryKey,
    mutationFn: ({ memberId, status }: { memberId: string; status: MemberStatus }) =>
      orgMemberApi.updateStatus(memberId, { status }),
    onSuccess: () => {
      message.success('成员状态已更新');
    },
    onError: () => {
      message.error('更新成员状态失败');
    },
  });

  const deleteMutation = useTableDeleteMutation({
    queryKey: memberQueryKey,
    mutationFn: orgMemberApi.delete,
    onSuccess: () => {
      message.success('成员已删除');
    },
    onError: () => {
      message.error('删除成员失败');
    },
  });

  const saveDepartmentMutation = useMutation({
    mutationFn: (values: DepartmentFormValues) => {
      if (!currentOrgId) throw new Error('Missing organization');
      const isRootParent = values.parentId === ROOT_DEPARTMENT_ID || !values.parentId;
      const name = values.name?.trim() ?? '';
      const payloadBase = {
        name,
        leaderUserId: values.leaderUserId || undefined,
        description: values.description?.trim() || undefined,
        active: values.active ?? true,
      };

      if (departmentModalMode === 'edit' && editingDepartment) {
        const payload: UpdateDepartment = {
          ...payloadBase,
          code: values.code?.trim(),
          leaderUserId: values.leaderUserId || null,
          parentId: isRootParent ? null : values.parentId,
        };
        return orgMemberApi.updateDepartment(editingDepartment.id, payload);
      }

      const payload: CreateDepartment = {
        ...payloadBase,
        parentId: isRootParent ? undefined : values.parentId,
      };
      return orgMemberApi.createDepartment(currentOrgId, payload);
    },
    onSuccess: async () => {
      message.success(departmentModalMode === 'edit' ? '部门已更新' : '部门已新建');
      closeDepartmentModal();
      await queryClient.invalidateQueries({ queryKey: ['org-member-departments', currentOrgId] });
      await refetchDepartments();
    },
    onError: () => {
      message.error(departmentModalMode === 'edit' ? '更新部门失败' : '新建部门失败');
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: (deptId: string) => orgMemberApi.deleteDepartment(deptId),
    onSuccess: async () => {
      message.success('部门已删除');
      if (selectedDeptId && !departmentIndex.has(selectedDeptId)) setSelectedDeptId(undefined);
      await queryClient.invalidateQueries({ queryKey: ['org-member-departments', currentOrgId] });
      await refetchDepartments();
    },
    onError: () => {
      message.error('删除部门失败');
    },
  });

  const batchDepartmentMutation = useMutation({
    mutationFn: async (values: BatchDepartmentValues) => {
      const departmentIds = normalizeDepartmentIds(values.primaryDeptId, values.departmentIds);
      await Promise.all(
        selectedRowKeys.map((memberId) =>
          orgMemberApi.updateDepartments(String(memberId), {
            primaryDeptId: values.primaryDeptId || undefined,
            departmentIds,
            append: false,
          })
        )
      );
    },
    onSuccess: async () => {
      message.success('批量变更部门完成');
      setBatchDepartmentOpen(false);
      setSelectedRowKeys([]);
      batchDepartmentForm.resetFields();
      await refetch();
    },
    onError: () => {
      message.error('批量变更部门失败');
    },
  });

  const submittingMember =
    createMemberMutation.isPending ||
    updateMemberMutation.isPending ||
    updateDepartmentMutation.isPending;

  const handleFilterChange = (field: string, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value === '' || value === null ? undefined : value,
      page: 1,
    }));
  };

  const handleTableChange: TableProps<OrgMember>['onChange'] = (pagination) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current,
      pageSize: pagination.pageSize,
    }));
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key as OrgMemberTab);
    setSelectedRowKeys([]);
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleSelectDepartment = (deptId?: string) => {
    setSelectedDeptId(deptId);
    setSelectedRowKeys([]);
    setFilters((prev) => ({ ...prev, page: 1 }));
    if (activeTab === 'departments') setActiveTab('members');
  };

  const openCreateMemberModal = () => {
    const defaultDepartmentIds = selectedDeptId ? [selectedDeptId] : [];
    memberForm.setFieldsValue({
      email: '',
      countryCode: DEFAULT_MEMBER_COUNTRY_CODE,
      phone: '',
      type: 'INTERNAL',
      orgDisplayName: '',
      employeeNo: '',
      primaryDeptId: selectedDeptId,
      departmentIds: defaultDepartmentIds,
      roleIds: [],
      externalCompany: '',
      title: '',
      joinedAt: undefined,
    });
    setMemberModalOpen(true);
  };

  const closeMemberModal = () => {
    setMemberModalOpen(false);
    memberForm.resetFields();
  };

  const handleCreateMember = async () => {
    if (!currentOrgId) return;
    const values = await memberForm.validateFields();
    const departmentIds = normalizeDepartmentIds(values.primaryDeptId, values.departmentIds);

    await createMemberMutation.mutateAsync(buildCreateMemberPayload(values, departmentIds));
  };

  const openDetailDrawer = async (record: OrgMember, edit = false) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailEditing(false);
    try {
      const detail = await orgMemberApi.getById(record.id);
      setDetailMember(detail);
      if (edit) {
        setDetailEditing(true);
        fillDetailEditForm(detail);
      }
    } catch {
      message.error('获取成员详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const fillDetailEditForm = (detail: OrgMemberDetail) => {
    detailEditForm.setFieldsValue({
      type: detail.type as MemberType,
      orgDisplayName: displayString(detail.orgDisplayName),
      employeeNo: displayString(detail.employeeNo),
      primaryDeptId: displayString(detail.primaryDeptId) || undefined,
      departmentIds: detail.departments?.map((dept) => dept.id) || [],
      externalCompany: displayString(detail.externalCompany),
      title: displayString(detail.title),
      joinedAt: detail.joinedAt ? dayjs(detail.joinedAt) : undefined,
    });
  };

  const startDetailEdit = () => {
    if (!detailMember) return;
    fillDetailEditForm(detailMember);
    setDetailEditing(true);
  };

  const saveDetailEdit = async () => {
    if (!detailMember) return;
    const values = await detailEditForm.validateFields();
    const departmentIds = normalizeDepartmentIds(values.primaryDeptId, values.departmentIds);

    await updateMemberMutation.mutateAsync({
      memberId: detailMember.id,
      data: {
        type: values.type,
        orgDisplayName: values.orgDisplayName || undefined,
        employeeNo: values.employeeNo || undefined,
        primaryDeptId: values.primaryDeptId || undefined,
        externalCompany: values.externalCompany || undefined,
        title: values.title || undefined,
        joinedAt: values.joinedAt ? values.joinedAt.format('YYYY-MM-DD') : undefined,
      },
    });

    await updateDepartmentMutation.mutateAsync({
      memberId: detailMember.id,
      data: {
        primaryDeptId: values.primaryDeptId || undefined,
        departmentIds,
        append: false,
      },
    });

    const latest = await orgMemberApi.getById(detailMember.id);
    setDetailMember(latest);
    setDetailEditing(false);
    message.success('成员信息已保存');
  };

  const closeDetailDrawer = () => {
    setDetailOpen(false);
    setDetailEditing(false);
    setDetailMember(null);
    detailEditForm.resetFields();
  };

  const handleTreePaneResizeStart = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (treePaneCollapsed) return;
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = treePaneWidth;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextWidth = clampNumber(
        startWidth + moveEvent.clientX - startX,
        TREE_PANE_MIN_WIDTH,
        TREE_PANE_MAX_WIDTH
      );
      setTreePaneWidth(nextWidth);
    };

    const stopResize = () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', stopResize, { once: true });
  };

  const openCreateDepartmentModal = (parentId = selectedDeptId) => {
    setDepartmentModalMode('create');
    setEditingDepartment(null);
    departmentForm.setFieldsValue({
      name: '',
      code: undefined,
      parentId: parentId || ROOT_DEPARTMENT_ID,
      leaderUserId: '',
      description: '',
      active: true,
    });
    setDepartmentModalOpen(true);
  };

  const openEditDepartmentModal = (department: DepartmentTreeDto) => {
    setDepartmentModalMode('edit');
    setEditingDepartment(department);
    departmentForm.setFieldsValue({
      name: department.name,
      code: department.code,
      parentId: displayString(department.parentId) || ROOT_DEPARTMENT_ID,
      leaderUserId: displayString(department.leaderUserId),
      description: displayString(department.description),
      active: department.active,
    });
    setDepartmentModalOpen(true);
  };

  const closeDepartmentModal = () => {
    setDepartmentModalOpen(false);
    setEditingDepartment(null);
    departmentForm.resetFields();
  };

  const handleSaveDepartment = async () => {
    const values = await departmentForm.validateFields();
    const code = values.code?.trim();
    const duplicateDepartment =
      departmentModalMode === 'edit' && code
        ? allDepartments.find(
            (department) => department.code === code && department.id !== editingDepartment?.id
          )
        : undefined;

    if (duplicateDepartment) {
      departmentForm.setFields([
        {
          name: 'code',
          errors: [`部门编码已存在：${duplicateDepartment.name}`],
        },
      ]);
      return;
    }

    await saveDepartmentMutation.mutateAsync({
      ...values,
      name: values.name?.trim(),
      code: departmentModalMode === 'edit' ? code : undefined,
    });
  };

  const handleBulkLeave = async () => {
    await Promise.all(
      selectedRowKeys.map((memberId) =>
        orgMemberApi.updateStatus(String(memberId), { status: 'LEFT' })
      )
    );
    message.success('批量离职处理完成');
    setSelectedRowKeys([]);
    await refetch();
  };

  const memberColumns: TableProps<OrgMember>['columns'] = [
    {
      title: '姓名',
      key: 'name',
      width: 220,
      render: (_, record) => {
        const name = getMemberName(record);
        return (
          <button
            type="button"
            className="org-member-name-cell"
            onClick={() => openDetailDrawer(record)}
          >
            <Avatar
              size={32}
              style={{ backgroundColor: getAvatarColor(record.id) }}
              src={
                displayString((record.user?.profile as { avatar?: unknown } | null)?.avatar) ||
                undefined
              }
            >
              {getAvatarText(name)}
            </Avatar>
            <span className="org-member-name-text">{name}</span>
          </button>
        );
      },
    },
    {
      title: '账号状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: MemberStatus) => {
        const meta = getMemberStatusMeta(status);
        return (
          <Tag color={meta.color} icon={status === 'ACTIVE' ? <CheckCircleFilled /> : undefined}>
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: '登录邮箱/用户名',
      key: 'contact',
      width: 260,
      ellipsis: { showTitle: false },
      render: (_, record) => {
        const contact = getMemberContact(record);
        return (
          <Tooltip title={contact === '-' ? undefined : contact} placement="topLeft">
            <span className="org-member-contact-cell">{contact}</span>
          </Tooltip>
        );
      },
    },
    {
      title: '部门',
      key: 'department',
      width: 160,
      ellipsis: true,
      render: (_, record) => record.primaryDept?.name || '-',
    },
    {
      title: '工号',
      dataIndex: 'employeeNo',
      key: 'employeeNo',
      width: 120,
      render: (value: unknown) => displayString(value) || '-',
    },
    {
      title: '职位',
      dataIndex: 'title',
      key: 'title',
      width: 140,
      ellipsis: true,
      render: (value: unknown) => displayString(value) || '-',
    },
    {
      title: '加入时间',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openDetailDrawer(record)}>
            详情
          </Button>
          <Dropdown
            menu={{
              items: getMemberActionItems(record),
              onClick: ({ key }) => handleMemberAction(key, record),
            }}
            trigger={['click']}
          >
            <Button type="link" size="small" icon={<EllipsisOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const departmentColumns: TableProps<DepartmentTreeDto>['columns'] = [
    {
      title: '部门名称',
      key: 'name',
      render: (_, record) => (
        <Space size="small">
          <ApartmentOutlined />
          <Text strong>{record.name}</Text>
        </Space>
      ),
    },
    {
      title: '部门编码',
      dataIndex: 'code',
      key: 'code',
      width: 180,
    },
    {
      title: '上级部门',
      key: 'parent',
      render: (_, record) =>
        displayString(record.parentId)
          ? departmentIndex.get(displayString(record.parentId))?.name || '-'
          : orgName,
    },
    {
      title: '状态',
      dataIndex: 'active',
      key: 'active',
      width: 100,
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>{active ? '启用' : '停用'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openEditDepartmentModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该部门吗？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => deleteDepartmentMutation.mutate(record.id)}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  function getMemberActionItems(record: OrgMember): MenuProps['items'] {
    return [
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: '编辑信息',
        disabled: !record.id,
      },
      {
        key: 'active',
        label: '设为正常',
        disabled: record.status === 'ACTIVE',
      },
      {
        key: 'suspend',
        label: '停用账号',
        disabled: record.status === 'SUSPENDED',
      },
      {
        key: 'leave',
        label: '操作离职',
        disabled: record.status === 'LEFT',
      },
      {
        type: 'divider',
      },
      {
        key: 'delete',
        danger: true,
        icon: <DeleteOutlined />,
        label: '删除成员',
      },
    ];
  }

  const handleMemberAction = (key: string, record: OrgMember) => {
    if (key === 'edit') {
      openDetailDrawer(record, true);
      return;
    }

    if (key === 'active') {
      statusMutation.mutate({ memberId: record.id, status: 'ACTIVE' });
      return;
    }

    if (key === 'suspend') {
      statusMutation.mutate({ memberId: record.id, status: 'SUSPENDED' });
      return;
    }

    if (key === 'leave') {
      statusMutation.mutate({ memberId: record.id, status: 'LEFT' });
      return;
    }

    if (key === 'delete') {
      Modal.confirm({
        title: '删除成员',
        content: `确定删除 ${getMemberName(record)} 吗？`,
        okText: '删除',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: () => deleteMutation.mutateAsync(record.id),
      });
    }
  };

  const renderDepartmentNodes = (nodes: DepartmentTreeDto[], depth = 0): React.ReactNode => {
    if (!nodes.length && depth === 0) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无部门" />;
    }

    return nodes.map((dept) => (
      <div key={dept.id}>
        <div
          className={`org-dept-node ${selectedDeptId === dept.id ? 'is-active' : ''}`}
          style={{ paddingLeft: 12 + depth * 18 }}
        >
          <button
            type="button"
            className="org-dept-node-main"
            onClick={() => handleSelectDepartment(dept.id)}
          >
            <ApartmentOutlined />
            <span>{dept.name}</span>
          </button>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'create', label: '新建子部门', icon: <PlusOutlined /> },
                { key: 'edit', label: '编辑部门', icon: <EditOutlined /> },
                { key: 'delete', label: '删除部门', danger: true, icon: <DeleteOutlined /> },
              ],
              onClick: ({ key, domEvent }) => {
                domEvent.stopPropagation();
                const row = departmentIndex.get(dept.id);
                if (key === 'create') openCreateDepartmentModal(dept.id);
                if (key === 'edit' && row) openEditDepartmentModal(row);
                if (key === 'delete') deleteDepartmentMutation.mutate(dept.id);
              },
            }}
          >
            <Button type="text" size="small" icon={<EllipsisOutlined />} />
          </Dropdown>
        </div>
        {dept.children?.length ? renderDepartmentNodes(dept.children, depth + 1) : null}
      </div>
    ));
  };

  const renderDetailView = () => {
    if (!detailMember) return null;
    const name = getMemberName(detailMember);
    const statusMeta = getMemberStatusMeta(detailMember.status);
    const departmentText =
      detailMember.departments?.map((dept) => dept.name).join('、') ||
      detailMember.primaryDept?.name ||
      '-';

    return (
      <div className="org-member-detail">
        <div className="org-member-detail-header">
          <Avatar
            size={56}
            style={{ backgroundColor: getAvatarColor(detailMember.id) }}
            src={
              displayString((detailMember.user?.profile as { avatar?: unknown } | null)?.avatar) ||
              undefined
            }
          >
            {getAvatarText(name)}
          </Avatar>
          <div>
            <div className="org-member-detail-title">
              <Title level={4}>{name}</Title>
              <Tag color={statusMeta.color} icon={<CheckCircleFilled />}>
                {statusMeta.label}
              </Tag>
            </div>
            <Text type="secondary">{getMemberContact(detailMember)}</Text>
          </div>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'edit', label: '编辑基本信息', icon: <EditOutlined /> },
                { key: 'active', label: '设为正常' },
                { key: 'suspend', label: '停用账号' },
                { key: 'leave', label: '操作离职' },
              ],
              onClick: ({ key }) => handleMemberAction(key, detailMember as OrgMember),
            }}
          >
            <Button type="link">更多操作</Button>
          </Dropdown>
        </div>

        <Tabs
          defaultActiveKey="basic"
          items={[
            {
              key: 'basic',
              label: '基本信息',
              children: (
                <div className="org-detail-fields">
                  <DetailField label="姓名" value={name} />
                  <DetailField label="别名" value="-" />
                  <DetailField label="用户 ID" value={detailMember.userId} />
                  <DetailField
                    label="登录邮箱"
                    value={displayString(detailMember.user?.email) || '-'}
                  />
                  <DetailField
                    label="登录手机号"
                    value={
                      detailMember.user?.phone
                        ? `${displayString(detailMember.user.countryCode)} ${displayString(detailMember.user.phone)}`.trim()
                        : '-'
                    }
                  />
                  <DetailField label="部门" value={departmentText} />
                  <DetailField label="隐藏手机号" value="手机号可见" />
                  <DetailField label="性别" value="保密" />
                </div>
              ),
            },
            {
              key: 'work',
              label: '工作信息',
              children: (
                <div className="org-detail-fields">
                  <DetailField label="成员类型" value={getMemberTypeLabel(detailMember.type)} />
                  <DetailField label="职位" value={displayString(detailMember.title) || '-'} />
                  <DetailField label="工号" value={displayString(detailMember.employeeNo) || '-'} />
                  <DetailField
                    label="外部公司"
                    value={displayString(detailMember.externalCompany) || '-'}
                  />
                  <DetailField label="加入时间" value={formatDateTime(detailMember.joinedAt)} />
                </div>
              ),
            },
            {
              key: 'login',
              label: '登录方式',
              children: (
                <div className="org-detail-fields">
                  <DetailField
                    label="登录邮箱"
                    value={displayString(detailMember.user?.email) || '-'}
                  />
                  <DetailField
                    label="用户名"
                    value={displayString(detailMember.user?.username) || '-'}
                  />
                </div>
              ),
            },
            {
              key: 'role',
              label: '席位信息',
              children: (
                <div className="org-detail-fields">
                  <DetailField
                    label="已绑定角色"
                    value={
                      detailMember.roles?.length
                        ? detailMember.roles.map((role) => role.name).join('、')
                        : '-'
                    }
                  />
                </div>
              ),
            },
            {
              key: 'other',
              label: '其他',
              children: (
                <div className="org-detail-fields">
                  <DetailField label="成员 ID" value={detailMember.id} />
                  <DetailField label="更新时间" value={formatDateTime(detailMember.updatedAt)} />
                </div>
              ),
            },
          ]}
        />

        <div className="org-detail-footer">
          <Button type="primary" onClick={startDetailEdit}>
            编辑基本信息
          </Button>
        </div>
      </div>
    );
  };

  const renderDetailEdit = () => (
    <Form form={detailEditForm} layout="vertical" className="org-member-edit-form">
      <Form.Item
        label="姓名"
        name="orgDisplayName"
        rules={[{ required: true, message: '请输入姓名' }]}
      >
        <Input addonAfter={<BankOutlined />} placeholder="请输入姓名" />
      </Form.Item>
      <Form.Item label="别名" name="externalCompany">
        <Input placeholder="请输入别名或外部公司" />
      </Form.Item>
      <Form.Item
        label="成员类型"
        name="type"
        rules={[{ required: true, message: '请选择成员类型' }]}
      >
        <Select options={MEMBER_TYPE_OPTIONS} />
      </Form.Item>
      <Form.Item
        label="部门"
        name="departmentIds"
        rules={[{ required: true, message: '请选择部门' }]}
      >
        <Select
          allowClear
          mode="multiple"
          showSearch={{ optionFilterProp: 'label' }}
          options={departmentOptions}
          placeholder="请选择部门"
        />
      </Form.Item>
      <Form.Item label="主部门" name="primaryDeptId">
        <Select
          allowClear
          showSearch={{ optionFilterProp: 'label' }}
          options={departmentOptions}
          placeholder="请选择主部门"
        />
      </Form.Item>
      <Form.Item label="职位" name="title">
        <Input addonAfter={<BankOutlined />} placeholder="请输入职位" />
      </Form.Item>
      <Form.Item label="工号" name="employeeNo">
        <Input placeholder="请输入工号" />
      </Form.Item>
      <Form.Item label="入职日期" name="joinedAt">
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>
    </Form>
  );

  const renderMemberToolbar = () => (
    <div className="org-toolbar">
      <Space className="org-toolbar-filters" size="small">
        {activeTab !== 'left' && (
          <Select
            value={filters.status as MemberStatus | undefined}
            placeholder="账号状态"
            allowClear
            style={{ width: 120 }}
            onChange={(value) => handleFilterChange('status', value)}
            disabled={!currentOrgId}
            options={Object.entries(MEMBER_STATUS_META)
              .filter(([status]) => status !== 'LEFT')
              .map(([value, meta]) => ({ value, label: meta.label }))}
          />
        )}
        <Select
          value={filters.type as MemberType | undefined}
          placeholder="成员类型"
          allowClear
          style={{ width: 120 }}
          onChange={(value) => handleFilterChange('type', value)}
          disabled={!currentOrgId}
          options={MEMBER_TYPE_OPTIONS}
        />
        <Checkbox
          checked={Boolean(filters.includeChildren)}
          disabled={!currentOrgId || !selectedDeptId}
          onChange={(event) => handleFilterChange('includeChildren', event.target.checked)}
        >
          展示全部成员
        </Checkbox>
        <Tooltip title="刷新">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isFetching}
            disabled={!currentOrgId}
          />
        </Tooltip>
      </Space>
      {activeTab !== 'left' && (
        <Space className="org-toolbar-actions" size="small">
          <Tooltip title="批量操作离职">
            <Popconfirm
              title="确定将选中成员设为离职吗？"
              okText="确定"
              cancelText="取消"
              disabled={!selectedRowKeys.length}
              onConfirm={handleBulkLeave}
            >
              <Button
                danger
                aria-label="批量操作离职"
                icon={<DeleteOutlined />}
                disabled={!selectedRowKeys.length}
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="批量变更部门">
            <Button
              aria-label="批量变更部门"
              icon={<ApartmentOutlined />}
              disabled={!selectedRowKeys.length}
              onClick={() => {
                batchDepartmentForm.setFieldsValue({
                  primaryDeptId: selectedDeptId,
                  departmentIds: selectedDeptId ? [selectedDeptId] : [],
                });
                setBatchDepartmentOpen(true);
              }}
            />
          </Tooltip>
          <Perm permission={PERMISSIONS.ORG_MEMBER.CREATE}>
            <Button
              icon={<UserAddOutlined />}
              onClick={openCreateMemberModal}
              disabled={!currentOrgId}
            >
              邀请成员
            </Button>
          </Perm>
          <Perm permission={PERMISSIONS.ORG_MEMBER.CREATE}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateMemberModal}
              disabled={!currentOrgId}
            >
              添加成员
            </Button>
          </Perm>
        </Space>
      )}
    </div>
  );

  const renderContent = () => {
    if (activeTab === 'departments') {
      return (
        <>
          <div className="org-toolbar">
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetchDepartments()}
                loading={departmentFetching}
              >
                刷新
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openCreateDepartmentModal()}
              >
                新建部门
              </Button>
            </Space>
          </div>
          <Table
            columns={departmentColumns}
            dataSource={filteredDepartmentTree}
            rowKey="id"
            pagination={false}
            rowClassName={(record) => (!record.children?.length ? 'org-dept-row-no-children' : '')}
            locale={{
              emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无部门" />,
            }}
          />
        </>
      );
    }

    return (
      <>
        {renderMemberToolbar()}
        <Table
          columns={memberColumns}
          dataSource={memberList?.data || []}
          rowKey="id"
          loading={isLoading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            current: filters.page,
            pageSize: filters.pageSize,
            total: memberList?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 1380 }}
          onChange={handleTableChange}
        />
      </>
    );
  };

  return (
    <div className="org-members-page">
      {!currentOrgId && (
        <Alert
          type="warning"
          showIcon
          message="当前账号未关联组织"
          description="请联系管理员将账号加入组织后再管理组织用户。"
          style={{ marginBottom: 16 }}
        />
      )}

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          { key: 'members', label: '成员' },
          ...(canReadDepartments ? [{ key: 'departments', label: '部门' }] : []),
          { key: 'left', label: '已离职成员' },
        ]}
      />

      <div
        className={`org-structure-shell${activeTab !== 'members' || !canReadDepartments ? ' org-structure-shell--no-aside' : ''}`}
        style={structureShellStyle}
      >
        {activeTab === 'members' && canReadDepartments && (
          <aside className={`org-structure-tree-pane${treePaneCollapsed ? ' is-collapsed' : ''}`}>
            <Tooltip title={treePaneCollapsed ? '展开部门树' : '收起部门树'} placement="right">
              <Button
                type="text"
                size="small"
                className="org-tree-collapse-button"
                aria-label={treePaneCollapsed ? '展开部门树' : '收起部门树'}
                icon={treePaneCollapsed ? <RightOutlined /> : <LeftOutlined />}
                onClick={() => setTreePaneCollapsed((collapsed) => !collapsed)}
              />
            </Tooltip>
            {!treePaneCollapsed && (
              <>
                <div className="org-tree-pane-topbar">
                  <Search
                    allowClear
                    prefix={<SearchOutlined />}
                    placeholder="请输入姓名、邮箱、手机号或用户 ID"
                    value={deptKeyword}
                    onChange={(event) => setDeptKeyword(event.target.value)}
                  />
                </div>
                <div className="org-tree-list">
                  <div className={`org-dept-node ${!selectedDeptId ? 'is-active' : ''}`}>
                    <button
                      type="button"
                      className="org-dept-node-main"
                      onClick={() => handleSelectDepartment(undefined)}
                    >
                      <BankOutlined />
                      <span>{orgName}</span>
                    </button>
                    <Dropdown
                      trigger={['click']}
                      menu={{
                        items: [{ key: 'create', label: '新建部门', icon: <PlusOutlined /> }],
                        onClick: () => openCreateDepartmentModal(undefined),
                      }}
                    >
                      <Button type="text" size="small" icon={<EllipsisOutlined />} />
                    </Dropdown>
                  </div>
                  {renderDepartmentNodes(filteredDepartmentTree)}
                </div>
                <Button
                  block
                  icon={<PlusOutlined />}
                  className="org-new-dept-button"
                  onClick={() => openCreateDepartmentModal()}
                  disabled={!currentOrgId}
                >
                  新建部门
                </Button>
                <button
                  type="button"
                  className="org-tree-resize-handle"
                  aria-label="调整部门树宽度"
                  onPointerDown={handleTreePaneResizeStart}
                >
                  <DragOutlined />
                </button>
              </>
            )}
          </aside>
        )}

        <main className="org-structure-content">
          {activeTab === 'members' && (
            <div className="org-scope-header">
              <Space size="middle">
                <Title level={4}>{selectedScopeName}</Title>
                <Text type="secondary">总人数 {memberList?.total || 0}</Text>
              </Space>
            </div>
          )}
          {renderContent()}
        </main>
      </div>

      <Modal
        title="添加成员"
        open={memberModalOpen}
        onOk={handleCreateMember}
        onCancel={closeMemberModal}
        okText="确定"
        cancelText="取消"
        confirmLoading={submittingMember}
        width={680}
        forceRender
        destroyOnHidden
      >
        <Form form={memberForm} layout="vertical">
          <Form.Item
            label="邮箱"
            name="email"
            dependencies={['phone']}
            rules={[
              { type: 'email', message: '请输入正确的邮箱' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  return hasMemberContact(value, getFieldValue('phone'))
                    ? Promise.resolve()
                    : Promise.reject(new Error('手机号与邮箱至少填写一个'));
                },
              }),
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Space align="start" size="middle" style={{ width: '100%' }}>
            <Form.Item
              label="国家代码"
              name="countryCode"
              dependencies={['phone']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    return !getFieldValue('phone') || value
                      ? Promise.resolve()
                      : Promise.reject(new Error('填写手机号时必须提供国家代码'));
                  },
                }),
              ]}
            >
              <Input placeholder="+86" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item
              label="手机号"
              name="phone"
              dependencies={['email']}
              rules={[
                { pattern: /^[\d\s()-]+$/, message: '请输入正确的手机号' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    return hasMemberContact(getFieldValue('email'), value)
                      ? Promise.resolve()
                      : Promise.reject(new Error('手机号与邮箱至少填写一个'));
                  },
                }),
              ]}
            >
              <Input placeholder="请输入手机号" style={{ width: 300 }} />
            </Form.Item>
          </Space>
          <Form.Item
            label="姓名"
            name="orgDisplayName"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="成员在组织内显示的名称" />
          </Form.Item>
          <Form.Item
            label="成员类型"
            name="type"
            rules={[{ required: true, message: '请选择成员类型' }]}
          >
            <Select options={MEMBER_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item label="部门" name="departmentIds">
            <Select
              allowClear
              mode="multiple"
              showSearch={{ optionFilterProp: 'label' }}
              options={departmentOptions}
              placeholder="请选择部门"
            />
          </Form.Item>
          <Form.Item label="主部门" name="primaryDeptId">
            <Select
              allowClear
              showSearch={{ optionFilterProp: 'label' }}
              options={departmentOptions}
              placeholder="请选择主部门"
            />
          </Form.Item>
          <Form.Item label="职位" name="title">
            <Input placeholder="请输入职位" />
          </Form.Item>
          <Form.Item label="工号" name="employeeNo">
            <Input placeholder="请输入工号" />
          </Form.Item>
          {createMemberType === 'EXTERNAL' && (
            <Form.Item label="外部公司" name="externalCompany">
              <Input placeholder="请输入外部公司名称" />
            </Form.Item>
          )}
          <Form.Item label="角色" name="roleIds">
            <Select
              allowClear
              mode="multiple"
              showSearch={{ optionFilterProp: 'label' }}
              options={roles.map((role: RoleDto) => ({
                label: `${role.name} (${role.code})`,
                value: role.id,
              }))}
              placeholder="选择角色"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={departmentModalMode === 'edit' ? '编辑部门' : '新建部门'}
        open={departmentModalOpen}
        onOk={handleSaveDepartment}
        onCancel={closeDepartmentModal}
        okText="确定"
        cancelText="取消"
        confirmLoading={saveDepartmentMutation.isPending}
        width={640}
        forceRender
        destroyOnHidden
      >
        <Form form={departmentForm} layout="vertical" className="org-department-form">
          <div className="org-form-section-title">基本信息</div>
          <Form.Item
            label="部门名称"
            name="name"
            rules={[{ required: true, whitespace: true, message: '请输入部门名称' }]}
          >
            <Input placeholder="请输入部门名称" />
          </Form.Item>
          {departmentModalMode === 'edit' ? (
            <Form.Item label="部门编码" name="code">
              <Input disabled />
            </Form.Item>
          ) : (
            <Form.Item label="部门编码">
              <Input value="创建后自动生成（如 DEPT-0001）" disabled />
            </Form.Item>
          )}
          <Form.Item label="上级部门" name="parentId">
            <Select
              options={[
                { label: orgName, value: ROOT_DEPARTMENT_ID },
                ...parentDepartmentOptions.filter(
                  (option) => option.value !== editingDepartment?.id
                ),
              ]}
              labelRender={({ value }) => {
                if (value === ROOT_DEPARTMENT_ID) return orgName;
                return departmentIndex.get(String(value))?.pathName || '已删除部门';
              }}
            />
          </Form.Item>
          <Form.Item label="部门负责人" name="leaderUserId">
            <Select
              allowClear
              showSearch={{ optionFilterProp: 'label' }}
              options={leaderOptions}
              loading={leaderMembersFetching}
              placeholder="搜索或选择现有成员"
            />
          </Form.Item>
          <Form.Item label="部门描述" name="description">
            <Input.TextArea placeholder="请输入部门描述" rows={3} />
          </Form.Item>
          <Form.Item label="部门状态" name="active">
            <Radio.Group
              options={[
                { label: '启用', value: true },
                { label: '停用', value: false },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量变更部门"
        open={batchDepartmentOpen}
        onOk={() => batchDepartmentMutation.mutate(batchDepartmentForm.getFieldsValue())}
        onCancel={() => setBatchDepartmentOpen(false)}
        okText="确定"
        cancelText="取消"
        confirmLoading={batchDepartmentMutation.isPending}
        forceRender
        destroyOnHidden
      >
        <Form form={batchDepartmentForm} layout="vertical">
          <Form.Item
            label="所属部门"
            name="departmentIds"
            rules={[{ required: true, message: '请选择部门' }]}
          >
            <Select
              allowClear
              mode="multiple"
              showSearch={{ optionFilterProp: 'label' }}
              options={departmentOptions}
              placeholder="请选择部门"
            />
          </Form.Item>
          <Form.Item label="主部门" name="primaryDeptId">
            <Select
              allowClear
              showSearch={{ optionFilterProp: 'label' }}
              options={departmentOptions}
              placeholder="请选择主部门"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="成员详情"
        open={detailOpen}
        size="large"
        onClose={closeDetailDrawer}
        loading={detailLoading}
        className="org-member-detail-drawer"
        extra={
          detailEditing ? (
            <Space>
              <Button onClick={() => setDetailEditing(false)}>取消</Button>
              <Button type="primary" loading={submittingMember} onClick={saveDetailEdit}>
                保存
              </Button>
            </Space>
          ) : null
        }
      >
        {detailEditing ? renderDetailEdit() : renderDetailView()}
      </Drawer>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="org-detail-field">
      <Text type="secondary">{label}</Text>
      <div>{value}</div>
    </div>
  );
}
