import Alert from 'antd/es/alert';
import Button from 'antd/es/button';
import DatePicker from 'antd/es/date-picker';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import InputNumber from 'antd/es/input-number';
import message from 'antd/es/message';
import Modal from 'antd/es/modal';
import Popconfirm from 'antd/es/popconfirm';
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Tooltip from 'antd/es/tooltip';
import type { TableProps } from 'antd/es/table';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  useTableDeleteMutation,
  useTableMutation,
  useTableQuery,
  type TableQueryParams,
} from '../../../shared/hooks/useTableQuery';
import { taskApi } from '../api/taskApi';
import { CronScheduleEditor } from '../components/CronScheduleEditor';
import { describeCronExpression, getCronError } from '../lib/taskScheduling';
import { buildHandlerPayload, type TaskHandlerPayloadValues } from '../lib/taskPayload';
import type { CreateCronTask, CreateOnceTask, ScheduledTask, TaskStatus, TaskType } from '../types';

const { Search, TextArea } = Input;
const { Option } = Select;

type TaskFormMode = 'create' | 'edit';

interface TaskFormValues extends TaskHandlerPayloadValues {
  type: TaskType;
  name: string;
  runAt?: dayjs.Dayjs;
  cron?: string;
  timezone?: string;
  status?: TaskStatus;
  jobIdHint?: string;
}

const TASK_TYPE_OPTIONS: Array<{ label: string; value: TaskType }> = [
  { label: '一次性', value: 'ONCE' },
  { label: 'CRON', value: 'CRON' },
];

const TASK_HANDLER_OPTIONS = [
  {
    label: '同步手机号哈希',
    value: 'migrate_phone_hashes',
    description: '重新计算系统账号手机号哈希，无需额外参数',
  },
  {
    label: '关联平台身份',
    value: 'link_platform_users_by_phone_hash',
    description: '根据同一平台的手机号哈希，将未关联的平台身份关联系统账号',
  },
  {
    label: '关联订单购买者',
    value: 'link_orders_to_users_by_phone',
    description: '按国家代码和手机号关联未关联的订单，找不到系统账号时自动创建',
  },
  {
    label: '调用 HTTP 接口',
    value: 'invoke_http',
    description: '按计划向指定地址发起 HTTP 请求',
  },
];

const PLATFORM_OPTIONS = [
  { label: '全部平台', value: 'ALL' },
  { label: '腾讯会议', value: 'TENCENT_MEETING' },
  { label: 'Zoom', value: 'ZOOM' },
  { label: 'Microsoft Teams', value: 'TEAMS' },
  { label: '钉钉', value: 'DINGTALK' },
  { label: '飞书', value: 'FEISHU' },
  { label: 'Cisco Webex', value: 'WEBEX' },
  { label: 'VooV Meeting', value: 'VOOV' },
  { label: '其他', value: 'OTHER' },
];

const COMMON_TIMEZONE_OPTIONS = [
  { label: '中国标准时间（Asia/Shanghai）', value: 'Asia/Shanghai' },
  { label: '协调世界时（UTC）', value: 'UTC' },
  { label: '日本标准时间（Asia/Tokyo）', value: 'Asia/Tokyo' },
  { label: '美国东部时间（America/New_York）', value: 'America/New_York' },
  { label: '英国时间（Europe/London）', value: 'Europe/London' },
];

const supportedTimezones =
  (Intl as unknown as { supportedValuesOf?: (key: 'timeZone') => string[] }).supportedValuesOf?.(
    'timeZone'
  ) ?? [];

const TIMEZONE_OPTIONS = [
  ...COMMON_TIMEZONE_OPTIONS,
  ...supportedTimezones
    .filter((timezone) => !COMMON_TIMEZONE_OPTIONS.some((item) => item.value === timezone))
    .map((timezone) => ({ label: timezone, value: timezone })),
];

const TASK_STATUS_OPTIONS: Array<{ label: string; value: TaskStatus }> = [
  { label: '待处理', value: 'PENDING' },
  { label: '已计划', value: 'SCHEDULED' },
  { label: '运行中', value: 'RUNNING' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '失败', value: 'FAILED' },
  { label: '已暂停', value: 'PAUSED' },
];

const TASK_STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  PENDING: { label: '待处理', color: 'default' },
  SCHEDULED: { label: '已计划', color: 'processing' },
  RUNNING: { label: '运行中', color: 'blue' },
  COMPLETED: { label: '已完成', color: 'success' },
  FAILED: { label: '失败', color: 'error' },
  PAUSED: { label: '已暂停', color: 'warning' },
};

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN');
}

function formatPayload(payload: Record<string, unknown>) {
  return JSON.stringify(payload ?? {}, null, 2);
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  const responseMessage = (error as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data?.message;

  if (Array.isArray(responseMessage)) return responseMessage.join('；');
  return responseMessage || fallback;
}

function getOrderDir(order: 'ascend' | 'descend' | null | undefined) {
  if (order === 'ascend') return 'asc';
  if (order === 'descend') return 'desc';
  return undefined;
}

function getTaskTypeLabel(type: TaskType) {
  return TASK_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? type;
}

export function TaskManagement() {
  const [filters, setFilters] = useState<TableQueryParams>({
    page: 1,
    pageSize: 10,
    search: '',
    status: undefined,
    type: undefined,
    orderBy: 'createdAt',
    orderDir: 'desc',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<TaskFormMode>('create');
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [form] = Form.useForm<TaskFormValues>();
  const watchedType = Form.useWatch('type', form);
  const watchedHandler = Form.useWatch('handler', form);
  const watchedTimezone = Form.useWatch('timezone', form) || 'Asia/Shanghai';

  const {
    data: taskList,
    isLoading,
    isFetching,
    refetch,
  } = useTableQuery<ScheduledTask>({
    queryKey: 'tasks',
    queryFn: (params) => taskApi.list(params),
    params: filters,
  });

  const createOnceMutation = useTableMutation({
    queryKey: 'tasks',
    mutationFn: taskApi.createOnce,
    onSuccess: () => {
      message.success('创建一次性任务成功');
      closeModal();
    },
    onError: (error) => {
      message.error(getApiErrorMessage(error, '创建一次性任务失败'));
    },
  });

  const createCronMutation = useTableMutation({
    queryKey: 'tasks',
    mutationFn: taskApi.createCron,
    onSuccess: () => {
      message.success('创建 CRON 任务成功');
      closeModal();
    },
    onError: (error) => {
      message.error(getApiErrorMessage(error, '创建 CRON 任务失败'));
    },
  });

  const updateMutation = useTableMutation({
    queryKey: 'tasks',
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof taskApi.update>[1] }) =>
      taskApi.update(id, data),
    onSuccess: () => {
      message.success('更新任务成功');
      closeModal();
    },
    onError: (error) => {
      message.error(getApiErrorMessage(error, '更新任务失败'));
    },
  });

  const deleteMutation = useTableDeleteMutation({
    queryKey: 'tasks',
    mutationFn: taskApi.delete,
    onSuccess: () => {
      message.success('删除任务成功');
    },
    onError: () => {
      message.error('删除任务失败');
    },
  });

  const runNowMutation = useTableMutation({
    queryKey: 'tasks',
    mutationFn: taskApi.runNow,
    onSuccess: (result) => {
      message.success(`任务已提交执行${result.jobId ? `，Job ID：${result.jobId}` : ''}`);
    },
    onError: () => {
      message.error('立即执行任务失败');
    },
  });

  const pauseMutation = useTableMutation({
    queryKey: 'tasks',
    mutationFn: taskApi.pauseQueue,
    onSuccess: () => {
      message.success('任务调度已暂停');
    },
    onError: () => {
      message.error('暂停任务调度失败');
    },
  });

  const resumeMutation = useTableMutation({
    queryKey: 'tasks',
    mutationFn: taskApi.resumeQueue,
    onSuccess: () => {
      message.success('任务调度已恢复');
    },
    onError: () => {
      message.error('恢复任务调度失败');
    },
  });

  const submitting =
    createOnceMutation.isPending || createCronMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!modalOpen) return;

    if (formMode === 'create') {
      form.setFieldsValue({
        type: 'ONCE',
        name: '',
        handler: 'migrate_phone_hashes',
        runAt: dayjs().add(1, 'hour'),
        cron: '0 0 9 * * *',
        timezone: 'Asia/Shanghai',
        status: undefined,
        jobIdHint: '',
        httpUrl: '',
        httpMethod: 'POST',
        httpTimeout: 10000,
        httpHeadersText: '{}',
        httpDataText: '{}',
        customPayloadText: '{}',
        linkPlatform: 'ALL',
        linkBatchSize: 500,
        orderLinkBatchSize: 500,
      });
      return;
    }

    if (!editingTask) return;

    form.setFieldsValue({
      type: editingTask.type,
      name: editingTask.name,
      handler: editingTask.handler,
      runAt: editingTask.runAt ? dayjs(editingTask.runAt) : undefined,
      cron: editingTask.cron ?? undefined,
      timezone: editingTask.timezone ?? 'Asia/Shanghai',
      status: editingTask.status,
      jobIdHint: editingTask.jobId ?? '',
      httpUrl: typeof editingTask.payload.url === 'string' ? editingTask.payload.url : '',
      httpMethod:
        typeof editingTask.payload.method === 'string' ? editingTask.payload.method : 'POST',
      httpTimeout:
        typeof editingTask.payload.timeout === 'number' ? editingTask.payload.timeout : 10000,
      httpHeadersText: formatPayload(
        typeof editingTask.payload.headers === 'object' && editingTask.payload.headers
          ? (editingTask.payload.headers as Record<string, unknown>)
          : {}
      ),
      httpDataText: formatPayload(
        typeof editingTask.payload.data === 'object' && editingTask.payload.data
          ? (editingTask.payload.data as Record<string, unknown>)
          : {}
      ),
      customPayloadText: formatPayload(editingTask.payload),
      linkPlatform:
        typeof editingTask.payload.platform === 'string' ? editingTask.payload.platform : 'ALL',
      linkBatchSize:
        typeof editingTask.payload.batchSize === 'number' ? editingTask.payload.batchSize : 500,
      orderLinkBatchSize:
        typeof editingTask.payload.batchSize === 'number' ? editingTask.payload.batchSize : 500,
    });
  }, [editingTask, form, formMode, modalOpen]);

  const tableData = useMemo(() => taskList?.data ?? [], [taskList?.data]);

  const handleSearch = (field: string, value?: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value || undefined,
      page: 1,
    }));
  };

  const handleCreate = () => {
    setFormMode('create');
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleEdit = (record: ScheduledTask) => {
    setFormMode('edit');
    setEditingTask(record);
    setModalOpen(true);
  };

  const handleDelete = (record: ScheduledTask) => {
    deleteMutation.mutate(record.id);
  };

  const handleRunNow = (record: ScheduledTask) => {
    runNowMutation.mutate(record.id);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTask(null);
    form.resetFields();
  };

  const handleTableChange: TableProps<ScheduledTask>['onChange'] = (
    pagination,
    _filters,
    sorter
  ) => {
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const field = activeSorter?.field;
    const orderBy = field === 'updatedAt' || field === 'createdAt' ? field : undefined;

    setFilters((prev) => ({
      ...prev,
      page: pagination.current,
      pageSize: pagination.pageSize,
      orderBy,
      orderDir: getOrderDir(activeSorter?.order),
    }));
  };

  const submitTaskForm = async () => {
    const values = await form.validateFields();
    let payload: Record<string, unknown>;

    try {
      payload = buildHandlerPayload(values);
    } catch (error) {
      const description = error instanceof Error ? error.message : 'JSON 解析失败';
      const fieldName = description.startsWith('请求头')
        ? 'httpHeadersText'
        : description.startsWith('请求体')
          ? 'httpDataText'
          : 'customPayloadText';
      form.setFields([{ name: fieldName, errors: [description] }]);
      return;
    }

    if (formMode === 'edit' && editingTask) {
      updateMutation.mutate({
        id: editingTask.id,
        data: {
          name: values.name,
          handler: values.handler,
          cron: values.type === 'CRON' ? values.cron : undefined,
          timezone: values.type === 'CRON' ? values.timezone : undefined,
          status: values.status,
          payload,
        },
      });
      return;
    }

    if (values.type === 'CRON') {
      const data: CreateCronTask = {
        name: values.name,
        handler: values.handler,
        cron: values.cron ?? '',
        timezone: values.timezone || 'Asia/Shanghai',
        payload,
      };
      createCronMutation.mutate(data);
      return;
    }

    const data: CreateOnceTask = {
      name: values.name,
      handler: values.handler,
      runAt: values.runAt?.toISOString() ?? '',
      payload,
      jobIdHint: values.jobIdHint || undefined,
    };
    createOnceMutation.mutate(data);
  };

  const columns: TableProps<ScheduledTask>['columns'] = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 96,
      render: (type: TaskType) => (
        <Tag color={type === 'CRON' ? 'purple' : 'cyan'}>{getTaskTypeLabel(type)}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 108,
      render: (status: TaskStatus) => {
        const meta = TASK_STATUS_META[status];
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: '计划',
      key: 'schedule',
      render: (_: unknown, record) => {
        if (record.type === 'CRON') {
          return (
            <Space orientation="vertical" size={0}>
              <Tooltip title={`Cron：${record.cron || '-'}`}>
                <span>{describeCronExpression(record.cron)}</span>
              </Tooltip>
              <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                {record.timezone || 'Asia/Shanghai'}
              </span>
            </Space>
          );
        }

        return formatDateTime(record.runAt);
      },
    },
    {
      title: '最近错误',
      dataIndex: 'lastError',
      key: 'lastError',
      ellipsis: true,
      render: (lastError: string | null) =>
        lastError ? (
          <Tooltip title={lastError}>
            <span style={{ color: '#cf1322' }}>{lastError}</span>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      sorter: true,
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 172,
      render: (_: unknown, record) => (
        <Space size="small">
          <Tooltip title="立即执行">
            <Button
              type="link"
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={() => handleRunNow(record)}
              loading={runNowMutation.isPending && runNowMutation.variables === record.id}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除此任务吗？"
            description="删除后会同步移除对应队列任务"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={deleteMutation.isPending}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建任务
        </Button>

        <Search
          placeholder="搜索任务名称"
          allowClear
          style={{ width: 220 }}
          onSearch={(value) => handleSearch('search', value)}
          onChange={(event) => !event.target.value && handleSearch('search', '')}
        />

        <Select
          placeholder="任务类型"
          allowClear
          style={{ width: 120 }}
          onChange={(value) => handleSearch('type', value)}
          options={TASK_TYPE_OPTIONS}
        />

        <Select
          placeholder="任务状态"
          allowClear
          style={{ width: 128 }}
          onChange={(value) => handleSearch('status', value)}
          options={TASK_STATUS_OPTIONS}
        />

        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
          刷新
        </Button>

        <Popconfirm
          title="确定要暂停任务调度吗？"
          description="不会中断正在运行的任务，待执行任务将在恢复调度后继续执行"
          onConfirm={() => pauseMutation.mutate(undefined)}
          okText="确定"
          cancelText="取消"
        >
          <Button icon={<PauseCircleOutlined />} loading={pauseMutation.isPending}>
            暂停调度
          </Button>
        </Popconfirm>

        <Button
          icon={<PlayCircleOutlined />}
          onClick={() => resumeMutation.mutate(undefined)}
          loading={resumeMutation.isPending}
        >
          恢复调度
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tableData}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 1180 }}
        pagination={{
          current: filters.page as number,
          pageSize: filters.pageSize as number,
          total: taskList?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={formMode === 'create' ? '新建任务' : '编辑任务'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={submitTaskForm}
        okText="保存"
        cancelText="取消"
        confirmLoading={submitting}
        destroyOnHidden
        width={720}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="type"
            label="任务类型"
            rules={[{ required: true, message: '请选择任务类型' }]}
          >
            <Select disabled={formMode === 'edit'} options={TASK_TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item
            name="name"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="任务名称" />
          </Form.Item>

          <Form.Item
            name="handler"
            label="任务处理器"
            rules={[{ required: true, message: '请选择任务处理器' }]}
            extra={
              formMode === 'edit'
                ? '为避免已调度任务与数据库状态不一致，任务创建后不可更换处理器'
                : TASK_HANDLER_OPTIONS.find((item) => item.value === watchedHandler)?.description
            }
          >
            <Select
              disabled={formMode === 'edit'}
              options={TASK_HANDLER_OPTIONS.map(({ label, value }) => ({ label, value }))}
              placeholder="请选择任务处理器"
            />
          </Form.Item>

          {watchedType === 'CRON' ? (
            <>
              <Form.Item
                name="cron"
                label="执行计划"
                dependencies={['timezone']}
                rules={[
                  {
                    validator: (_, value: string) => {
                      const error = getCronError(value, watchedTimezone);
                      return error ? Promise.reject(new Error(error)) : Promise.resolve();
                    },
                  },
                ]}
              >
                <CronScheduleEditor timezone={watchedTimezone} />
              </Form.Item>

              <Form.Item
                name="timezone"
                label="时区"
                rules={[{ required: true, message: '请选择时区' }]}
              >
                <Select
                  showSearch
                  options={TIMEZONE_OPTIONS}
                  placeholder="请选择时区"
                  optionFilterProp="label"
                />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                name="runAt"
                label="执行时间"
                rules={[{ required: formMode === 'create', message: '请选择执行时间' }]}
              >
                <DatePicker
                  showTime
                  disabled={formMode === 'edit'}
                  style={{ width: '100%' }}
                  placeholder="选择执行时间"
                />
              </Form.Item>

              {formMode === 'create' ? (
                <Form.Item name="jobIdHint" label="Job ID">
                  <Input placeholder="可选" />
                </Form.Item>
              ) : null}
            </>
          )}

          {watchedHandler === 'migrate_phone_hashes' ? (
            <Alert
              type="info"
              showIcon
              title="同步手机号哈希"
              description="该处理器无需额外参数，将为所有存在手机号的系统账号重新计算并写入哈希。"
              style={{ marginBottom: 24 }}
            />
          ) : null}

          {watchedHandler === 'link_platform_users_by_phone_hash' ? (
            <>
              <Alert
                type="info"
                showIcon
                title="关联平台身份"
                description="仅处理尚未关联且未删除的平台身份，按相同平台和手机号 Hash 匹配，不会覆盖已有的系统账号关联。"
                style={{ marginBottom: 24 }}
              />

              <Space size="middle" style={{ width: '100%' }} align="start">
                <Form.Item
                  name="linkPlatform"
                  label="处理平台"
                  rules={[{ required: true, message: '请选择处理平台' }]}
                  style={{ flex: 1 }}
                >
                  <Select options={PLATFORM_OPTIONS} />
                </Form.Item>

                <Form.Item
                  name="linkBatchSize"
                  label="每批处理数量"
                  rules={[{ required: true, message: '请输入每批处理数量' }]}
                  style={{ flex: 1 }}
                >
                  <InputNumber min={1} max={2000} step={100} style={{ width: '100%' }} />
                </Form.Item>
              </Space>
            </>
          ) : null}

          {watchedHandler === 'link_orders_to_users_by_phone' ? (
            <>
              <Alert
                type="info"
                showIcon
                title="关联订单购买者"
                description="仅处理尚未关联购买者且未删除的订单。国家代码和手机号会先标准化；匹配不到系统账号时自动创建，已软删除系统账号的联系方式会作为冲突跳过。"
                style={{ marginBottom: 24 }}
              />

              <Form.Item
                name="orderLinkBatchSize"
                label="每批处理数量"
                rules={[{ required: true, message: '请输入每批处理数量' }]}
              >
                <InputNumber min={1} max={2000} step={100} style={{ width: '100%' }} />
              </Form.Item>
            </>
          ) : null}

          {watchedHandler === 'invoke_http' ? (
            <>
              <Form.Item
                name="httpUrl"
                label="请求地址"
                rules={[{ required: true, message: '请输入请求地址' }]}
                extra="支持完整 URL，也支持以 / 开头的本服务接口路径"
              >
                <Input placeholder="例如：https://example.com/webhook" />
              </Form.Item>

              <Space size="middle" style={{ width: '100%' }} align="start">
                <Form.Item name="httpMethod" label="请求方法" style={{ width: 180 }}>
                  <Select
                    options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => ({
                      label: method,
                      value: method,
                    }))}
                  />
                </Form.Item>
                <Form.Item name="httpTimeout" label="超时时间（毫秒）" style={{ flex: 1 }}>
                  <InputNumber min={1000} max={120000} step={1000} style={{ width: '100%' }} />
                </Form.Item>
              </Space>

              <Form.Item name="httpHeadersText" label="请求头（JSON）">
                <TextArea rows={3} spellCheck={false} style={{ fontFamily: 'monospace' }} />
              </Form.Item>

              <Form.Item name="httpDataText" label="请求体（JSON）">
                <TextArea rows={4} spellCheck={false} style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </>
          ) : null}

          {watchedHandler && !TASK_HANDLER_OPTIONS.some((item) => item.value === watchedHandler) ? (
            <Form.Item
              name="customPayloadText"
              label="Payload（JSON）"
              rules={[{ required: true, message: '请输入 Payload' }]}
            >
              <TextArea rows={8} spellCheck={false} style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          ) : null}

          {formMode === 'edit' ? (
            <Form.Item name="status" label="任务状态">
              <Select>
                {TASK_STATUS_OPTIONS.map((item) => (
                  <Option key={item.value} value={item.value}>
                    {item.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          ) : null}
        </Form>
      </Modal>
    </div>
  );
}
