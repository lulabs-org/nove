import { useEffect, useState } from 'react';
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
  DatabaseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Perm } from '../../../../../app/guards/Perm';
import { PERMISSIONS } from '../../../../../shared/utils/permissions';
import {
  permissionManagementApi,
  type DataPermissionRule,
  type DataPermissionRuleListParams,
} from '../../api/permissionManagementApi';
import type { DataRuleFilters, DataRuleModalMode } from '../../types';
import { formatDateTime, toQueryParams } from '../../utils';
import { getActionMeta, SYSTEM_ACTIONS } from '../dataRuleConstants';
import { DataRulePreviewModal } from '../DataRulePreviewModal';
import { DataRuleFormModal } from './DataRuleFormModal';

const { Text } = Typography;

interface DataRuleTabProps {
  onTotalChange?: (total: number) => void;
}

export function DataRuleTab({ onTotalChange }: DataRuleTabProps) {
  const queryClient = useQueryClient();
  const [dataRuleFilters, setDataRuleFilters] = useState<DataRuleFilters>({
    page: 1,
    pageSize: 10,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<DataRuleModalMode>('create');
  const [editingDataRule, setEditingDataRule] = useState<DataPermissionRule | null>(null);
  const [previewRule, setPreviewRule] = useState<DataPermissionRule | null>(null);

  const dataRuleListQuery = useQuery({
    queryKey: ['permission-management-data-rules', dataRuleFilters],
    queryFn: () =>
      permissionManagementApi.listDataRules(
        toQueryParams(dataRuleFilters) as DataPermissionRuleListParams
      ),
  });

  const totalCount = dataRuleListQuery.data?.total || 0;

  useEffect(() => {
    onTotalChange?.(totalCount);
  }, [totalCount, onTotalChange]);

  const deleteDataRuleMutation = useMutation({
    mutationFn: (ruleId: string) => permissionManagementApi.deleteDataRule(ruleId),
    onSuccess: async () => {
      message.success('数据规则已删除');
      await queryClient.invalidateQueries({ queryKey: ['permission-management-data-rules'] });
    },
    onError: () => {
      message.error('删除数据规则失败');
    },
  });

  const handleFilterChange = (field: keyof DataRuleFilters, value: unknown) => {
    setDataRuleFilters((prev) => ({
      ...prev,
      [field]: value === '' || value === null ? undefined : value,
      page: 1,
    }));
  };

  const openCreateDataRule = () => {
    setModalMode('create');
    setEditingDataRule(null);
    setModalOpen(true);
  };

  const openEditDataRule = (rule: DataPermissionRule) => {
    setModalMode('edit');
    setEditingDataRule(rule);
    setModalOpen(true);
  };

  const dataRuleColumns: TableProps<DataPermissionRule>['columns'] = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name: string) => (
        <Space size="small">
          <DatabaseOutlined />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: '规则编码',
      dataIndex: 'code',
      key: 'code',
      width: 180,
      ellipsis: true,
      render: (code: string) => <span className="permission-code">{code}</span>,
    },
    {
      title: '资源',
      dataIndex: 'resource',
      key: 'resource',
      width: 130,
      render: (resource: string) => <Tag color="cyan">{resource}</Tag>,
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action?: string) => {
        const meta = getActionMeta(action);
        return (
          <Tooltip title={meta.description}>
            <Tag color={meta.color}>{meta.key}</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: '权限条件 (JSON)',
      dataIndex: 'condition',
      key: 'condition',
      width: 320,
      render: (condition: string) => (
        <Tooltip
          title={
            <div style={{ maxWidth: 400 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>条件 JSON:</div>
              <pre style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap' }}>{condition}</pre>
            </div>
          }
        >
          <span className="permission-condition">{condition}</span>
        </Tooltip>
      ),
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
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setPreviewRule(record)}
          >
            预览
          </Button>
          <Perm permission={PERMISSIONS.PERMISSION.UPDATE}>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditDataRule(record)}
            >
              编辑
            </Button>
          </Perm>
          <Perm permission={PERMISSIONS.PERMISSION.DELETE}>
            <Popconfirm
              title="确定删除该数据规则吗？"
              okText="删除"
              cancelText="取消"
              onConfirm={() => deleteDataRuleMutation.mutate(record.id)}
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
    <>
      <div className="permission-toolbar">
        <div className="permission-filters">
          <Input
            allowClear
            className="permission-search"
            prefix={<SearchOutlined />}
            placeholder="搜索规则名称"
            value={dataRuleFilters.name}
            onChange={(event) => handleFilterChange('name', event.target.value)}
          />
          <Input
            allowClear
            className="permission-code-input"
            placeholder="规则编码"
            value={dataRuleFilters.code}
            onChange={(event) => handleFilterChange('code', event.target.value)}
          />
          <Input
            allowClear
            className="permission-resource-input"
            placeholder="资源标识"
            value={dataRuleFilters.resource}
            onChange={(event) => handleFilterChange('resource', event.target.value)}
          />
          <Select
            allowClear
            style={{ width: 140 }}
            placeholder="操作类型"
            value={dataRuleFilters.action}
            onChange={(value) => handleFilterChange('action', value)}
            options={SYSTEM_ACTIONS.map((a) => ({
              label: (
                <span>
                  <Tag color={a.color} style={{ marginRight: 4 }}>
                    {a.key}
                  </Tag>
                  {a.label}
                </span>
              ),
              value: a.key,
            }))}
          />
          <Select
            allowClear
            style={{ width: 112 }}
            placeholder="状态"
            value={dataRuleFilters.active}
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
              loading={dataRuleListQuery.isFetching}
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ['permission-management-data-rules'] })
              }
            />
          </Tooltip>
          <Perm permission={PERMISSIONS.PERMISSION.CREATE}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDataRule}>
              新建数据规则
            </Button>
          </Perm>
        </Space>
      </div>

      <Table
        columns={dataRuleColumns}
        dataSource={dataRuleListQuery.data?.data || []}
        rowKey="id"
        loading={dataRuleListQuery.isLoading}
        pagination={{
          current: dataRuleFilters.page,
          pageSize: dataRuleFilters.pageSize,
          total: dataRuleListQuery.data?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        scroll={{ x: 980 }}
        onChange={(pagination) =>
          setDataRuleFilters((prev) => ({
            ...prev,
            page: pagination.current || 1,
            pageSize: pagination.pageSize || 10,
          }))
        }
        locale={{
          emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据规则" />,
        }}
      />

      <DataRuleFormModal
        open={modalOpen}
        mode={modalMode}
        editingDataRule={editingDataRule}
        onCancel={() => {
          setModalOpen(false);
          setEditingDataRule(null);
        }}
        onSuccess={async () => {
          setModalOpen(false);
          setEditingDataRule(null);
          await queryClient.invalidateQueries({ queryKey: ['permission-management-data-rules'] });
        }}
      />

      <DataRulePreviewModal
        open={Boolean(previewRule)}
        onClose={() => setPreviewRule(null)}
        rule={previewRule}
      />
    </>
  );
}
