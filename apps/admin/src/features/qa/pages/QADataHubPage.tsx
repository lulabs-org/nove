import {
  ArrowLeftOutlined,
  DeleteOutlined,
  DislikeOutlined,
  EditOutlined,
  LikeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useCallback, useState } from 'react';
import { Perm } from '../../../app/guards/Perm';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { qaApi, type QAFeedbackRating, type QARecord, type QASession } from '../api/qaApi';
import './QADataHubPage.css';

interface DatasetFormValues {
  title: string;
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

export function QADataHubPage() {
  const queryClient = useQueryClient();
  const [datasetForm] = Form.useForm<DatasetFormValues>();
  const [recordForm] = Form.useForm<RecordFormValues>();
  const [activeDatasetId, setActiveDatasetId] = useState<string>();
  const [editingDataset, setEditingDataset] = useState<QASession>();
  const [editingRecord, setEditingRecord] = useState<QARecord>();
  const [datasetModalOpen, setDatasetModalOpen] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [keyword, setKeyword] = useState<string>();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const sessionsQuery = useQuery({ queryKey: ['qa-sessions'], queryFn: qaApi.listSessions });
  const recordParams = { page, pageSize, keyword, sessionId: activeDatasetId };
  const recordsQuery = useQuery({
    queryKey: ['qa-records', recordParams],
    queryFn: () => qaApi.listRecords(recordParams),
    enabled: Boolean(activeDatasetId),
  });
  const blankDatasets =
    sessionsQuery.data?.items.filter((item) => item.targetType === 'GLOBAL') ?? [];
  const activeDataset = blankDatasets.find((item) => item.id === activeDatasetId);

  const closeDatasetModal = () => {
    setDatasetModalOpen(false);
    setEditingDataset(undefined);
    datasetForm.resetFields();
  };
  const openCreateDataset = () => {
    setEditingDataset(undefined);
    datasetForm.resetFields();
    setDatasetModalOpen(true);
  };
  const openEditDataset = (dataset: QASession) => {
    setEditingDataset(dataset);
    datasetForm.setFieldsValue({ title: dataset.title });
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
      setEditingRecord(record);
      recordForm.setFieldsValue({ question: record.question, answer: record.answer });
      setRecordModalOpen(true);
    },
    [recordForm]
  );

  const createDatasetMutation = useMutation({
    mutationFn: (values: DatasetFormValues) =>
      qaApi.createSession({ title: values.title.trim(), targetType: 'GLOBAL' }),
    onSuccess: () => {
      message.success('空白数据集创建成功');
      closeDatasetModal();
      queryClient.invalidateQueries({ queryKey: ['qa-sessions'] });
    },
    onError: () => message.error('空白数据集创建失败'),
  });
  const updateDatasetMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      qaApi.updateSession(id, { title: title.trim() }),
    onSuccess: () => {
      message.success('数据集名称已更新');
      closeDatasetModal();
      queryClient.invalidateQueries({ queryKey: ['qa-sessions'] });
    },
    onError: () => message.error('数据集修改失败'),
  });
  const deleteDatasetMutation = useMutation({
    mutationFn: qaApi.deleteSession,
    onSuccess: (_, deletedId) => {
      message.success('数据集已删除');
      if (activeDatasetId === deletedId) setActiveDatasetId(undefined);
      queryClient.invalidateQueries({ queryKey: ['qa-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['qa-records'] });
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
      queryClient.invalidateQueries({ queryKey: ['qa-records'] });
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
      queryClient.invalidateQueries({ queryKey: ['qa-records'] });
    },
    onError: () => message.error('问答数据修改失败'),
  });
  const deleteRecordMutation = useMutation({
    mutationFn: qaApi.deleteRecord,
    onSuccess: () => {
      message.success('问答数据已删除');
      queryClient.invalidateQueries({ queryKey: ['qa-records'] });
    },
    onError: () => message.error('问答数据删除失败'),
  });
  const feedbackMutation = useMutation({
    mutationFn: ({ recordId, rating }: { recordId: string; rating: QAFeedbackRating | null }) =>
      qaApi.submitFeedback(recordId, rating),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qa-records'] }),
    onError: () => message.error('反馈提交失败'),
  });

  const submitDataset = (values: DatasetFormValues) => {
    if (editingDataset) {
      updateDatasetMutation.mutate({ id: editingDataset.id, title: values.title });
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

  const datasetColumns: TableProps<QASession>['columns'] = [
    {
      title: '数据集名称',
      dataIndex: 'title',
      render: (title: string) => (
        <Space>
          <span className="qa-dataset-icon">Q</span>
          <Typography.Text strong>{title}</Typography.Text>
        </Space>
      ),
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 190, render: formatDate },
    { title: '更新时间', dataIndex: 'updatedAt', width: 190, render: formatDate },
    { title: '状态', width: 110, render: () => <Tag color="success">已就绪</Tag> },
    {
      title: '操作',
      width: 110,
      render: (_, dataset) => (
        <Space onClick={(event) => event.stopPropagation()}>
          <Perm permission={PERMISSIONS.QA.SESSION_UPDATE}>
            <Button
              type="text"
              icon={<EditOutlined />}
              aria-label="编辑数据集"
              onClick={() => openEditDataset(dataset)}
            />
          </Perm>
          <Perm permission={PERMISSIONS.QA.SESSION_DELETE}>
            <Popconfirm
              title="确定删除这个数据集及其全部问答吗？"
              onConfirm={() => deleteDatasetMutation.mutate(dataset.id)}
            >
              <Button danger type="text" icon={<DeleteOutlined />} aria-label="删除数据集" />
            </Popconfirm>
          </Perm>
        </Space>
      ),
    },
  ];

  const datasetModal = (
    <Modal
      title={editingDataset ? '编辑数据集' : '新建空白数据集'}
      open={datasetModalOpen}
      okText={editingDataset ? '保存' : '创建'}
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
        {!editingDataset ? (
          <Typography.Text type="secondary">
            将创建一个空白数据集，之后可以手动插入问题和答案。
          </Typography.Text>
        ) : null}
      </Form>
    </Modal>
  );

  if (!activeDatasetId || !activeDataset) {
    return (
      <div className="qa-dataset-page">
        <div className="qa-dataset-list-header">
          <div>
            <Typography.Title level={3}>问答知识库</Typography.Title>
            <Typography.Text type="secondary">使用空白数据集整理和维护问答内容</Typography.Text>
          </div>
          <Perm permission={PERMISSIONS.QA.SESSION_CREATE}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDataset}>
              新建空白数据集
            </Button>
          </Perm>
        </div>
        <Table
          rowKey="id"
          columns={datasetColumns}
          dataSource={blankDatasets}
          loading={sessionsQuery.isLoading}
          pagination={false}
          rowClassName="qa-dataset-row"
          onRow={(dataset) => ({
            onClick: () => {
              setActiveDatasetId(dataset.id);
              setKeyword(undefined);
              setPage(1);
            },
          })}
        />
        {datasetModal}
      </div>
    );
  }

  return (
    <div className="qa-dataset-detail-page">
      <main className="qa-dataset-main">
        <div className="qa-dataset-detail-header">
          <div>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                setActiveDatasetId(undefined);
                setKeyword(undefined);
                setPage(1);
              }}
            >
              返回
            </Button>
            <div className="qa-dataset-title-row">
              <span className="qa-dataset-icon">Q</span>
              <Typography.Title level={3}>{activeDataset.title}</Typography.Title>
            </div>
          </div>
          <div className="qa-dataset-detail-actions">
            <Input.Search
              className="qa-dataset-search"
              allowClear
              placeholder="搜索相关数据"
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
            <Perm permission={PERMISSIONS.QA.SESSION_UPDATE}>
              <Button icon={<EditOutlined />} onClick={() => openEditDataset(activeDataset)}>
                编辑数据集
              </Button>
            </Perm>
            <Perm permission={PERMISSIONS.QA.RECORD_CREATE}>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateRecord}>
                插入
              </Button>
            </Perm>
          </div>
        </div>

        <div className="qa-dataset-summary">
          <Space>
            <Typography.Text>{recordsQuery.data?.total ?? 0} 组数据</Typography.Text>
            <Tag color="success">已就绪</Tag>
          </Space>
        </div>

        <div className="qa-record-card-list">
          {recordsQuery.data?.items.map((record) => (
            <article
              className="qa-record-card"
              key={record.id}
              onClick={() => openEditRecord(record)}
            >
              <div className="qa-record-card-topline">
                <Typography.Text strong>{record.question}</Typography.Text>
                <Tag color="success">已索引</Tag>
              </div>
              <Typography.Paragraph>{record.answer}</Typography.Paragraph>
              <div className="qa-record-card-actions" onClick={(event) => event.stopPropagation()}>
                <Perm permission={PERMISSIONS.QA.FEEDBACK_CREATE} fallback={record.rating || '-'}>
                  <Button
                    type={record.rating === 'LIKE' ? 'primary' : 'text'}
                    icon={<LikeOutlined />}
                    aria-label="满意"
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
                    aria-label="不满意"
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
                    title="确定删除这条问答吗？"
                    onConfirm={() => deleteRecordMutation.mutate(record.id)}
                  >
                    <Button danger type="text" icon={<DeleteOutlined />} aria-label="删除问答" />
                  </Popconfirm>
                </Perm>
              </div>
            </article>
          ))}
          {!recordsQuery.isLoading && !recordsQuery.data?.items.length ? (
            <div className="qa-dataset-empty">
              <Typography.Text type="secondary">当前数据集还没有问答数据</Typography.Text>
              <Perm permission={PERMISSIONS.QA.RECORD_CREATE}>
                <Button type="link" onClick={openCreateRecord}>
                  插入第一条问答
                </Button>
              </Perm>
            </div>
          ) : null}
        </div>

        {(recordsQuery.data?.total ?? 0) > pageSize ? (
          <div className="qa-dataset-pagination">
            <Button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
              上一页
            </Button>
            <Typography.Text>第 {page} 页</Typography.Text>
            <Button
              disabled={page >= (recordsQuery.data?.totalPages ?? 1)}
              onClick={() => setPage((value) => value + 1)}
            >
              下一页
            </Button>
          </div>
        ) : null}
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
            <Input.TextArea rows={3} placeholder="输入问题" />
          </Form.Item>
          <Form.Item
            name="answer"
            label="答案"
            rules={[{ required: true, whitespace: true, message: '请输入答案' }]}
          >
            <Input.TextArea rows={5} placeholder="输入答案" />
          </Form.Item>
        </Form>
      </Modal>
      {datasetModal}
    </div>
  );
}
