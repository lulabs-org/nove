import { useEffect, useMemo, useState } from 'react';
import Button from 'antd/es/button';
import Empty from 'antd/es/empty';
import Input from 'antd/es/input';
import message from 'antd/es/message';
import Popconfirm from 'antd/es/popconfirm';
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Tooltip from 'antd/es/tooltip';
import Typography from 'antd/es/typography';
import type { TableProps } from 'antd/es/table';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Perm } from '../../../../../app/guards/Perm';
import { PERMISSIONS } from '../../../../../shared/utils/permissions';
import {
  permissionManagementApi,
  type PermissionItem,
  type PermissionListParams,
} from '../../api/permissionManagementApi';
import {
  PERMISSION_TYPE_OPTIONS,
  type PermissionFilters,
  type PermissionModalMode,
  type PermissionResourceGroup,
} from '../../types';
import {
  displayNullableText,
  flattenPermissions,
  formatDateTime,
  getPermissionTypeMeta,
  toQueryParams,
} from '../../utils';
import { PermissionFormModal } from './PermissionFormModal';
import { PermissionResourceTree } from './PermissionResourceTree';

const { Text } = Typography;

interface PermissionTabProps {
  onTotalChange?: (total: number) => void;
}

export function PermissionTab({ onTotalChange }: PermissionTabProps) {
  const queryClient = useQueryClient();
  const [permissionFilters, setPermissionFilters] = useState<PermissionFilters>({
    page: 1,
    pageSize: 10,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<PermissionModalMode>('create');
  const [editingPermission, setEditingPermission] = useState<PermissionItem | null>(null);
  const [initialParentId, setInitialParentId] = useState<string | undefined>(undefined);

  const permissionTreeQuery = useQuery({
    queryKey: ['permission-management-tree'],
    queryFn: permissionManagementApi.permissionTree,
  });

  const permissionListQuery = useQuery({
    queryKey: ['permission-management-list', permissionFilters],
    queryFn: () =>
      permissionManagementApi.listPermissions(
        toQueryParams(permissionFilters) as PermissionListParams
      ),
  });

  const flatPermissions = useMemo(
    () => flattenPermissions(permissionTreeQuery.data || []),
    [permissionTreeQuery.data]
  );

  const resourceGroups = useMemo(() => {
    const groups = new Map<string, PermissionResourceGroup>();
    flatPermissions.forEach((permission) => {
      const resource = permission.resource || '未分组';
      const group = groups.get(resource) || {
        resource,
        count: 0,
        activeCount: 0,
      };
      group.count += 1;
      if (permission.active) group.activeCount += 1;
      groups.set(resource, group);
    });
    return Array.from(groups.values()).sort((first, second) =>
      first.resource.localeCompare(second.resource)
    );
  }, [flatPermissions]);

  const totalCount = permissionListQuery.data?.total || 0;

  useEffect(() => {
    onTotalChange?.(totalCount);
  }, [totalCount, onTotalChange]);

  const parentOptions = useMemo(
    () =>
      flatPermissions
        .filter((permission) => permission.id !== editingPermission?.id)
        .map((permission) => ({
          label: `${'　'.repeat(permission.depth)}${permission.name}`,
          value: permission.id,
        })),
    [editingPermission?.id, flatPermissions]
  );

  const refreshPermissions = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['permission-management-list'] }),
      queryClient.invalidateQueries({ queryKey: ['permission-management-tree'] }),
    ]);
  };

  const deletePermissionMutation = useMutation({
    mutationFn: (permissionId: string) => permissionManagementApi.deletePermission(permissionId),
    onSuccess: async () => {
      message.success('权限已删除');
      await refreshPermissions();
    },
    onError: () => {
      message.error('删除权限失败');
    },
  });

  const handleFilterChange = (field: keyof PermissionFilters, value: unknown) => {
    setPermissionFilters((prev) => ({
      ...prev,
      [field]: value === '' || value === null ? undefined : value,
      page: 1,
    }));
  };

  const openCreatePermission = (parentId?: string) => {
    setModalMode('create');
    setEditingPermission(null);
    setInitialParentId(parentId);
    setModalOpen(true);
  };

  const openEditPermission = (permission: PermissionItem) => {
    setModalMode('edit');
    setEditingPermission(permission);
    setInitialParentId(undefined);
    setModalOpen(true);
  };

  const permissionColumns: TableProps<PermissionItem>['columns'] = [
    {
      title: '权限名称',
      key: 'name',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <SafetyCertificateOutlined />
          <Text strong>{record.name}</Text>
        </Space>
      ),
    },
    {
      title: '权限编码',
      dataIndex: 'code',
      key: 'code',
      width: 180,
      ellipsis: true,
      render: (code: string) => <span className="permission-code">{code}</span>,
    },
    {
      title: '资源/动作',
      key: 'resource',
      width: 170,
      render: (_, record) => (
        <Space size={4}>
          <Tag>{record.resource}</Tag>
          <Text type="secondary">{record.action}</Text>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 96,
      render: (type: string) => {
        const meta = getPermissionTypeMeta(type);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'active',
      key: 'active',
      width: 90,
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>{active ? '启用' : '停用'}</Tag>
      ),
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      width: 220,
      render: (description: unknown) => (
        <span className="permission-description">{displayNullableText(description) || '-'}</span>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Perm permission={PERMISSIONS.PERMISSION.UPDATE}>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditPermission(record)}
            >
              编辑
            </Button>
          </Perm>
          <Perm permission={PERMISSIONS.PERMISSION.DELETE}>
            <Popconfirm
              title="确定删除该权限吗？"
              okText="删除"
              cancelText="取消"
              onConfirm={() => deletePermissionMutation.mutate(record.id)}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Perm>
        </Space>
      ),
    },
  ];

  return (
    <div className="permission-content-shell">
      <PermissionResourceTree
        loading={permissionTreeQuery.isLoading}
        resourceGroups={resourceGroups}
        totalPermissions={flatPermissions.length}
        selectedResource={permissionFilters.resource}
        onSelectResource={(resource) => handleFilterChange('resource', resource)}
      />

      <main className="permission-table-pane">
        <div className="permission-toolbar permission-item-toolbar">
          <div className="permission-filters permission-item-filters">
            <Input
              allowClear
              className="permission-search"
              prefix={<SearchOutlined />}
              placeholder="搜索权限"
              aria-label="搜索名称、编码、资源或动作"
              value={permissionFilters.keyword}
              onChange={(event) => handleFilterChange('keyword', event.target.value)}
            />
            <Select
              allowClear
              className="permission-type-filter"
              placeholder="权限类型"
              value={permissionFilters.type}
              onChange={(value) => handleFilterChange('type', value)}
              options={PERMISSION_TYPE_OPTIONS.map(({ label, value }) => ({ label, value }))}
            />
            <Select
              allowClear
              className="permission-status-filter"
              placeholder="状态"
              value={permissionFilters.active}
              onChange={(value) => handleFilterChange('active', value)}
              options={[
                { label: '启用', value: true },
                { label: '停用', value: false },
              ]}
            />
          </div>
          <Space size="small" wrap>
            <Tooltip title="刷新">
              <Button
                icon={<ReloadOutlined />}
                loading={permissionListQuery.isFetching || permissionTreeQuery.isFetching}
                onClick={refreshPermissions}
              />
            </Tooltip>
            <Perm permission={PERMISSIONS.PERMISSION.CREATE}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreatePermission()}>
                新建权限
              </Button>
            </Perm>
          </Space>
        </div>

        <Table
          columns={permissionColumns}
          dataSource={permissionListQuery.data?.data || []}
          rowKey="id"
          loading={permissionListQuery.isLoading}
          expandable={{ showExpandColumn: false }}
          pagination={{
            current: permissionFilters.page,
            pageSize: permissionFilters.pageSize,
            total: permissionListQuery.data?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 1256 }}
          onChange={(pagination) =>
            setPermissionFilters((prev) => ({
              ...prev,
              page: pagination.current || 1,
              pageSize: pagination.pageSize || 10,
            }))
          }
          locale={{
            emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无权限" />,
          }}
        />
      </main>

      <PermissionFormModal
        open={modalOpen}
        mode={modalMode}
        editingPermission={editingPermission}
        parentOptions={parentOptions}
        defaultResource={permissionFilters.resource}
        initialParentId={initialParentId}
        onCancel={() => {
          setModalOpen(false);
          setEditingPermission(null);
        }}
        onSuccess={async () => {
          setModalOpen(false);
          setEditingPermission(null);
          await refreshPermissions();
        }}
      />
    </div>
  );
}
