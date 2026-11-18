import {
  ArrowLeftOutlined,
  DeleteOutlined,
  DislikeOutlined,
  EditOutlined,
  LikeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Alert from 'antd/es/alert';
import Pagination from 'antd/es/pagination';
import Select from 'antd/es/select';
import Spin from 'antd/es/spin';
import Button from 'antd/es/button';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import message from 'antd/es/message';
import Modal from 'antd/es/modal';
import Popconfirm from 'antd/es/popconfirm';
import Space from 'antd/es/space';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';
import type { TableProps } from 'antd/es/table';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Perm } from '../../../app/guards/Perm';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import {
  qaApi,
  type QAFeedbackRating,
  type QARecord,
  type QASessionListItem,
  type QATargetType,
  type UpdateSessionInput,
} from '../api/qaApi';
import './QADataHubPage.css';

interface DatasetFormValues {
  title: string;
  targetType?: QATargetType;
  target?: { value: string; label: string };
}

interface RecordFormValues {
  question: string;
  answer: string;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

const targetLabels: Record<QATargetType, string> = {
  GLOBAL: '通用',
  PROJECT: '项目',
  MINUTE: '妙记',
  DRIVE_FILE: '云盘文件',
};
const targetTypeOptions = Object.entries(targetLabels).map(([value, label]) => ({ value, label }));

const datasetColors = ['#3155a4', '#176963', '#854375', '#884e22', '#554ba0', '#346482'];
const titleSegments = new Intl.Segmenter('zh', { granularity: 'grapheme' });

function DatasetIcon({ title }: { title: string }) {
  const name = title.trim();
  const numberSuffix = name.match(/\d{1,2}$/u)?.[0];
  const initial = titleSegments.segment(name).containing(0)?.segment;
  let colorIndex = 0;
  for (const character of name) {
    colorIndex = (colorIndex * 31 + character.codePointAt(0)!) % datasetColors.length;
  }
  return (
    <span
      className="qa-dataset-icon"
      aria-hidden="true"
      style={{ backgroundColor: datasetColors[colorIndex] }}
    >
      {numberSuffix ?? initial ?? '·'}
    </span>
  );
}

export function QADataHubPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  return (
    <SharedKnowledgePage
      key={`${user?.currentOrgId}:${user?.id}:${params.get('dataset') ?? 'list'}`}
    />
  );
}

function SharedKnowledgePage() {
  const { user, checkPermission } = useAuth();
  const scope = ['qa', user?.currentOrgId, user?.id] as const;
  const canReadRecords = checkPermission(PERMISSIONS.QA.RECORD_READ);
  const canEditRecords = checkPermission(PERMISSIONS.QA.RECORD_UPDATE);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeDatasetId = searchParams.get('dataset') || undefined;
  const setActiveDatasetId = (id?: string) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (id) next.set('dataset', id);
      else next.delete('dataset');
      return next;
    });
  };
  const [datasetPage, setDatasetPage] = useState(1);
  const [datasetKeyword, setDatasetKeyword] = useState<string>();
  const [targetType, setTargetType] = useState<QATargetType>();
  const [rating, setRating] = useState<QAFeedbackRating>();
  const queryClient = useQueryClient();
  const [datasetForm] = Form.useForm<DatasetFormValues>();
  const [recordForm] = Form.useForm<RecordFormValues>();
  const [editingDataset, setEditingDataset] = useState<QASessionListItem>();
  const [targetSearch, setTargetSearch] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [editingRecord, setEditingRecord] = useState<QARecord>();
  const [datasetModalOpen, setDatasetModalOpen] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [keyword, setKeyword] = useState<string>();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const editingTargetType = Form.useWatch('targetType', datasetForm);
  const hasTargetField = Boolean(editingTargetType && editingTargetType !== 'GLOBAL');

  useEffect(() => {
    const timer = window.setTimeout(() => setTargetKeyword(targetSearch.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [targetSearch]);

  const targetOptionsQuery = useQuery({
    queryKey: [...scope, 'target-options', editingTargetType, targetKeyword],
    queryFn: () => qaApi.listTargetOptions(editingTargetType!, targetKeyword),
    enabled: datasetModalOpen && Boolean(editingDataset) && hasTargetField,
  });

  const datasetParams = { page: datasetPage, pageSize, keyword: datasetKeyword, targetType };
  const sessionsQuery = useQuery({
    queryKey: [...scope, 'sessions', datasetParams],
    queryFn: () => qaApi.listSessions(datasetParams),
    enabled: !activeDatasetId,
  });
  const sessionQuery = useQuery({
    queryKey: [...scope, 'session', activeDatasetId],
    queryFn: () => qaApi.getSession(activeDatasetId!),
    enabled: Boolean(activeDatasetId),
  });
  const recordParams = { page, pageSize, keyword, rating, sessionId: activeDatasetId };
  const recordsQuery = useQuery({
    queryKey: [...scope, 'records', recordParams],
    queryFn: () => qaApi.listRecords(recordParams),
    enabled: Boolean(activeDatasetId && sessionQuery.data && canReadRecords),
  });
  const activeDataset = sessionQuery.data;
  const refreshDatasets = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [...scope, 'sessions'] }),
      queryClient.invalidateQueries({ queryKey: [...scope, 'session'] }),
    ]);
  const refreshRecords = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [...scope, 'records'] }),
      refreshDatasets(),
    ]);

  // Clamp stale pages after concurrent deletions before rendering the next query.
  if (sessionsQuery.data && datasetPage > Math.max(1, sessionsQuery.data.totalPages)) {
    setDatasetPage(Math.max(1, sessionsQuery.data.totalPages));
  }
  if (recordsQuery.data && page > Math.max(1, recordsQuery.data.totalPages)) {
    setPage(Math.max(1, recordsQuery.data.totalPages));
  }

  const closeDatasetModal = () => {
    setDatasetModalOpen(false);
    setEditingDataset(undefined);
    datasetForm.resetFields();
    setTargetSearch('');
    setTargetKeyword('');
  };
  const openCreateDataset = () => {
    setEditingDataset(undefined);
    datasetForm.resetFields();
    setDatasetModalOpen(true);
  };
  const openEditDataset = (dataset: QASessionListItem) => {
    setEditingDataset(dataset);
    datasetForm.setFieldsValue({
      title: dataset.title,
      targetType: dataset.targetType,
      target: dataset.targetId
        ? { value: dataset.targetId, label: dataset.targetName ?? '原关联对象不可用' }
        : undefined,
    });
    setDatasetModalOpen(true);
  };
  const closeRecordModal = () => {
    setRecordModalOpen(false);
    setEditingRecord(undefined);
    recordForm.resetFields();
  };
  const openCreateRecord = () => {
    setEditingRecord(undefined);
    recordForm.resetFields();
    setRecordModalOpen(true);
  };
  const openEditRecord = useCallback(
    (record: QARecord) => {
      if (!canEditRecords) return;
      setEditingRecord(record);
      recordForm.setFieldsValue({ question: record.question, answer: record.answer });
      setRecordModalOpen(true);
    },
    [recordForm, canEditRecords]
  );

  const createDatasetMutation = useMutation({
    mutationFn: (values: DatasetFormValues) =>
      qaApi.createSession({ title: values.title.trim(), targetType: 'GLOBAL' }),
    onSuccess: () => {
      message.success('数据集创建成功');
      closeDatasetModal();
      void refreshDatasets();
    },
    onError: () => message.error('数据集创建失败'),
  });
  const updateDatasetMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateSessionInput }) =>
      qaApi.updateSession(id, values),
    onSuccess: () => {
      message.success('数据集已更新');
      closeDatasetModal();
      void refreshDatasets();
    },
    onError: () => message.error('数据集修改失败'),
  });
  const deleteDatasetMutation = useMutation({
    mutationFn: qaApi.deleteSession,
    onSuccess: (_, deletedId) => {
      message.success('数据集已删除');
      if (activeDatasetId === deletedId) setActiveDatasetId(undefined);
      void refreshRecords();
    },
    onError: () => message.error('数据集删除失败'),
  });
  const createRecordMutation = useMutation({
    mutationFn: (values: RecordFormValues) =>
      qaApi.createRecord(activeDatasetId!, {
        question: values.question.trim(),
        answer: values.answer.trim(),
        generatedBy: 'HUMAN',
      }),
    onSuccess: () => {
      message.success('问答数据已插入');
      closeRecordModal();
      void refreshRecords();
    },
    onError: () => message.error('问答数据保存失败'),
  });
  const updateRecordMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: RecordFormValues }) =>
      qaApi.updateRecord(id, {
        question: values.question.trim(),
        answer: values.answer.trim(),
      }),
    onSuccess: () => {
      message.success('问答数据已更新');
      closeRecordModal();
      void refreshRecords();
    },
    onError: () => message.error('问答数据修改失败'),
  });
  const deleteRecordMutation = useMutation({
    mutationFn: qaApi.deleteRecord,
    onSuccess: () => {
      message.success('问答数据已删除');
      void refreshRecords();
    },
    onError: () => message.error('问答数据删除失败'),
  });
  const feedbackMutation = useMutation({
    mutationFn: ({ recordId, rating }: { recordId: string; rating: QAFeedbackRating | null }) =>
      qaApi.submitFeedback(recordId, rating),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...scope, 'records'] }),
    onError: () => message.error('反馈提交失败'),
  });

  const submitDataset = (values: DatasetFormValues) => {
    if (editingDataset) {
      const selectedType = values.targetType ?? editingDataset.targetType;
      const selectedId = selectedType === 'GLOBAL' ? null : (values.target?.value ?? null);
      const targetChanged =
        selectedType !== editingDataset.targetType || selectedId !== editingDataset.targetId;
      updateDatasetMutation.mutate({
        id: editingDataset.id,
        values: {
          title: values.title.trim(),
          ...(targetChanged ? { targetType: selectedType, targetId: selectedId } : {}),
        },
      });
    } else {
      createDatasetMutation.mutate(values);
    }
  };
  const submitRecord = (values: RecordFormValues) => {
    if (editingRecord) {
      updateRecordMutation.mutate({ id: editingRecord.id, values });
    } else {
      createRecordMutation.mutate(values);
    }
  };

  const datasetColumns: TableProps<QASessionListItem>['columns'] = [
    {
      title: '数据集名称',
      dataIndex: 'title',
      width: '22%',
      render: (title: string) => (
        <div className="qa-dataset-cell-content">
          <DatasetIcon title={title} />
          <Typography.Text className="qa-dataset-cell-label" strong title={title}>
            {title}
          </Typography.Text>
        </div>
      ),
    },
    { title: '问答数', dataIndex: 'recordCount', width: '7%', align: 'center' },
    { title: '创建人', dataIndex: 'creatorName', width: '13%', ellipsis: true },
    {
      title: '关联对象',
      dataIndex: 'targetType',
      width: '22%',
      render: (value: QATargetType, dataset) => (
        <div className="qa-dataset-cell-content">
          <Tag>{targetLabels[value]}</Tag>
          {value !== 'GLOBAL' && (
            <span className="qa-dataset-cell-label" title={dataset.targetName ?? undefined}>
              {dataset.targetName ?? '关联对象不可用'}
            </span>
          )}
        </div>
      ),
    },
    { title: '创建时间', dataIndex: 'createdAt', width: '14%', render: formatDate },
    { title: '更新时间', dataIndex: 'updatedAt', width: '14%', render: formatDate },
    {
      title: '操作',
      width: '8%',
      align: 'center',
      render: (_, dataset) => (
        <Space size={4} onClick={(event) => event.stopPropagation()}>
          <Perm permission={PERMISSIONS.QA.SESSION_UPDATE}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              aria-label="编辑数据集"
              onClick={() => openEditDataset(dataset)}
            />
          </Perm>
          <Perm permission={PERMISSIONS.QA.SESSION_DELETE}>
            <Popconfirm
              title="确定删除这个组织共享数据集吗？组织成员将无法再访问其中的问答。"
              onConfirm={() => deleteDatasetMutation.mutate(dataset.id)}
            >
              <Button
                danger
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                aria-label="删除数据集"
              />
            </Popconfirm>
          </Perm>
        </Space>
      ),
    },
  ];

  const datasetModal = (
    <Modal
      title={editingDataset ? '编辑数据集' : '新建数据集'}
      open={datasetModalOpen}
      okText={editingDataset ? '保存' : '创建'}
      cancelText="取消"
      confirmLoading={createDatasetMutation.isPending || updateDatasetMutation.isPending}
      onCancel={closeDatasetModal}
      onOk={() => datasetForm.submit()}
    >
      <Form form={datasetForm} layout="vertical" onFinish={submitDataset}>
        <Form.Item
          name="title"
          label="数据集名称"
          rules={[{ required: true, whitespace: true, message: '请输入数据集名称' }]}
        >
          <Input maxLength={200} placeholder="例如：产品常见问题" />
        </Form.Item>
        {editingDataset ? (
          <>
            <Form.Item name="targetType" label="数据集类型" rules={[{ required: true }]}>
              <Select<QATargetType>
                options={targetTypeOptions}
                onChange={() => {
                  datasetForm.setFieldValue('target', undefined);
                  setTargetSearch('');
                  setTargetKeyword('');
                }}
              />
            </Form.Item>
            {hasTargetField && editingTargetType && (
              <Form.Item
                name="target"
                label="关联对象"
                preserve={false}
                rules={[{ required: true, message: '请选择关联对象' }]}
              >
                <Select
                  labelInValue
                  showSearch={{
                    filterOption: false,
                    searchValue: targetSearch,
                    onSearch: setTargetSearch,
                  }}
                  onChange={() => setTargetSearch('')}
                  loading={targetOptionsQuery.isFetching}
                  placeholder={`搜索${targetLabels[editingTargetType]}名称`}
                  options={targetOptionsQuery.data?.map(({ id, label, description }) => ({
                    value: id,
                    label: description ? `${label}（${description}）` : label,
                  }))}
                  notFoundContent={
                    targetOptionsQuery.isFetching
                      ? '正在加载关联对象'
                      : targetOptionsQuery.isError
                        ? '加载失败，请关闭下拉框后重试'
                        : '没有匹配的关联对象'
                  }
                  onOpenChange={(open) => {
                    if (open && targetOptionsQuery.isError) void targetOptionsQuery.refetch();
                  }}
                />
              </Form.Item>
            )}
          </>
        ) : (
          <Typography.Text type="secondary">
            创建后，同组织有权限的成员可查看和维护其中的问题与答案。
          </Typography.Text>
        )}
      </Form>
    </Modal>
  );

  if (!activeDatasetId) {
    return (
      <div className="qa-dataset-page">
        <div className="qa-dataset-list-toolbar">
          <Space wrap>
            <Input.Search
              aria-label="搜索数据集"
              placeholder="搜索数据集名称"
              allowClear
              maxLength={200}
              onSearch={(value) => {
                setDatasetKeyword(value.trim() || undefined);
                setDatasetPage(1);
              }}
              onChange={(event) => {
                if (!event.target.value) {
                  setDatasetKeyword(undefined);
                  setDatasetPage(1);
                }
              }}
            />
            <Select<QATargetType>
              aria-label="数据集类型"
              placeholder="全部类型"
              allowClear
              value={targetType}
              style={{ width: 150 }}
              options={targetTypeOptions}
              onChange={(value) => {
                setTargetType(value);
                setDatasetPage(1);
              }}
            />
          </Space>
          <Perm permission={PERMISSIONS.QA.SESSION_CREATE}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDataset}>
              新建数据集
            </Button>
          </Perm>
        </div>
        {sessionsQuery.isError ? (
          <Alert
            type="error"
            showIcon
            title="数据集加载失败"
            action={<Button onClick={() => void sessionsQuery.refetch()}>重试</Button>}
          />
        ) : (
          <Table
            rowKey="id"
            tableLayout="fixed"
            columns={datasetColumns}
            scroll={{ x: 920 }}
            dataSource={sessionsQuery.data?.items ?? []}
            loading={sessionsQuery.isLoading}
            pagination={{
              current: datasetPage,
              pageSize,
              total: sessionsQuery.data?.total ?? 0,
              showSizeChanger: false,
              onChange: setDatasetPage,
              showTotal: (total) => `共 ${total} 个数据集`,
            }}
            locale={{
              emptyText: datasetKeyword || targetType ? '没有匹配的数据集' : '组织内暂无数据集',
            }}
            rowClassName="qa-dataset-row"
            onRow={(dataset) => ({
              onClick: () => {
                setActiveDatasetId(dataset.id);
                setKeyword(undefined);
                setPage(1);
              },
            })}
          />
        )}
        {datasetModal}
      </div>
    );
  }

  if (sessionQuery.isPending)
    return (
      <Spin tip="正在加载数据集">
        <div style={{ minHeight: 240 }} />
      </Spin>
    );
  if (sessionQuery.isError || !activeDataset)
    return (
      <Alert
        type="error"
        showIcon
        title="无法加载数据集"
        description="数据集可能已删除、无权访问，或网络暂时不可用。"
        action={
          <Space>
            <Button onClick={() => void sessionQuery.refetch()}>重试</Button>
            <Button onClick={() => setActiveDatasetId(undefined)}>返回列表</Button>
          </Space>
        }
      />
    );

  return (
    <div className="qa-dataset-detail-page">
      <main className="qa-dataset-main">
        <header className="qa-dataset-detail-header">
          <div className="qa-dataset-title-row">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              aria-label="返回数据集列表"
              title="返回数据集列表"
              onClick={() => setActiveDatasetId(undefined)}
            />
            <div>
              <Typography.Title level={3}>{activeDataset.title}</Typography.Title>
              <div className="qa-dataset-summary">
                <Tag>组织共享</Tag>
                <Tag>{targetLabels[activeDataset.targetType]}</Tag>
                {canReadRecords && (
                  <Typography.Text type="secondary">
                    {recordsQuery.data?.total ?? 0} 条问答{keyword || rating ? '（筛选结果）' : ''}
                  </Typography.Text>
                )}
              </div>
            </div>
          </div>
          <div className="qa-dataset-detail-actions">
            <Input.Search
              key={activeDatasetId}
              className="qa-dataset-search"
              aria-label="搜索问答"
              disabled={!canReadRecords}
              allowClear
              placeholder="搜索问答"
              onSearch={(value) => {
                setKeyword(value.trim() || undefined);
                setPage(1);
              }}
              onChange={(event) => {
                if (!event.target.value) {
                  setKeyword(undefined);
                  setPage(1);
                }
              }}
            />
            <Select<QAFeedbackRating>
              aria-label="质量筛选"
              placeholder="全部质量标记"
              allowClear
              disabled={!canReadRecords}
              value={rating}
              className="qa-dataset-rating"
              options={[
                { value: 'LIKE', label: '已认可' },
                { value: 'DISLIKE', label: '待改进' },
              ]}
              onChange={(value) => {
                setRating(value);
                setPage(1);
              }}
            />
            <Perm permission={PERMISSIONS.QA.RECORD_CREATE}>
              <Button
                className="qa-record-create"
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateRecord}
              >
                插入问答
              </Button>
            </Perm>
          </div>
        </header>

        {!canReadRecords ? (
          <Alert type="info" title="你可以查看数据集信息，但没有查看问答内容的权限。" />
        ) : recordsQuery.isError ? (
          <Alert
            type="error"
            showIcon
            title="问答加载失败"
            action={<Button onClick={() => void recordsQuery.refetch()}>重试</Button>}
          />
        ) : (
          <Spin spinning={recordsQuery.isFetching}>
            <div className="qa-record-card-list">
              {recordsQuery.data?.items.map((record) => (
                <article className="qa-record-card" key={record.id}>
                  <div className="qa-record-card-topline">
                    <Typography.Text strong>{record.question}</Typography.Text>
                    <Tag>
                      {record.generatedBy === 'HUMAN'
                        ? '人工维护'
                        : record.generatedBy === 'AI'
                          ? 'AI 来源'
                          : '系统来源'}
                    </Tag>
                  </div>
                  <Typography.Paragraph>{record.answer}</Typography.Paragraph>
                  {record.citations.length > 0 && (
                    <details className="qa-record-citations">
                      <summary>引用来源（{record.citations.length}）</summary>
                      {record.citations.map((citation) => (
                        <blockquote key={citation.id}>
                          <Typography.Text strong>
                            {citation.title || citation.sourceType}
                          </Typography.Text>
                          {citation.location && <span> · {citation.location}</span>}
                          <p>{citation.snippet}</p>
                        </blockquote>
                      ))}
                    </details>
                  )}
                  <div
                    className="qa-record-card-actions"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Perm permission={PERMISSIONS.QA.RECORD_UPDATE}>
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        aria-label="编辑问答"
                        onClick={() => openEditRecord(record)}
                      >
                        编辑
                      </Button>
                    </Perm>
                    <Perm
                      permission={PERMISSIONS.QA.FEEDBACK_CREATE}
                      fallback={
                        record.rating === 'LIKE'
                          ? '已认可'
                          : record.rating === 'DISLIKE'
                            ? '待改进'
                            : '未标记'
                      }
                    >
                      <Button
                        type={record.rating === 'LIKE' ? 'primary' : 'text'}
                        icon={<LikeOutlined />}
                        aria-label="标记为已认可"
                        title="组织共享质量标记：已认可"
                        disabled={feedbackMutation.isPending}
                        onClick={() =>
                          feedbackMutation.mutate({
                            recordId: record.id,
                            rating: record.rating === 'LIKE' ? null : 'LIKE',
                          })
                        }
                      />
                      <Button
                        danger={record.rating === 'DISLIKE'}
                        type={record.rating === 'DISLIKE' ? 'primary' : 'text'}
                        icon={<DislikeOutlined />}
                        aria-label="标记为待改进"
                        title="组织共享质量标记：待改进"
                        disabled={feedbackMutation.isPending}
                        onClick={() =>
                          feedbackMutation.mutate({
                            recordId: record.id,
                            rating: record.rating === 'DISLIKE' ? null : 'DISLIKE',
                          })
                        }
                      />
                    </Perm>
                    <Perm permission={PERMISSIONS.QA.RECORD_DELETE}>
                      <Popconfirm
                        title="确定永久删除这条共享问答吗？此操作无法恢复。"
                        onConfirm={() => deleteRecordMutation.mutate(record.id)}
                      >
                        <Button
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          aria-label="删除问答"
                        />
                      </Popconfirm>
                    </Perm>
                  </div>
                </article>
              ))}
              {!recordsQuery.isLoading && !recordsQuery.data?.items.length ? (
                <div className="qa-dataset-empty">
                  <Typography.Text type="secondary">
                    {keyword || rating
                      ? '没有匹配的问答，请调整搜索或筛选条件'
                      : '当前数据集还没有问答数据'}
                  </Typography.Text>
                  {!keyword && !rating && (
                    <Perm permission={PERMISSIONS.QA.RECORD_CREATE}>
                      <Button type="link" onClick={openCreateRecord}>
                        插入第一条问答
                      </Button>
                    </Perm>
                  )}
                </div>
              ) : null}
            </div>
          </Spin>
        )}
        {canReadRecords &&
          !recordsQuery.isError &&
          ((recordsQuery.data?.total ?? 0) > pageSize || page > 1) && (
            <Pagination
              className="qa-dataset-pagination"
              current={page}
              pageSize={pageSize}
              total={recordsQuery.data?.total ?? 0}
              showSizeChanger={false}
              onChange={setPage}
            />
          )}
      </main>

      <aside className="qa-dataset-metadata">
        <Typography.Title level={4}>元数据</Typography.Title>
        <dl>
          <dt>数据集 ID</dt>
          <dd>{activeDataset.id}</dd>
          <dt>数据集名称</dt>
          <dd>{activeDataset.title}</dd>
          <dt>创建时间</dt>
          <dd>{formatDate(activeDataset.createdAt)}</dd>
          <dt>更新时间</dt>
          <dd>{formatDate(activeDataset.updatedAt)}</dd>
        </dl>
      </aside>

      <Modal
        title={activeDataset.title}
        open={recordModalOpen}
        width={600}
        okText={editingRecord ? '更新数据' : '插入数据'}
        confirmLoading={createRecordMutation.isPending || updateRecordMutation.isPending}
        onCancel={closeRecordModal}
        onOk={() => recordForm.submit()}
      >
        <div className="qa-record-mode-title">QA 模式</div>
        <Form form={recordForm} layout="vertical" onFinish={submitRecord}>
          <Form.Item
            name="question"
            label="问题"
            rules={[{ required: true, whitespace: true, message: '请输入问题' }]}
          >
            <Input.TextArea maxLength={20000} rows={3} placeholder="输入问题" />
          </Form.Item>
          <Form.Item
            name="answer"
            label="答案"
            rules={[{ required: true, whitespace: true, message: '请输入答案' }]}
          >
            <Input.TextArea maxLength={100000} rows={5} placeholder="输入答案" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
