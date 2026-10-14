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
import type { TableProps } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import {
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Perm } from '../../../../app/guards/Perm';
import {
  useTableDeleteMutation,
  useTableMutation,
  useTableQuery,
  type TableQueryParams,
} from '../../../../shared/hooks/useTableQuery';
import { PERMISSIONS } from '../../../../shared/utils/permissions';
import { useOrderAbility } from '../hooks/useOrderAbility';
import { orderApi } from '../api/orderApi';
import { OrderBenefitModal } from '../components/OrderBenefitModal';
import { OrderChannelSelect } from '../components/OrderChannelSelect';
import { OrderProductSelect } from '../components/OrderProductSelect';
import { ORDER_STATUS_OPTIONS } from '../components/orderStatusOptions';
import { stripeOrderSyncApi } from '../api/stripeOrderSyncApi';
import { OrderUserSelect } from '../components/OrderUserSelect';
import { toNullableOrderOwnerId } from '../components/orderOwnerValue';
import type {
  CreateOrder,
  Currency,
  Order,
  OrderStatus,
  PaymentProvider,
  UpdateOrder,
} from '../types';

const { Search } = Input;
const { RangePicker } = DatePicker;

function getErrorMessage(error: unknown, fallback: string): string {
  const responseMessage = (error as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data?.message;
  return Array.isArray(responseMessage) ? responseMessage.join('；') : responseMessage || fallback;
}

type OrderFormMode = 'create' | 'edit';

interface OrderFormValues {
  orderCode?: string;
  orderNumber?: string;
  externalId?: string;
  productId?: string;
  productName?: string;
  purchaserId?: string;
  channelId?: number | null;
  email?: string;
  phone?: string;
  phoneCode?: string;
  currentOwnerId?: string;
  financialCloserId?: string;
  financialClosedAt?: Dayjs;
  amount?: number;
  currency?: Currency;
  amountCny?: number;
  status?: OrderStatus;
  paidAt?: Dayjs;
  cancelledAt?: Dayjs;
  completedAt?: Dayjs;
  durationDays?: number;
  benefitStart?: Dayjs;
  benefitEnd?: Dayjs;
  paymentProvider?: PaymentProvider;
  providerTradeNo?: string;
}

const CURRENCY_OPTIONS: Array<{ label: string; value: Currency }> = [
  { label: 'CNY', value: 'CNY' },
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'GBP', value: 'GBP' },
  { label: 'JPY', value: 'JPY' },
  { label: 'HKD', value: 'HKD' },
  { label: 'TWD', value: 'TWD' },
  { label: 'SGD', value: 'SGD' },
  { label: 'AUD', value: 'AUD' },
  { label: 'CAD', value: 'CAD' },
];

const PAYMENT_PROVIDER_OPTIONS: Array<{ label: string; value: PaymentProvider }> = [
  { label: 'Stripe', value: 'STRIPE' },
  { label: 'PayPal', value: 'PAYPAL' },
  { label: '微信支付', value: 'WECHAT' },
  { label: '支付宝', value: 'ALIPAY' },
  { label: 'Apple Pay', value: 'APPLE_PAY' },
  { label: 'Google Pay', value: 'GOOGLE_PAY' },
  { label: '其他', value: 'OTHER' },
];

function cleanString(value?: string) {
  return value?.trim() || undefined;
}

function toIso(value?: Dayjs) {
  return value ? value.toISOString() : undefined;
}

function toDayjs(value?: string | null) {
  return value ? dayjs(value) : undefined;
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN', { hour12: false });
}

function formatMoney(amount: number, currency: Currency) {
  const normalized = currency === 'JPY' ? amount : amount / 100;
  return `${currency} ${normalized.toLocaleString('zh-CN', {
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  })}`;
}

function getStatusMeta(status: OrderStatus) {
  return ORDER_STATUS_OPTIONS.find((item) => item.value === status) || ORDER_STATUS_OPTIONS[0];
}

function buildPayload(values: OrderFormValues): CreateOrder {
  return {
    orderCode: cleanString(values.orderCode),
    orderNumber: cleanString(values.orderNumber),
    externalId: cleanString(values.externalId),
    productId: cleanString(values.productId),
    productName: cleanString(values.productName),
    purchaserId: cleanString(values.purchaserId),
    channelId: values.channelId ?? undefined,
    email: cleanString(values.email),
    phone: cleanString(values.phone),
    phoneCode: cleanString(values.phoneCode),
    currentOwnerId: toNullableOrderOwnerId(values.currentOwnerId),
    financialCloserId: cleanString(values.financialCloserId),
    financialClosedAt: toIso(values.financialClosedAt),
    amount: values.amount ?? 0,
    currency: values.currency,
    amountCny: values.amountCny,
    status: values.status,
    paidAt: toIso(values.paidAt),
    cancelledAt: toIso(values.cancelledAt),
    completedAt: toIso(values.completedAt),
    durationDays: values.durationDays !== undefined ? values.durationDays : undefined,
    benefitStart: toIso(values.benefitStart),
    benefitEnd: toIso(values.benefitEnd),
    paymentProvider: values.paymentProvider,
    providerTradeNo: cleanString(values.providerTradeNo),
  };
}

export function OrderManagement() {
  const [filters, setFilters] = useState<TableQueryParams>({
    page: 1,
    pageSize: 10,
    keyword: '',
    status: undefined,
    currency: undefined,
    paymentProvider: undefined,
    sortField: 'createdAt',
    sortOrder: 'descend',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<OrderFormMode>('create');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [benefitModalOpen, setBenefitModalOpen] = useState(false);
  const [benefitModalOrder, setBenefitModalOrder] = useState<Order | null>(null);
  const [resyncingId, setResyncingId] = useState<string | null>(null);
  const [form] = Form.useForm<OrderFormValues>();
  const { checkOrderEdit, checkBenefitAdjustment, checkOrderDelete } = useOrderAbility();

  const {
    data: orderList,
    isLoading,
    isFetching,
    refetch,
  } = useTableQuery<Order>({
    queryKey: 'orders',
    queryFn: (params) => orderApi.list(params),
    params: filters,
  });

  const createMutation = useTableMutation({
    queryKey: 'orders',
    mutationFn: orderApi.create,
    onSuccess: () => {
      message.success('创建订单成功');
      closeModal();
    },
    onError: () => {
      message.error('创建订单失败');
    },
  });

  const updateMutation = useTableMutation({
    queryKey: 'orders',
    mutationFn: ({ id, data }: { id: string; data: UpdateOrder }) => orderApi.update(id, data),
    onSuccess: () => {
      message.success('更新订单成功');
      closeModal();
    },
    onError: () => {
      message.error('更新订单失败');
    },
  });

  const deleteMutation = useTableDeleteMutation({
    queryKey: 'orders',
    mutationFn: orderApi.delete,
    onSuccess: () => {
      message.success('删除订单成功');
    },
    onError: () => {
      message.error('删除订单失败');
    },
  });

  const tableData = useMemo(() => orderList?.data ?? [], [orderList?.data]);
  const submitting = createMutation.isPending || updateMutation.isPending;

  const handleFilterChange = (field: string, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value || undefined,
      page: 1,
    }));
  };

  const handlePaidRangeChange = (dates: null | [Dayjs | null, Dayjs | null]) => {
    setFilters((prev) => ({
      ...prev,
      paidFrom: dates?.[0]?.startOf('day').toISOString(),
      paidTo: dates?.[1]?.endOf('day').toISOString(),
      page: 1,
    }));
  };

  const handleStripeResync = async (externalId: string) => {
    setResyncingId(externalId);
    try {
      await stripeOrderSyncApi.syncSingle(externalId);
      message.success(`Stripe 订单 (${externalId}) 已同步最新状态`);
      refetch();
    } catch (error) {
      message.error(getErrorMessage(error, 'Stripe 同步失败'));
    } finally {
      setResyncingId(null);
    }
  };

  const handleCreate = () => {
    setFormMode('create');
    setEditingOrder(null);
    form.setFieldsValue({
      orderCode: '',
      orderNumber: '',
      externalId: '',
      productId: '',
      productName: '',
      purchaserId: '',
      channelId: null,
      email: '',
      phone: '',
      phoneCode: '+86',
      currentOwnerId: '',
      financialCloserId: '',
      financialClosedAt: undefined,
      amount: 0,
      currency: 'CNY',
      amountCny: undefined,
      status: 'UNPAID',
      paidAt: undefined,
      cancelledAt: undefined,
      completedAt: undefined,
      durationDays: undefined,
      benefitStart: undefined,
      benefitEnd: undefined,
      paymentProvider: undefined,
      providerTradeNo: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (record: Order) => {
    setFormMode('edit');
    setEditingOrder(record);
    form.setFieldsValue({
      orderCode: record.orderCode,
      orderNumber: record.orderNumber,
      externalId: record.externalId ?? '',
      productId: record.productId ?? '',
      productName: record.productName ?? record.product?.name ?? '',
      purchaserId: record.purchaserId ?? '',
      channelId: record.channelId,
      email: record.email ?? '',
      phone: record.phone ?? '',
      phoneCode: record.phoneCode ?? '+86',
      currentOwnerId: record.currentOwnerId ?? '',
      financialCloserId: record.financialCloserId ?? '',
      financialClosedAt: toDayjs(record.financialClosedAt),
      amount: record.amount,
      currency: record.currency,
      amountCny: record.amountCny ?? undefined,
      status: record.status,
      paidAt: toDayjs(record.paidAt),
      cancelledAt: toDayjs(record.cancelledAt),
      completedAt: toDayjs(record.completedAt),
      durationDays: record.durationDays ?? undefined,
      benefitStart: toDayjs(record.benefitStart),
      benefitEnd: toDayjs(record.benefitEnd),
      paymentProvider: record.paymentProvider ?? undefined,
      providerTradeNo: record.providerTradeNo ?? '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingOrder(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = buildPayload(values);

    if (formMode === 'create') {
      createMutation.mutate(payload);
      return;
    }

    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id, data: payload });
    }
  };

  const handleTableChange: TableProps<Order>['onChange'] = (pagination, _filters, sorter) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current,
      pageSize: pagination.pageSize,
      sortField: Array.isArray(sorter)
        ? String(sorter[0].field)
        : sorter.field
          ? String(sorter.field)
          : undefined,
      sortOrder: (Array.isArray(sorter) ? sorter[0].order : sorter.order) || undefined,
    }));
  };

  const columns: TableProps<Order>['columns'] = [
    {
      title: '订单',
      key: 'order',
      fixed: 'left',
      width: 260,
      render: (_: unknown, record) => (
        <Space direction="vertical" size={2}>
          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{record.orderCode}</span>
          <span style={{ color: '#64748b', fontSize: 12 }}>{record.orderNumber}</span>
          {record.externalId && (
            <span style={{ color: '#94a3b8', fontSize: 12 }}>{record.externalId}</span>
          )}
        </Space>
      ),
    },
    {
      title: '商品与客户',
      key: 'customer',
      width: 260,
      render: (_: unknown, record) => (
        <Space direction="vertical" size={2}>
          <span>{record.productName || record.product?.name || '-'}</span>
          <span style={{ color: '#64748b', fontSize: 12 }}>
            {[record.email, record.phone].filter(Boolean).join(' / ') || '-'}
          </span>
        </Space>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      sorter: true,
      render: (_: number, record) => formatMoney(record.amount, record.currency),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      sorter: true,
      render: (status: OrderStatus) => {
        const meta = getStatusMeta(status);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: '支付',
      key: 'payment',
      width: 180,
      render: (_: unknown, record) => (
        <Space direction="vertical" size={2}>
          <span>{record.paymentProvider || '-'}</span>
          <span style={{ color: '#64748b', fontSize: 12 }}>{formatDateTime(record.paidAt)}</span>
        </Space>
      ),
    },
    {
      title: '渠道',
      key: 'channel',
      width: 140,
      render: (_: unknown, record) => record.channel?.name || record.channelId || '-',
    },
    {
      title: '权益周期',
      dataIndex: 'benefitEnd',
      key: 'benefitEnd',
      width: 200,
      render: (value: string | null, record) => (
        <Space direction="vertical" size={2}>
          <span>{formatDateTime(value)}</span>
          <Space size={4} wrap>
            {record.durationDays ? (
              <Tag color="blue" style={{ margin: 0 }}>
                {record.durationDays} 天
              </Tag>
            ) : null}
            {record.status === 'FROZEN' && (
              <Tag color="cyan" style={{ margin: 0 }}>
                已冻结
              </Tag>
            )}
            {record.frozenDays > 0 && (
              <Tag color="default" style={{ margin: 0 }}>
                累计冻结 {record.frozenDays} 天
              </Tag>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      sorter: true,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_: unknown, record: Order) => {
        const editCheck = checkOrderEdit(record);
        const benefitCheck = checkBenefitAdjustment(record);
        const deleteCheck = checkOrderDelete(record);

        return (
          <Space size="small">
            <Perm permission={PERMISSIONS.ORDER.UPDATE}>
              <Tooltip title={benefitCheck.reason || '权益调整 (冻结 / 解冻 / 延期)'}>
                <Button
                  type="link"
                  size="small"
                  disabled={!benefitCheck.allowed}
                  icon={<ClockCircleOutlined />}
                  onClick={() => {
                    setBenefitModalOrder(record);
                    setBenefitModalOpen(true);
                  }}
                />
              </Tooltip>
            </Perm>
            {record.paymentProvider === 'STRIPE' && record.externalId && (
              <Tooltip title="从 Stripe 重新拉取最新状态">
                <Button
                  type="link"
                  size="small"
                  icon={<SyncOutlined spin={resyncingId === record.externalId} />}
                  onClick={() => void handleStripeResync(record.externalId!)}
                  disabled={resyncingId === record.externalId}
                />
              </Tooltip>
            )}
            <Perm permission={PERMISSIONS.ORDER.UPDATE}>
              <Tooltip title={editCheck.reason || '编辑订单'}>
                <Button
                  type="link"
                  size="small"
                  disabled={!editCheck.allowed}
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
            </Perm>
            {deleteCheck.allowed && (
              <Perm permission={PERMISSIONS.ORDER.DELETE}>
                <Popconfirm
                  title="确定要删除此订单吗？"
                  description="删除后订单会进入软删除状态"
                  okText="确定"
                  cancelText="取消"
                  onConfirm={() => deleteMutation.mutate(record.id)}
                >
                  <Tooltip title="删除订单">
                    <Button
                      type="link"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      loading={deleteMutation.isPending}
                    />
                  </Tooltip>
                </Popconfirm>
              </Perm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Search
          allowClear
          placeholder="搜索订单号 / 客户 / 流水号"
          enterButton={<SearchOutlined />}
          style={{ width: 280 }}
          onSearch={(value) => handleFilterChange('keyword', value)}
          onChange={(event) => {
            if (!event.target.value) handleFilterChange('keyword', undefined);
          }}
        />
        <Select
          allowClear
          placeholder="状态"
          style={{ width: 140 }}
          options={ORDER_STATUS_OPTIONS.map(({ label, value }) => ({ label, value }))}
          onChange={(value) => handleFilterChange('status', value)}
        />
        <Select
          allowClear
          placeholder="币种"
          style={{ width: 120 }}
          options={CURRENCY_OPTIONS}
          onChange={(value) => handleFilterChange('currency', value)}
        />
        <Select
          allowClear
          placeholder="支付方式"
          style={{ width: 140 }}
          options={PAYMENT_PROVIDER_OPTIONS}
          onChange={(value) => handleFilterChange('paymentProvider', value)}
        />
        <RangePicker onChange={handlePaidRangeChange} />
        <Perm permission={PERMISSIONS.ORDER.CREATE}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增订单
          </Button>
        </Perm>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
          刷新
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tableData}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: filters.page,
          pageSize: filters.pageSize,
          total: orderList?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        scroll={{ x: 1490 }}
        onChange={handleTableChange}
      />

      <Modal
        title={formMode === 'create' ? '新增订单' : '编辑订单'}
        open={modalOpen}
        width={920}
        okText="保存"
        cancelText="取消"
        confirmLoading={submitting}
        onOk={handleSubmit}
        onCancel={closeModal}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="orderCode" label="内部订单号">
                <Input placeholder="留空自动生成" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="orderNumber" label="展示订单号">
                <Input placeholder="留空自动生成" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="externalId" label="外部订单号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="providerTradeNo" label="支付流水号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="productName" label="商品名称">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="productId" label="产品">
                <OrderProductSelect initialProduct={editingOrder?.product} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="amount"
                label="金额（分）"
                rules={[{ required: true, message: '请输入金额' }]}
              >
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="currency"
                label="币种"
                rules={[{ required: true, message: '请选择币种' }]}
              >
                <Select options={CURRENCY_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select
                  options={ORDER_STATUS_OPTIONS.map(({ label, value }) => ({ label, value }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="amountCny" label="人民币金额（分）">
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="paymentProvider" label="支付方式">
                <Select allowClear options={PAYMENT_PROVIDER_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="channelId" label="渠道">
                <OrderChannelSelect initialChannel={editingOrder?.channel} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="email" label="客户邮箱">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="phoneCode" label="区号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="phone" label="手机号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="purchaserId" label="购买者用户">
                <OrderUserSelect
                  initialUser={editingOrder?.purchaser}
                  placeholder="搜索并选择购买者"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currentOwnerId" label="负责人">
                <OrderUserSelect
                  initialUser={editingOrder?.currentOwner}
                  placeholder="搜索并选择负责人"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="financialCloserId" label="财务结单人">
                <OrderUserSelect
                  initialUser={editingOrder?.financialCloser}
                  placeholder="搜索并选择财务结单人"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paidAt" label="支付时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="financialClosedAt" label="财务结单时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="durationDays" label="权益时长（天）">
                <InputNumber
                  min={1}
                  max={3650}
                  addonAfter="天"
                  placeholder="留空默认继承商品"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="benefitStart" label="权益开始">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="benefitEnd" label="权益结束">
                <DatePicker showTime placeholder="留空自动推算" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <OrderBenefitModal
        order={benefitModalOrder}
        open={benefitModalOpen}
        onClose={() => {
          setBenefitModalOpen(false);
          setBenefitModalOrder(null);
          refetch();
        }}
      />
    </div>
  );
}
