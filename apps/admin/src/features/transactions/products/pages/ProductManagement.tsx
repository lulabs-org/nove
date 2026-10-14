import { useAuth } from '../../../../shared/hooks/useAuth';
import { DriveMediaPicker, ProjectCoverAvatar } from '../../../drive/components/DriveMediaPicker';
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
import Switch from 'antd/es/switch';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Tooltip from 'antd/es/tooltip';
import type { TableProps } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Perm } from '../../../../app/guards/Perm';
import {
  useTableDeleteMutation,
  useTableMutation,
  useTableQuery,
  type TableQueryParams,
} from '../../../../shared/hooks/useTableQuery';
import { PERMISSIONS } from '../../../../shared/utils/permissions';
import { productApi } from '../api/productApi';
import type {
  CreateProduct,
  Currency,
  Product,
  ProductCategory,
  ProductListParams,
  ProductStatus,
  UpdateProduct,
} from '../types';

const { Search, TextArea } = Input;

interface ProductFormValues {
  productCode: string;
  name: string;
  description?: string;
  shortDescription?: string;
  category: ProductCategory;
  status: ProductStatus;
  price?: number;
  originalPrice?: number;
  currency: Currency;
  durationDays?: number;
  maxUsers?: number;
  tags?: string[];
  imageUrl?: string;
  videoUrl?: string;
  downloadUrl?: string;
  externalUrl?: string;
  sortOrder: number;
  isRecommended: boolean;
  isFeatured: boolean;
  publishedAt?: Dayjs;
}

const CATEGORY_OPTIONS: Array<{ label: string; value: ProductCategory }> = [
  { label: '课程', value: 'COURSE' },
  { label: '会员', value: 'MEMBERSHIP' },
  { label: '咨询', value: 'CONSULTATION' },
  { label: '资料', value: 'MATERIAL' },
  { label: '其他', value: 'OTHER' },
];

const STATUS_OPTIONS: Array<{ label: string; value: ProductStatus; color: string }> = [
  { label: '已上架', value: 'ACTIVE', color: 'success' },
  { label: '已下架', value: 'INACTIVE', color: 'default' },
  { label: '草稿', value: 'DRAFT', color: 'processing' },
  { label: '已归档', value: 'ARCHIVED', color: 'warning' },
];

const CURRENCY_OPTIONS: Array<{ label: string; value: Currency }> = [
  'CNY',
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'HKD',
  'TWD',
  'SGD',
  'AUD',
  'CAD',
].map((value) => ({ label: value, value: value as Currency }));

const nullableText = (value?: string) => value?.trim() || null;

function getErrorMessage(error: unknown, fallback: string): string {
  const responseMessage = (error as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data?.message;
  return Array.isArray(responseMessage) ? responseMessage.join('；') : responseMessage || fallback;
}

function formatMoney(value: number | null, currency: Currency): string {
  if (value === null) return '-';
  const divisor = currency === 'JPY' ? 1 : 100;
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(value / divisor);
}

function buildPayload(values: ProductFormValues): CreateProduct {
  return {
    productCode: values.productCode.trim(),
    name: values.name.trim(),
    description: nullableText(values.description),
    shortDescription: nullableText(values.shortDescription),
    category: values.category,
    status: values.status,
    price: values.price ?? null,
    originalPrice: values.originalPrice ?? null,
    currency: values.currency,
    durationDays: values.durationDays ?? null,
    maxUsers: values.maxUsers ?? null,
    tags: values.tags ?? [],
    imageUrl: nullableText(values.imageUrl),
    videoUrl: nullableText(values.videoUrl),
    downloadUrl: nullableText(values.downloadUrl),
    externalUrl: nullableText(values.externalUrl),
    sortOrder: values.sortOrder,
    isRecommended: values.isRecommended,
    isFeatured: values.isFeatured,
    publishedAt: values.publishedAt?.toISOString() ?? null,
  };
}

export function ProductManagement() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<TableQueryParams>({
    page: 1,
    pageSize: 10,
    sortField: 'sortOrder',
    sortOrder: 'ascend',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm<ProductFormValues>();

  const {
    data: productList,
    isLoading,
    isFetching,
    refetch,
  } = useTableQuery<Product>({
    queryKey: 'products',
    params: filters,
    queryFn: (params) =>
      productApi.list({
        ...(params as Omit<ProductListParams, 'sortOrder'>),
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
    setEditingProduct(null);
    form.resetFields();
  };

  const createMutation = useTableMutation({
    queryKey: 'products',
    mutationFn: productApi.create,
    onSuccess: () => {
      message.success('产品创建成功');
      closeModal();
    },
    onError: (error) => message.error(getErrorMessage(error, '产品创建失败')),
  });

  const updateMutation = useTableMutation({
    queryKey: 'products',
    mutationFn: ({ id, data }: { id: string; data: UpdateProduct }) => productApi.update(id, data),
    onSuccess: () => {
      message.success('产品更新成功');
      closeModal();
    },
    onError: (error) => message.error(getErrorMessage(error, '产品更新失败')),
  });

  const deleteMutation = useTableDeleteMutation({
    queryKey: 'products',
    mutationFn: productApi.delete,
    onSuccess: () => message.success('产品已删除'),
    onError: (error) => message.error(getErrorMessage(error, '产品删除失败')),
  });

  const openCreate = () => {
    setEditingProduct(null);
    form.setFieldsValue({
      productCode: '',
      name: '',
      category: 'COURSE',
      status: 'DRAFT',
      currency: 'CNY',
      tags: [],
      sortOrder: 0,
      isRecommended: false,
      isFeatured: false,
    });
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      productCode: product.productCode,
      name: product.name,
      description: product.description ?? undefined,
      shortDescription: product.shortDescription ?? undefined,
      category: product.category,
      status: product.status,
      price: product.price ?? undefined,
      originalPrice: product.originalPrice ?? undefined,
      currency: product.currency,
      durationDays: product.durationDays ?? undefined,
      maxUsers: product.maxUsers ?? undefined,
      tags: product.tags,
      imageUrl: product.imageUrl ?? undefined,
      videoUrl: product.videoUrl ?? undefined,
      downloadUrl: product.downloadUrl ?? undefined,
      externalUrl: product.externalUrl ?? undefined,
      sortOrder: product.sortOrder,
      isRecommended: product.isRecommended,
      isFeatured: product.isFeatured,
      publishedAt: product.publishedAt ? dayjs(product.publishedAt) : undefined,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const data = buildPayload(values);
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleFilter = (key: string, value: unknown) => {
    setFilters((previous) => ({ ...previous, [key]: value || undefined, page: 1 }));
  };

  const handleTableChange: TableProps<Product>['onChange'] = (
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

  const columns: TableProps<Product>['columns'] = [
    {
      title: '产品',
      key: 'name',
      fixed: 'left',
      width: 300,
      sorter: true,
      render: (_value, record) => (
        <Space align="start">
          <ProjectCoverAvatar reference={record.imageUrl} />
          <Space orientation="vertical" size={1}>
            <span style={{ fontWeight: 600 }}>{record.name}</span>
            <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 12 }}>
              {record.productCode}
            </span>
            {record.shortDescription ? (
              <Tooltip title={record.shortDescription}>
                <span
                  style={{
                    color: '#94a3b8',
                    fontSize: 12,
                    maxWidth: 210,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {record.shortDescription}
                </span>
              </Tooltip>
            ) : null}
          </Space>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: ProductCategory) =>
        CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? category,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 150,
      sorter: true,
      render: (_value: number | null, record) => (
        <Space orientation="vertical" size={0}>
          <span>{formatMoney(record.price, record.currency)}</span>
          {record.originalPrice !== null ? (
            <span style={{ color: '#94a3b8', fontSize: 12, textDecoration: 'line-through' }}>
              {formatMoney(record.originalPrice, record.currency)}
            </span>
          ) : null}
        </Space>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 220,
      render: (tags: string[]) =>
        tags.length ? tags.slice(0, 3).map((tag) => <Tag key={tag}>{tag}</Tag>) : '-',
    },
    {
      title: '销售数据',
      key: 'metrics',
      width: 150,
      sorter: { multiple: 1 },
      dataIndex: 'salesCount',
      render: (_value: number, record) => (
        <Space orientation="vertical" size={0}>
          <span>销量 {record.salesCount}</span>
          <span style={{ color: '#64748b', fontSize: 12 }}>
            浏览 {record.viewCount} · {record.rating === null ? '暂无评分' : `${record.rating} 分`}
          </span>
        </Space>
      ),
    },
    {
      title: '推荐',
      key: 'flags',
      width: 110,
      render: (_value, record) => (
        <Space orientation="vertical" size={2}>
          {record.isRecommended ? <Tag color="gold">推荐</Tag> : null}
          {record.isFeatured ? <Tag color="purple">精选</Tag> : null}
          {!record.isRecommended && !record.isFeatured ? '-' : null}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: ProductStatus) => {
        const meta = STATUS_OPTIONS.find((option) => option.value === status)!;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 90,
      sorter: true,
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
      fixed: 'right',
      width: 120,
      render: (_value, record) => (
        <Space size="small">
          <Perm permission={PERMISSIONS.PRODUCT.UPDATE}>
            <Tooltip title="编辑产品">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEdit(record)}
              />
            </Tooltip>
          </Perm>
          <Perm permission={PERMISSIONS.PRODUCT.DELETE}>
            <Popconfirm
              title="确定要删除此产品吗？"
              description="订单中的产品名称快照会保留，此操作不可撤销"
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={() => deleteMutation.mutate(record.id)}
            >
              <Tooltip title="删除产品">
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

  const tableData = useMemo(() => productList?.data ?? [], [productList?.data]);
  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Perm permission={PERMISSIONS.PRODUCT.CREATE}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增产品
          </Button>
        </Perm>
        <Search
          allowClear
          placeholder="搜索产品名称、编号或描述"
          enterButton={<SearchOutlined />}
          style={{ width: 300 }}
          onSearch={(value) => handleFilter('keyword', value)}
          onChange={(event) => !event.target.value && handleFilter('keyword', undefined)}
        />
        <Select
          allowClear
          placeholder="产品分类"
          style={{ width: 130 }}
          options={CATEGORY_OPTIONS}
          onChange={(value) => handleFilter('category', value)}
        />
        <Select
          allowClear
          placeholder="产品状态"
          style={{ width: 130 }}
          options={STATUS_OPTIONS.map(({ label, value }) => ({ label, value }))}
          onChange={(value) => handleFilter('status', value)}
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
        scroll={{ x: 1550 }}
        pagination={{
          current: filters.page as number,
          pageSize: filters.pageSize as number,
          total: productList?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 个产品`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={editingProduct ? '编辑产品' : '新增产品'}
        open={modalOpen}
        width={960}
        okText="保存"
        cancelText="取消"
        confirmLoading={submitting}
        onOk={submit}
        onCancel={closeModal}
        forceRender
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="productCode"
                label="产品编号"
                rules={[{ required: true, message: '请输入产品编号' }]}
              >
                <Input placeholder="例如：COURSE_001" disabled={Boolean(editingProduct)} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="产品名称"
                rules={[{ required: true, message: '请输入产品名称' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="category" label="产品分类" rules={[{ required: true }]}>
                <Select options={CATEGORY_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="产品状态" rules={[{ required: true }]}>
                <Select options={STATUS_OPTIONS.map(({ label, value }) => ({ label, value }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="currency" label="币种" rules={[{ required: true }]}>
                <Select options={CURRENCY_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="price" label="售价（最小货币单位）">
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="originalPrice"
                label="原价（最小货币单位）"
                dependencies={['price']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator: (_, value?: number) =>
                      value == null ||
                      getFieldValue('price') == null ||
                      value >= getFieldValue('price')
                        ? Promise.resolve()
                        : Promise.reject(new Error('原价不能低于售价')),
                  }),
                ]}
              >
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sortOrder" label="排序权重">
                <InputNumber precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="durationDays" label="有效期（天）">
                <InputNumber min={1} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxUsers" label="最大用户数">
                <InputNumber min={1} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="publishedAt" label="发布时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="tags" label="产品标签">
                <Select mode="tags" tokenSeparators={[',', '，']} placeholder="输入标签后回车" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isRecommended" label="推荐产品" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isFeatured" label="精选产品" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="shortDescription" label="简短描述">
                <Input maxLength={200} showCount />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="详细描述">
                <TextArea rows={4} maxLength={3000} showCount />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="imageUrl" label="产品图片">
                <DriveMediaPicker
                  orgId={user?.currentOrgId ?? ''}
                  label="产品图片"
                  entityLabel="产品"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="videoUrl" label="产品视频">
                <DriveMediaPicker
                  orgId={user?.currentOrgId ?? ''}
                  label="产品视频"
                  entityLabel="产品"
                  mediaType="video"
                />
              </Form.Item>
            </Col>
            {[
              ['downloadUrl', '下载链接'],
              ['externalUrl', '外部链接'],
            ].map(([name, label]) => (
              <Col span={12} key={name}>
                <Form.Item name={name} label={label} rules={[{ type: 'url', warningOnly: true }]}>
                  <Input placeholder="https://" />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
