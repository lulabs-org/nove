import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import Button from 'antd/es/button';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import message from 'antd/es/message';
import Modal from 'antd/es/modal';
import Popconfirm from 'antd/es/popconfirm';
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import Switch from 'antd/es/switch';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Tooltip from 'antd/es/tooltip';
import type { TableProps } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { Perm } from '../../../../app/guards/Perm';
import {
  useTableMutation,
  useTableQuery,
  type TableQueryParams,
} from '../../../../shared/hooks/useTableQuery';
import { PERMISSIONS } from '../../../../shared/utils/permissions';
import { channelApi } from '../api/channelApi';
import type { Channel, ChannelListParams, CreateChannel, UpdateChannel } from '../types';

const { Search, TextArea } = Input;

interface ChannelFormValues {
  name: string;
  description?: string;
  isActive: boolean;
}

function getErrorMessage(error: unknown, fallback: string): string {
  const responseMessage = (error as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data?.message;
  return Array.isArray(responseMessage) ? responseMessage.join('；') : responseMessage || fallback;
}

function buildPayload(values: ChannelFormValues): CreateChannel {
  return {
    name: values.name.trim(),
    description: values.description?.trim() || null,
    isActive: values.isActive,
  };
}

export function ChannelManagement() {
  const [filters, setFilters] = useState<TableQueryParams>({
    page: 1,
    pageSize: 10,
    sortField: 'createdAt',
    sortOrder: 'descend',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [form] = Form.useForm<ChannelFormValues>();

  const {
    data: channelList,
    isLoading,
    isFetching,
    refetch,
  } = useTableQuery<Channel>({
    queryKey: 'channels',
    params: filters,
    queryFn: (params) =>
      channelApi.list({
        ...(params as Omit<ChannelListParams, 'sortOrder'>),
        sortOrder:
          params.sortOrder === 'descend'
            ? 'desc'
            : params.sortOrder === 'ascend'
              ? 'asc'
              : undefined,
      }),
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditingChannel(null);
    form.resetFields();
  };

  const createMutation = useTableMutation({
    queryKey: 'channels',
    mutationFn: channelApi.create,
    onSuccess: () => {
      message.success('渠道创建成功');
      closeModal();
    },
    onError: (error) => message.error(getErrorMessage(error, '渠道创建失败')),
  });

  const updateMutation = useTableMutation({
    queryKey: 'channels',
    mutationFn: ({ id, data }: { id: number; data: UpdateChannel }) => channelApi.update(id, data),
    onSuccess: () => {
      message.success('渠道更新成功');
      closeModal();
    },
    onError: (error) => message.error(getErrorMessage(error, '渠道更新失败')),
  });

  const statusMutation = useTableMutation({
    queryKey: 'channels',
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      channelApi.updateStatus(id, isActive),
    onSuccess: () => message.success('渠道状态已更新'),
    onError: (error) => message.error(getErrorMessage(error, '渠道状态更新失败')),
  });

  const deleteMutation = useTableMutation({
    queryKey: 'channels',
    mutationFn: channelApi.delete,
    onSuccess: () => message.success('渠道已删除'),
    onError: (error) => message.error(getErrorMessage(error, '渠道删除失败')),
  });

  const openCreate = () => {
    setEditingChannel(null);
    form.setFieldsValue({ name: '', description: '', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (channel: Channel) => {
    setEditingChannel(channel);
    form.setFieldsValue({
      name: channel.name,
      description: channel.description ?? '',
      isActive: channel.isActive,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const data = buildPayload(await form.validateFields());
    if (editingChannel) updateMutation.mutate({ id: editingChannel.id, data });
    else createMutation.mutate(data);
  };

  const handleFilter = (key: string, value: unknown) => {
    setFilters((previous) => ({ ...previous, [key]: value ?? undefined, page: 1 }));
  };

  const handleTableChange: TableProps<Channel>['onChange'] = (pagination, _filters, sorter) => {
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    setFilters((previous) => ({
      ...previous,
      page: pagination.current,
      pageSize: pagination.pageSize,
      sortField: activeSorter.field ? String(activeSorter.field) : 'createdAt',
      sortOrder: activeSorter.order ?? 'descend',
    }));
  };

  const columns: TableProps<Channel>['columns'] = [
    {
      title: '渠道',
      key: 'name',
      sorter: true,
      render: (_value, record) => (
        <Space orientation="vertical" size={0}>
          <span style={{ fontWeight: 600 }}>{record.name}</span>
          <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 12 }}>
            {record.code}
          </span>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value: string | null) => value || '-',
    },
    {
      title: '关联订单',
      dataIndex: 'orderCount',
      key: 'orderCount',
      width: 110,
      render: (value: number) => (value > 0 ? <Tag color="blue">{value} 个</Tag> : '0'),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive: boolean, record) => (
        <Perm
          permission={PERMISSIONS.CHANNEL.UPDATE}
          fallback={
            <Tag color={isActive ? 'success' : 'default'}>{isActive ? '启用' : '停用'}</Tag>
          }
        >
          <Switch
            checked={isActive}
            checkedChildren="启用"
            unCheckedChildren="停用"
            loading={statusMutation.isPending && statusMutation.variables?.id === record.id}
            onChange={(nextActive) =>
              statusMutation.mutate({ id: record.id, isActive: nextActive })
            }
          />
        </Perm>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      sorter: true,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_value, record) => (
        <Space size="small">
          <Perm permission={PERMISSIONS.CHANNEL.UPDATE}>
            <Tooltip title="编辑渠道">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEdit(record)}
              />
            </Tooltip>
          </Perm>
          <Perm permission={PERMISSIONS.CHANNEL.DELETE}>
            {record.orderCount > 0 ? (
              <Tooltip title={`已被 ${record.orderCount} 个订单引用，不能删除`}>
                <Button type="link" danger size="small" icon={<DeleteOutlined />} disabled />
              </Tooltip>
            ) : (
              <Popconfirm
                title="确定要删除此渠道吗？"
                description="删除后不可恢复"
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
                onConfirm={() => deleteMutation.mutate(record.id)}
              >
                <Tooltip title="删除渠道">
                  <Button
                    type="link"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    loading={deleteMutation.isPending && deleteMutation.variables === record.id}
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Perm>
        </Space>
      ),
    },
  ];

  const tableData = useMemo(() => channelList?.data ?? [], [channelList?.data]);
  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Perm permission={PERMISSIONS.CHANNEL.CREATE}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增渠道
          </Button>
        </Perm>
        <Search
          allowClear
          placeholder="搜索渠道名称、编码或描述"
          enterButton={<SearchOutlined />}
          style={{ width: 320 }}
          onSearch={(value) => handleFilter('keyword', value || undefined)}
          onChange={(event) => !event.target.value && handleFilter('keyword', undefined)}
        />
        <Select
          allowClear
          placeholder="渠道状态"
          style={{ width: 130 }}
          options={[
            { label: '启用', value: true },
            { label: '停用', value: false },
          ]}
          onChange={(value) => handleFilter('isActive', value)}
        />
        <Button icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
          刷新
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tableData}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: filters.page as number,
          pageSize: filters.pageSize as number,
          total: channelList?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 个渠道`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={editingChannel ? '编辑渠道' : '新增渠道'}
        open={modalOpen}
        okText="保存"
        cancelText="取消"
        confirmLoading={submitting}
        onOk={submit}
        onCancel={closeModal}
        forceRender
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="name"
            label="渠道名称"
            rules={[{ required: true, message: '请输入渠道名称' }]}
          >
            <Input placeholder="例如：微信小程序" />
          </Form.Item>
          <Form.Item name="description" label="渠道描述">
            <TextArea rows={4} maxLength={1000} showCount />
          </Form.Item>
          <Form.Item name="isActive" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
