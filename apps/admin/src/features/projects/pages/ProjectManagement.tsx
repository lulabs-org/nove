import {
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import Alert from 'antd/es/alert';
import Button from 'antd/es/button';
import Col from 'antd/es/col';
import DatePicker from 'antd/es/date-picker';
import Divider from 'antd/es/divider';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import InputNumber from 'antd/es/input-number';
import message from 'antd/es/message';
import Modal from 'antd/es/modal';
import Popconfirm from 'antd/es/popconfirm';
import Row from 'antd/es/row';
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import Switch from 'antd/es/switch';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Tooltip from 'antd/es/tooltip';
import type { TableProps } from 'antd/es/table';
import dayjs from 'dayjs';
import { useDeferredValue, useMemo, useState } from 'react';
import { Perm } from '../../../app/guards/Perm';
import { useAuth } from '../../../shared/hooks/useAuth';
import {
  useTableDeleteMutation,
  useTableMutation,
  useTableQuery,
  type TableQueryParams,
} from '../../../shared/hooks/useTableQuery';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { productApi } from '../../transactions/products/api/productApi';
import { projectApi } from '../api/projectApi';
import { ProjectCoverAvatar, ProjectCoverPicker } from '../components/ProjectCoverPicker';
import { MarkdownEditor } from '../../../shared/components/MarkdownEditor';
import {
  buildProjectPayload,
  parseProjectMetadata,
  type ProjectFormValues,
} from '../lib/projectPayload';
import type {
  CreateProject,
  Project,
  ProjectLevel,
  ProjectListParams,
  ProjectStatus,
  UpdateProject,
} from '../types';
import './ProjectManagement.css';

const { Search, TextArea } = Input;

const STATUS_OPTIONS: Array<{
  label: string;
  value: ProjectStatus;
  color: string;
}> = [
  { label: '草稿', value: 'DRAFT', color: 'default' },
  { label: '已发布', value: 'PUBLISHED', color: 'blue' },
  { label: '招募中', value: 'ENROLLING', color: 'cyan' },
  { label: '进行中', value: 'IN_PROGRESS', color: 'processing' },
  { label: '已完成', value: 'COMPLETED', color: 'success' },
  { label: '已归档', value: 'ARCHIVED', color: 'warning' },
];

const LEVEL_OPTIONS: Array<{ label: string; value: ProjectLevel }> = [
  { label: '初级', value: 'BEGINNER' },
  { label: '中级', value: 'INTERMEDIATE' },
  { label: '高级', value: 'ADVANCED' },
];

function getErrorMessage(error: unknown, fallback: string): string {
  const responseMessage = (error as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data?.message;
  return Array.isArray(responseMessage) ? responseMessage.join('；') : responseMessage || fallback;
}

function statusMeta(status: ProjectStatus) {
  return STATUS_OPTIONS.find((option) => option.value === status)!;
}

function StringListField({ name, label }: { name: 'prerequisites' | 'outcomes'; label: string }) {
  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <Form.Item label={label}>
          <Space orientation="vertical" style={{ width: '100%' }}>
            {fields.map((field) => (
              <Space key={field.key} style={{ width: '100%' }}>
                <Form.Item {...field} name={[field.name, 'value']} noStyle>
                  <Input style={{ width: 360 }} />
                </Form.Item>
                <Button
                  type="text"
                  danger
                  aria-label={`删除${label}`}
                  icon={<MinusCircleOutlined />}
                  onClick={() => remove(field.name)}
                />
              </Space>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ value: '' })}>
              添加{label}
            </Button>
          </Space>
        </Form.Item>
      )}
    </Form.List>
  );
}

export function ProjectManagement() {
  const { user, checkPermission } = useAuth();
  const currentOrgId = user?.currentOrgId;
  const canSearchOwners =
    checkPermission(PERMISSIONS.PROJECT.UPDATE) && checkPermission(PERMISSIONS.USER.READ);
  const canReadProducts = checkPermission(PERMISSIONS.PRODUCT.READ);
  const [filters, setFilters] = useState<TableQueryParams>({
    page: 1,
    pageSize: 10,
    sortField: 'sortOrder',
    sortOrder: 'ascend',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [ownerKeyword, setOwnerKeyword] = useState('');
  const deferredOwnerKeyword = useDeferredValue(ownerKeyword.trim());
  const [form] = Form.useForm<ProjectFormValues>();

  const {
    data: projectList,
    isLoading,
    isFetching,
    refetch,
  } = useTableQuery<Project>({
    queryKey: `projects-${currentOrgId ?? 'missing'}`,
    params: filters,
    enabled: Boolean(currentOrgId),
    queryFn: (params) =>
      projectApi.list({
        ...(params as Omit<ProjectListParams, 'sortOrder'>),
        sortOrder:
          params.sortOrder === 'descend'
            ? 'desc'
            : params.sortOrder === 'ascend'
              ? 'asc'
              : undefined,
      }),
  });

  const ownerQuery = useQuery({
    queryKey: ['project-owner-options', deferredOwnerKeyword],
    enabled: canSearchOwners && Boolean(currentOrgId) && deferredOwnerKeyword.length >= 2,
    queryFn: () => projectApi.ownerOptions({ keyword: deferredOwnerKeyword }),
  });

  const productQuery = useQuery({
    queryKey: ['project-product-options'],
    enabled: canReadProducts && Boolean(currentOrgId),
    queryFn: () => productApi.list({ page: 1, pageSize: 100, sortField: 'name' }),
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditingProject(null);
    setOwnerKeyword('');
    form.resetFields();
  };

  const createMutation = useTableMutation({
    queryKey: `projects-${currentOrgId ?? 'missing'}`,
    mutationFn: (data: CreateProject) => projectApi.create(data),
    onSuccess: () => {
      message.success('项目创建成功');
      closeModal();
    },
    onError: (error) => message.error(getErrorMessage(error, '项目创建失败')),
  });

  const updateMutation = useTableMutation({
    queryKey: `projects-${currentOrgId ?? 'missing'}`,
    mutationFn: ({ id, data }: { id: string; data: UpdateProject }) => projectApi.update(id, data),
    onSuccess: () => {
      message.success('项目更新成功');
      closeModal();
    },
    onError: (error) => message.error(getErrorMessage(error, '项目更新失败')),
  });

  const deleteMutation = useTableDeleteMutation({
    queryKey: `projects-${currentOrgId ?? 'missing'}`,
    mutationFn: projectApi.delete,
    onSuccess: () => message.success('项目已删除'),
    onError: (error) => message.error(getErrorMessage(error, '项目删除失败')),
  });

  const openCreate = () => {
    setEditingProject(null);
    setOwnerKeyword('');
    form.setFieldsValue({
      title: '',
      level: 'BEGINNER',
      prerequisites: [],
      outcomes: [],
      tags: [],
      status: 'DRAFT',
      sortOrder: 0,
      isFeatured: false,
      metadataText: '{}',
    });
    setModalOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setOwnerKeyword('');
    form.setFieldsValue({
      title: project.title,
      subtitle: project.subtitle ?? undefined,
      category: project.category ?? undefined,
      image: project.image ?? undefined,
      description: project.description ?? undefined,
      level: project.level,
      duration: project.duration ?? undefined,
      maxStudents: project.maxStudents ?? undefined,
      prerequisites: (project.prerequisites ?? []).map((value) => ({ value })),
      outcomes: (project.outcomes ?? []).map((value) => ({ value })),
      tags: project.tags,
      ownerId: project.ownerId ?? undefined,
      productId: project.productId ?? undefined,
      status: project.status,
      sortOrder: project.sortOrder,
      isFeatured: project.isFeatured,
      startDate: project.startDate ? dayjs(project.startDate) : undefined,
      endDate: project.endDate ? dayjs(project.endDate) : undefined,
      enrollDeadline: project.enrollDeadline ? dayjs(project.enrollDeadline) : undefined,
      metadataText: JSON.stringify(project.metadata ?? {}, null, 2),
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const data = buildProjectPayload(values);
    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleFilter = (key: string, value: unknown) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value === '' ? undefined : value,
      page: 1,
    }));
  };

  const handleTableChange: TableProps<Project>['onChange'] = (
    pagination,
    _tableFilters,
    sorter
  ) => {
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    setFilters((previous) => ({
      ...previous,
      page: pagination.current,
      pageSize: pagination.pageSize,
      sortField: activeSorter.field
        ? String(activeSorter.field)
        : activeSorter.columnKey
          ? String(activeSorter.columnKey)
          : 'sortOrder',
      sortOrder: activeSorter.order ?? 'ascend',
    }));
  };

  const columns: TableProps<Project>['columns'] = [
    {
      title: '项目',
      key: 'title',
      fixed: 'left',
      width: 320,
      sorter: true,
      render: (_value, record) => (
        <div className="project-primary-cell">
          <ProjectCoverAvatar reference={record.image} />
          <div className="project-primary-cell-content">
            <div className="project-primary-cell-title-row">
              <Tooltip title={record.title}>
                <span className="project-primary-cell-title">{record.title}</span>
              </Tooltip>
              {record.isFeatured ? <Tag color="gold">精选</Tag> : null}
            </div>
            <span className="project-primary-cell-meta">
              {record.code || record.slug || record.id}
            </span>
            {record.subtitle ? (
              <Tooltip title={record.subtitle}>
                <span className="project-primary-cell-subtitle">{record.subtitle}</span>
              </Tooltip>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      ellipsis: { showTitle: false },
      render: (value: string | null) =>
        value ? (
          <Tooltip title={value}>
            <span className="project-nowrap-cell">{value}</span>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: '难度',
      dataIndex: 'level',
      key: 'level',
      width: 90,
      render: (value: ProjectLevel) =>
        LEVEL_OPTIONS.find((option) => option.value === value)?.label ?? value,
    },
    {
      title: '人数',
      dataIndex: 'enrolledCount',
      key: 'enrolledCount',
      width: 100,
      render: (_value: number, record) => `${record.enrolledCount}/${record.maxStudents ?? '不限'}`,
    },
    {
      title: '负责人',
      key: 'owner',
      width: 130,
      ellipsis: { showTitle: false },
      render: (_value, record) =>
        record.owner?.displayName ? (
          <Tooltip title={record.owner.displayName}>
            <span className="project-nowrap-cell">{record.owner.displayName}</span>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: '关联产品',
      key: 'product',
      width: 160,
      ellipsis: { showTitle: false },
      render: (_value, record) =>
        record.product?.name ? (
          <Tooltip title={record.product.name}>
            <span className="project-nowrap-cell">{record.product.name}</span>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: ProjectStatus) => {
        const meta = statusMeta(status);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: '开营时间',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 130,
      sorter: true,
      render: (value: string | null) => (value ? dayjs(value).format('YYYY-MM-DD') : '-'),
    },
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 80, sorter: true },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_value, record) => (
        <Space size="small">
          <Perm permission={PERMISSIONS.PROJECT.UPDATE}>
            <Tooltip title="编辑项目">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEdit(record)}
              />
            </Tooltip>
          </Perm>
          <Perm permission={PERMISSIONS.PROJECT.DELETE}>
            <Popconfirm
              title={`删除项目“${record.title}”？`}
              description="项目将被软删除，普通列表中不再显示"
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={() => deleteMutation.mutate(record.id)}
            >
              <Tooltip title="删除项目">
                <Button
                  type="link"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={deleteMutation.isPending && deleteMutation.variables === record.id}
                />
              </Tooltip>
            </Popconfirm>
          </Perm>
        </Space>
      ),
    },
  ];

  const ownerOptions = useMemo(() => {
    const owners = [...(ownerQuery.data?.items ?? [])];
    if (editingProject?.owner && !owners.some((owner) => owner.id === editingProject.owner?.id)) {
      owners.unshift(editingProject.owner);
    }
    return owners.map((owner) => ({ value: owner.id, label: owner.displayName }));
  }, [editingProject, ownerQuery.data?.items]);
  const productOptions = useMemo(
    () =>
      (productQuery.data?.data ?? []).map((product) => ({
        value: product.id,
        label: `${product.name} (${product.productCode})`,
      })),
    [productQuery.data?.data]
  );
  const ownerNotFoundContent =
    ownerKeyword.trim().length < 2
      ? '请输入至少 2 个字符搜索'
      : ownerQuery.isFetching
        ? '搜索中…'
        : '未找到有效用户';

  if (!currentOrgId) {
    return (
      <div>
        <Alert
          type="warning"
          showIcon
          title="缺少当前组织"
          description="请先加入或选择组织后再管理项目。"
        />
      </div>
    );
  }

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="project-management-page">
      <div className="project-management-toolbar">
        <div className="project-management-filters">
          <Search
            className="project-management-search"
            allowClear
            placeholder="搜索项目"
            enterButton={<SearchOutlined />}
            onSearch={(value) => handleFilter('keyword', value)}
            onChange={(event) => !event.target.value && handleFilter('keyword', undefined)}
          />
          <Select
            allowClear
            placeholder="项目状态"
            options={STATUS_OPTIONS.map(({ label, value }) => ({ label, value }))}
            onChange={(value) => handleFilter('status', value)}
          />
          <Input
            allowClear
            placeholder="项目分类"
            onPressEnter={(event) => handleFilter('category', event.currentTarget.value)}
            onChange={(event) => !event.target.value && handleFilter('category', undefined)}
          />
          <Select
            allowClear
            placeholder="难度级别"
            options={LEVEL_OPTIONS}
            onChange={(value) => handleFilter('level', value)}
          />
          <Select
            allowClear
            placeholder="是否精选"
            options={[
              { label: '精选', value: true },
              { label: '非精选', value: false },
            ]}
            onChange={(value) => handleFilter('isFeatured', value)}
          />
          {canSearchOwners && (
            <Select
              allowClear
              showSearch
              filterOption={false}
              placeholder="负责人"
              loading={ownerQuery.isFetching}
              options={ownerOptions}
              onSearch={setOwnerKeyword}
              notFoundContent={ownerNotFoundContent}
              onChange={(value) => handleFilter('ownerId', value)}
            />
          )}
          {canReadProducts && (
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="关联产品"
              options={productOptions}
              onChange={(value) => handleFilter('productId', value)}
            />
          )}
        </div>
        <div className="project-management-actions">
          <Button icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
            刷新
          </Button>
          <Perm permission={PERMISSIONS.PROJECT.CREATE}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增项目
            </Button>
          </Perm>
        </div>
      </div>

      <div className="project-management-table-card">
        <Table
          columns={columns}
          dataSource={projectList?.data ?? []}
          rowKey="id"
          loading={isLoading}
          tableLayout="fixed"
          scroll={{ x: 1470, y: 'calc(100vh - 360px)' }}
          pagination={{
            current: filters.page as number,
            pageSize: filters.pageSize as number,
            total: projectList?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个项目`,
          }}
          onChange={handleTableChange}
        />
      </div>

      <Modal
        title={editingProject ? '编辑项目' : '新增项目'}
        open={modalOpen}
        width={1000}
        okText="保存"
        cancelText="取消"
        confirmLoading={submitting}
        onOk={submit}
        onCancel={closeModal}
        forceRender
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Divider titlePlacement="start">基本信息</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="项目标题"
                rules={[{ required: true, message: '请输入项目标题' }, { max: 150 }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="subtitle" label="副标题" rules={[{ max: 255 }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="status" label="项目状态" rules={[{ required: true }]}>
                <Select options={STATUS_OPTIONS.map(({ label, value }) => ({ label, value }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="项目编号"
                extra={
                  editingProject && !editingProject.code
                    ? '历史项目将在本次保存时自动补齐'
                    : '创建时由系统自动生成'
                }
              >
                <Input value={editingProject?.code ?? ''} placeholder="保存后自动生成" disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Slug"
                extra={
                  editingProject && !editingProject.slug
                    ? '历史项目将在本次保存时自动补齐'
                    : '创建时由系统自动生成'
                }
              >
                <Input value={editingProject?.slug ?? ''} placeholder="保存后自动生成" disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="category" label="项目分类" rules={[{ max: 50 }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="image" label="项目封面">
                <ProjectCoverPicker orgId={currentOrgId} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="项目介绍">
                <MarkdownEditor
                  placeholder="请输入详细项目介绍，支持 Markdown 语法排版（如标题、列表、加粗、代码块等）"
                  minHeight={180}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="start">教学与人数</Divider>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="level" label="难度" rules={[{ required: true }]}>
                <Select options={LEVEL_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="duration" label="项目周期">
                <Input placeholder="8周" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="maxStudents"
                label="人数上限"
                rules={[
                  {
                    validator: (_, value?: number) =>
                      value == null || value >= (editingProject?.enrolledCount ?? 0)
                        ? Promise.resolve()
                        : Promise.reject(new Error('人数上限不能低于当前正式学员人数')),
                  },
                ]}
              >
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="当前正式学员" extra="由项目成员自动统计，不可手动修改">
                <InputNumber
                  value={editingProject?.enrolledCount ?? 0}
                  disabled
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="tags" label="标签">
                <Select mode="tags" tokenSeparators={[',']} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <StringListField name="prerequisites" label="前置要求" />
            </Col>
            <Col span={12}>
              <StringListField name="outcomes" label="预期成果" />
            </Col>
          </Row>

          <Divider titlePlacement="start">关联关系与排期</Divider>
          <Row gutter={16}>
            {canSearchOwners && (
              <Col span={12}>
                <Form.Item name="ownerId" label="负责人">
                  <Select
                    allowClear
                    showSearch
                    filterOption={false}
                    placeholder="搜索全部有效系统账号"
                    loading={ownerQuery.isLoading}
                    options={ownerOptions}
                    onSearch={setOwnerKeyword}
                    notFoundContent={ownerNotFoundContent}
                  />
                </Form.Item>
              </Col>
            )}
            {canReadProducts && (
              <Col span={12}>
                <Form.Item name="productId" label="关联产品">
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    loading={productQuery.isLoading}
                    options={productOptions}
                  />
                </Form.Item>
              </Col>
            )}
            <Col span={8}>
              <Form.Item name="sortOrder" label="排序">
                <InputNumber precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isFeatured" label="精选" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="enrollDeadline" label="报名截止">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="startDate" label="开始时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="结束时间"
                dependencies={['startDate']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator: (_, value) =>
                      !value ||
                      !getFieldValue('startDate') ||
                      !value.isBefore(getFieldValue('startDate'))
                        ? Promise.resolve()
                        : Promise.reject(new Error('结束时间不能早于开始时间')),
                  }),
                ]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="start">高级配置</Divider>
          <Form.Item
            name="metadataText"
            label="扩展元数据（JSON 对象）"
            rules={[
              {
                validator: (_, value?: string) => {
                  try {
                    parseProjectMetadata(value);
                    return Promise.resolve();
                  } catch (error) {
                    return Promise.reject(error);
                  }
                },
              },
            ]}
          >
            <TextArea rows={6} style={{ fontFamily: 'monospace' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
