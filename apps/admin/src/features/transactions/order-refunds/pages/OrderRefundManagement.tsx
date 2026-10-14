import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import Alert from 'antd/es/alert';
import Button from 'antd/es/button';
import Col from 'antd/es/col';
import DatePicker from 'antd/es/date-picker';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import InputNumber from 'antd/es/input-number';
import message from 'antd/es/message';
import Modal from 'antd/es/modal';
import Popconfirm from 'antd/es/popconfirm';
import Row from 'antd/es/row';
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Tooltip from 'antd/es/tooltip';
import Typography from 'antd/es/typography';
import type { TableProps } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { Perm } from '../../../../app/guards/Perm';
import {
  useTableDeleteMutation,
  useTableMutation,
  useTableQuery,
  type TableQueryParams,
} from '../../../../shared/hooks/useTableQuery';
import { PERMISSIONS } from '../../../../shared/utils/permissions';
import { orderRefundApi } from '../api/orderRefundApi';
import { RefundOrderSelect } from '../components/RefundOrderSelect';
import { ParentRefundSelect } from '../components/ParentRefundSelect';
import { stripeRefundSyncApi } from '../api/stripeRefundSyncApi';
import type {
  BenefitCalculationPreview,
  CreateOrderRefund,
  OrderRefund,
  RefundChannel,
  RefundStatus,
  UpdateOrderRefund,
} from '../types';

const { Search, TextArea } = Input;
const { Link } = Typography;
const { RangePicker } = DatePicker;

const STATUS_OPTIONS = [
  { label: '待结算', value: 'PENDING' as const, color: 'processing' },
  { label: '已结算', value: 'SETTLED' as const, color: 'success' },
];

const CHANNEL_OPTIONS: Array<{ label: string; value: RefundChannel }> = [
  { label: '抖音', value: 'DOUYIN' },
  { label: '支付宝', value: 'ALIPAY' },
  { label: '微信', value: 'WECHAT' },
  { label: 'Stripe', value: 'STRIPE' },
  { label: 'PayPal', value: 'PAYPAL' },
  { label: '人工退款', value: 'MANUAL' },
  { label: '其他', value: 'OTHER' },
];

interface RefundFormValues {
  afterSaleCode?: string;
  orderId?: string;
  refundChannel?: RefundChannel;
  approvalUrl?: string;
  refundAmount?: number;
  refundReason?: string;
  benefitUsedDays?: number;
  applicantName?: string;
  financialNote?: string;
  parentId?: string;
  submittedAt?: Dayjs;
}

function clean(value?: string) {
  return value?.trim() || undefined;
}

function buildPayload(values: RefundFormValues): CreateOrderRefund {
  return {
    afterSaleCode: clean(values.afterSaleCode) ?? '',
    orderId: clean(values.orderId),
    refundChannel: values.refundChannel,
    approvalUrl: clean(values.approvalUrl),
    refundAmount: values.refundAmount,
    refundReason: clean(values.refundReason),
    benefitUsedDays: values.benefitUsedDays,
    applicantName: clean(values.applicantName),
    financialNote: clean(values.financialNote),
    parentId: clean(values.parentId),
    submittedAt: values.submittedAt?.toISOString(),
  };
}

function formatDateTime(value?: string | null) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-';
}

function formatAmount(record: OrderRefund) {
  if (record.refundAmount == null) return '-';
  const currency = record.order?.currency ?? 'CNY';
  const amount = currency === 'JPY' ? record.refundAmount : record.refundAmount / 100;
  return `${currency} ${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  })}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  const responseMessage = (error as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data?.message;
  return Array.isArray(responseMessage) ? responseMessage.join('；') : responseMessage || fallback;
}

export function OrderRefundManagement() {
  const [filters, setFilters] = useState<TableQueryParams>({
    page: 1,
    pageSize: 10,
    sortField: 'submittedAt',
    sortOrder: 'descend',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OrderRefund | null>(null);
  const [calculationPreview, setCalculationPreview] = useState<BenefitCalculationPreview | null>(
    null
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [resyncingCode, setResyncingCode] = useState<string | null>(null);
  const [form] = Form.useForm<RefundFormValues>();

  const { data, isLoading, isFetching, refetch } = useTableQuery<OrderRefund>({
    queryKey: 'order-refunds',
    queryFn: (params) => orderRefundApi.list(params),
    params: filters,
  });

  const handleCalculateBenefit = async (orderId?: string) => {
    if (!orderId) {
      setCalculationPreview(null);
      return;
    }
    setIsCalculating(true);
    try {
      const preview = await orderRefundApi.previewCalculation(orderId);
      setCalculationPreview(preview);
      const currentDays = form.getFieldValue('benefitUsedDays');
      if (currentDays === undefined || currentDays === null) {
        form.setFieldValue('benefitUsedDays', preview.effectiveUsedDays);
      }
    } catch {
      // 忽略或由用户手动测算时处理
    } finally {
      setIsCalculating(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setCalculationPreview(null);
    form.resetFields();
  };

  const createMutation = useTableMutation({
    queryKey: 'order-refunds',
    mutationFn: orderRefundApi.create,
    onSuccess: () => {
      message.success('退款售后登记成功');
      closeModal();
    },
    onError: () => message.error('退款售后登记失败'),
  });

  const updateMutation = useTableMutation({
    queryKey: 'order-refunds',
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrderRefund }) =>
      orderRefundApi.update(id, payload),
    onSuccess: () => {
      message.success('退款售后更新成功');
      closeModal();
    },
    onError: () => message.error('退款售后更新失败'),
  });

  const statusMutation = useTableMutation({
    queryKey: 'order-refunds',
    mutationFn: ({ id, status }: { id: string; status: RefundStatus }) =>
      orderRefundApi.updateStatus(id, status),
    onSuccess: () => message.success('结算状态已更新'),
    onError: () => message.error('结算状态更新失败'),
  });

  const deleteMutation = useTableDeleteMutation({
    queryKey: 'order-refunds',
    mutationFn: orderRefundApi.delete,
    onSuccess: () => message.success('删除成功'),
    onError: () => message.error('删除失败'),
  });

  const handleStripeResync = async (afterSaleCode: string) => {
    setResyncingCode(afterSaleCode);
    try {
      await stripeRefundSyncApi.syncSingle(afterSaleCode);
      message.success(`Stripe 退款单 (${afterSaleCode}) 已同步最新状态`);
      refetch();
    } catch (error) {
      message.error(getErrorMessage(error, 'Stripe 退款同步失败'));
    } finally {
      setResyncingCode(null);
    }
  };

  const changeFilter = (key: string, value: unknown) => {
    setFilters((current) => ({ ...current, [key]: value || undefined, page: 1 }));
  };

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({ submittedAt: dayjs() });
    setModalOpen(true);
  };

  const openEdit = (record: OrderRefund) => {
    setEditing(record);
    setCalculationPreview(null);
    form.setFieldsValue({
      afterSaleCode: record.afterSaleCode,
      orderId: record.orderId ?? undefined,
      refundChannel: record.refundChannel ?? undefined,
      approvalUrl: record.approvalUrl ?? undefined,
      refundAmount: record.refundAmount ?? undefined,
      refundReason: record.refundReason ?? undefined,
      benefitUsedDays: record.benefitUsedDays ?? undefined,
      applicantName: record.applicantName ?? undefined,
      financialNote: record.financialNote ?? undefined,
      parentId: record.parentId ?? undefined,
      submittedAt: record.submittedAt ? dayjs(record.submittedAt) : undefined,
    });
    if (record.orderId) {
      void handleCalculateBenefit(record.orderId);
    }
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const payload = buildPayload(values);
    if (!editing) return createMutation.mutate(payload);
    const update = { ...payload };
    delete (update as Partial<CreateOrderRefund>).afterSaleCode;
    updateMutation.mutate({ id: editing.id, payload: update });
  };

  const columns: TableProps<OrderRefund>['columns'] = [
    {
      title: '售后编号',
      dataIndex: 'afterSaleCode',
      fixed: 'left',
      width: 180,
      sorter: true,
      render: (value: string, record) => (
        <Space direction="vertical" size={2}>
          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{value}</span>
          <span style={{ color: '#64748b', fontSize: 12 }}>{record.applicantName || '-'}</span>
        </Space>
      ),
    },
    {
      title: '订单',
      width: 220,
      render: (_: unknown, record) =>
        record.order ? (
          <Space direction="vertical" size={2}>
            <span>{record.order.orderCode}</span>
            <span style={{ color: '#64748b', fontSize: 12 }}>{record.order.orderNumber}</span>
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: '退款金额',
      dataIndex: 'refundAmount',
      width: 140,
      sorter: true,
      render: (_: number, record) => formatAmount(record),
    },
    {
      title: '渠道',
      dataIndex: 'refundChannel',
      width: 110,
      render: (value: RefundChannel | null) =>
        CHANNEL_OPTIONS.find((item) => item.value === value)?.label ?? '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      sorter: true,
      render: (status: RefundStatus) => {
        const meta = STATUS_OPTIONS.find((item) => item.value === status)!;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: '退款原因',
      dataIndex: 'refundReason',
      width: 220,
      ellipsis: true,
      render: (value: string | null) => value || '-',
    },
    {
      title: '审批',
      dataIndex: 'approvalUrl',
      width: 90,
      render: (value: string | null) =>
        value ? (
          <Link href={value} target="_blank" rel="noreferrer">
            查看
          </Link>
        ) : (
          '-'
        ),
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      width: 160,
      sorter: true,
      render: formatDateTime,
    },
    {
      title: '结算时间',
      dataIndex: 'financialSettledAt',
      width: 160,
      sorter: true,
      render: formatDateTime,
    },
    {
      title: '操作',
      fixed: 'right',
      width: 150,
      render: (_: unknown, record) => (
        <Space size="small">
          <Perm permission={PERMISSIONS.ORDER_REFUND.SETTLE}>
            <Tooltip title={record.status === 'PENDING' ? '标记已结算' : '恢复待结算'}>
              <Popconfirm
                title={
                  record.status === 'PENDING' ? '确认该退款已完成结算？' : '确认恢复为待结算？'
                }
                onConfirm={() =>
                  statusMutation.mutate({
                    id: record.id,
                    status: record.status === 'PENDING' ? 'SETTLED' : 'PENDING',
                  })
                }
              >
                <Button type="link" size="small" icon={<CheckCircleOutlined />} />
              </Popconfirm>
            </Tooltip>
          </Perm>
          {record.refundChannel === 'STRIPE' && record.afterSaleCode && (
            <Tooltip title="从 Stripe 重新拉取最新状态">
              <Button
                type="link"
                size="small"
                icon={<SyncOutlined spin={resyncingCode === record.afterSaleCode} />}
                onClick={() => void handleStripeResync(record.afterSaleCode)}
                disabled={resyncingCode === record.afterSaleCode}
              />
            </Tooltip>
          )}
          <Perm permission={PERMISSIONS.ORDER_REFUND.UPDATE}>
            <Tooltip title="编辑">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEdit(record)}
              />
            </Tooltip>
          </Perm>
          <Perm permission={PERMISSIONS.ORDER_REFUND.DELETE}>
            <Popconfirm
              title="确定删除这条退款售后吗？"
              onConfirm={() => deleteMutation.mutate(record.id)}
            >
              <Tooltip title="删除">
                <Button danger type="link" size="small" icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Perm>
        </Space>
      ),
    },
  ];

  const handleTableChange: TableProps<OrderRefund>['onChange'] = (
    pagination,
    _tableFilters,
    sorter
  ) => {
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    setFilters((current) => ({
      ...current,
      page: pagination.current,
      pageSize: pagination.pageSize,
      sortField: activeSorter.field ? String(activeSorter.field) : undefined,
      sortOrder: activeSorter.order ?? undefined,
    }));
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Search
          allowClear
          placeholder="售后编号 / 订单号 / 申请人"
          enterButton={<SearchOutlined />}
          style={{ width: 300 }}
          onSearch={(value) => changeFilter('keyword', value)}
          onChange={(event) => !event.target.value && changeFilter('keyword', undefined)}
        />
        <Select
          allowClear
          placeholder="结算状态"
          style={{ width: 130 }}
          options={STATUS_OPTIONS}
          onChange={(value) => changeFilter('status', value)}
        />
        <Select
          allowClear
          placeholder="退款渠道"
          style={{ width: 140 }}
          options={CHANNEL_OPTIONS}
          onChange={(value) => changeFilter('refundChannel', value)}
        />
        <RangePicker
          onChange={(dates) =>
            setFilters((current) => ({
              ...current,
              submittedFrom: dates?.[0]?.startOf('day').toISOString(),
              submittedTo: dates?.[1]?.endOf('day').toISOString(),
              page: 1,
            }))
          }
        />
        <Perm permission={PERMISSIONS.ORDER_REFUND.CREATE}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            登记退款
          </Button>
        </Perm>
        <Button icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
          刷新
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isLoading}
        pagination={{
          current: filters.page,
          pageSize: filters.pageSize,
          total: data?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        scroll={{ x: 1540 }}
        onChange={handleTableChange}
      />

      <Modal
        title={editing ? '编辑退款售后' : '登记退款售后'}
        open={modalOpen}
        width={820}
        okText="保存"
        cancelText="取消"
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        onOk={submit}
        onCancel={closeModal}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="afterSaleCode"
                label="售后编号"
                rules={[{ required: true, whitespace: true, message: '请输入售后编号' }]}
              >
                <Input disabled={!!editing} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="orderId" label="关联订单">
                <RefundOrderSelect
                  initialOrder={editing?.order}
                  onChange={(orderId) => {
                    form.setFieldValue('orderId', orderId);
                    if (orderId) {
                      void handleCalculateBenefit(orderId);
                    } else {
                      setCalculationPreview(null);
                    }
                  }}
                />
              </Form.Item>
            </Col>
            {calculationPreview && (
              <Col span={24}>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message={
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <span>
                        权益核算参考：自然经历 <strong>{calculationPreview.naturalDays}</strong> 天
                        {calculationPreview.totalFrozenDays > 0 ? (
                          <>
                            ，累计冻结{' '}
                            <Tag color="warning" style={{ margin: '0 2px' }}>
                              {calculationPreview.totalFrozenDays} 天
                            </Tag>
                          </>
                        ) : null}
                        {calculationPreview.isCurrentlyFrozen ? (
                          <Tag color="error" style={{ margin: '0 2px' }}>
                            当前处于冻结中
                          </Tag>
                        ) : null}
                        ，扣除后有效使用 <strong>{calculationPreview.effectiveUsedDays}</strong>{' '}
                        天（剩余约 {calculationPreview.remainingDays} 天）。建议退款：
                        <strong style={{ color: '#1677ff' }}>
                          ¥{(calculationPreview.suggestedRefundAmount / 100).toFixed(2)}
                        </strong>
                      </span>
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => {
                          form.setFieldsValue({
                            benefitUsedDays: calculationPreview.effectiveUsedDays,
                            refundAmount: calculationPreview.suggestedRefundAmount,
                          });
                          message.success('已应用智能核算天数与建议退款金额');
                        }}
                      >
                        应用建议值
                      </Button>
                    </div>
                  }
                />
              </Col>
            )}
            <Col span={8}>
              <Form.Item name="refundAmount" label="退款金额（分）">
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="refundChannel" label="退款渠道">
                <Select allowClear options={CHANNEL_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="benefitUsedDays"
                label={
                  <Space size={4}>
                    <span>权益使用天数</span>
                    <Tooltip title="基于关联订单总天数与冻结期自动核算有效使用天数">
                      <Button
                        type="link"
                        size="small"
                        style={{ padding: 0, height: 'auto', fontSize: 12 }}
                        loading={isCalculating}
                        onClick={() => {
                          const currentOrderId = form.getFieldValue('orderId');
                          if (!currentOrderId) {
                            message.warning('请先选择关联订单');
                            return;
                          }
                          void handleCalculateBenefit(currentOrderId);
                        }}
                      >
                        智能核算
                      </Button>
                    </Tooltip>
                  </Space>
                }
              >
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="applicantName" label="申请人">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="submittedAt" label="提交时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="approvalUrl"
                label="审批链接"
                rules={[{ type: 'url', message: '请输入有效链接' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="parentId" label="父退款记录">
                <ParentRefundSelect excludeId={editing?.id} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="refundReason" label="退款原因">
                <TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="financialNote" label="财务备注">
                <TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
