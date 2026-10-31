import {
  DeleteOutlined,
  DislikeOutlined,
  EditOutlined,
  FileTextOutlined,
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
import Popover from 'antd/es/popover';
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';
import type { TableProps } from 'antd/es/table';
import { useCallback, useMemo, useState } from 'react';
import { Perm } from '../../../app/guards/Perm';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import {
  qaApi,
  type CreateRecordInput,
  type CreateSessionInput,
  type QAFeedbackRating,
  type QARecord,
  type QASession,
  type UpdateRecordInput,
  type UpdateSessionInput,
} from '../api/qaApi';
import './QADataHubPage.css';

interface RecordFormValues extends CreateRecordInput {
  citationSourceType?: string;
  citationSourceId?: string;
  citationTitle?: string;
  citationSnippet?: string;
}

const targetTypeOptions = [
  { value: 'GLOBAL', label: '全局' },
  { value: 'PROJECT', label: '项目' },
  { value: 'MINUTE', label: '妙记' },
  { value: 'DRIVE_FILE', label: '云盘文件' },
];

export function QADataHubPage() {
  const queryClient = useQueryClient();
  const [sessionForm] = Form.useForm<CreateSessionInput>();
  const [recordForm] = Form.useForm<RecordFormValues>();
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string>();
  const [editingRecord, setEditingRecord] = useState<QARecord>();
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [keyword, setKeyword] = useState<string>();
  const [rating, setRating] = useState<QAFeedbackRating>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const sessionsQuery = useQuery({
    queryKey: ['qa-sessions'],
    queryFn: qaApi.listSessions,
  });

  const recordParams = { page, pageSize, keyword, rating, sessionId: selectedSessionId };
  const recordsQuery = useQuery({
    queryKey: ['qa-records', recordParams],
    queryFn: () => qaApi.listRecords(recordParams),
  });

  const selectedSession = sessionsQuery.data?.items.find(
    (session) => session.id === selectedSessionId
  );

  const createSessionMutation = useMutation({
    mutationFn: qaApi.createSession,
    onSuccess: (session) => {
      message.success('会话创建成功');
      setSessionModalOpen(false);
      sessionForm.resetFields();
      setSelectedSessionId(session.id);
      queryClient.invalidateQueries({ queryKey: ['qa-sessions'] });
    },
    onError: () => message.error('会话创建失败'),
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSessionInput }) =>
      qaApi.updateSession(id, data),
    onSuccess: () => {
      message.success('会话修改成功');
      closeSessionModal();
      queryClient.invalidateQueries({ queryKey: ['qa-sessions'] });
    },
    onError: () => message.error('会话修改失败'),
  });

  const deleteSessionMutation = useMutation({
    mutationFn: qaApi.deleteSession,
    onSuccess: (_, deletedId) => {
      message.success('会话已删除');
      if (selectedSessionId === deletedId) setSelectedSessionId(undefined);
      queryClient.invalidateQueries({ queryKey: ['qa-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['qa-records'] });
    },
    onError: () => message.error('会话删除失败'),
  });

  const createRecordMutation = useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: CreateRecordInput }) =>
      qaApi.createRecord(sessionId, data),
    onSuccess: () => {
      message.success('问答记录已保存');
      setRecordModalOpen(false);
      recordForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['qa-records'] });
    },
    onError: () => message.error('问答记录保存失败'),
  });

  const updateRecordMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecordInput }) =>
      qaApi.updateRecord(id, data),
    onSuccess: () => {
      message.success('问答记录修改成功');
      closeRecordModal();
      queryClient.invalidateQueries({ queryKey: ['qa-records'] });
    },
    onError: () => message.error('问答记录修改失败'),
  });

  const deleteRecordMutation = useMutation({
    mutationFn: qaApi.deleteRecord,
    onSuccess: () => {
      message.success('问答记录已删除');
      queryClient.invalidateQueries({ queryKey: ['qa-records'] });
    },
    onError: () => message.error('问答记录删除失败'),
  });

  const feedbackMutation = useMutation({
    mutationFn: ({
      recordId,
      nextRating,
    }: {
      recordId: string;
      nextRating: QAFeedbackRating | null;
    }) => qaApi.submitFeedback(recordId, nextRating),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qa-records'] }),
    onError: () => message.error('反馈提交失败'),
  });

  const closeSessionModal = () => {
    setSessionModalOpen(false);
    setEditingSessionId(undefined);
    sessionForm.resetFields();
  };

  const openCreateSession = () => {
    setEditingSessionId(undefined);
    sessionForm.setFieldsValue({ title: '', targetType: 'GLOBAL', targetId: undefined });
    setSessionModalOpen(true);
  };

  const openEditSession = (session: QASession) => {
    setEditingSessionId(session.id);
    sessionForm.setFieldsValue({
      title: session.title,
      targetType: session.targetType,
      targetId: session.targetId ?? undefined,
    });
    setSessionModalOpen(true);
  };

  const submitSession = (values: CreateSessionInput) => {
    if (editingSessionId) {
      updateSessionMutation.mutate({ id: editingSessionId, data: values });
      return;
    }
    createSessionMutation.mutate(values);
  };

  const closeRecordModal = () => {
    setRecordModalOpen(false);
    setEditingRecord(undefined);
    recordForm.resetFields();
  };

  const openCreateRecord = () => {
    setEditingRecord(undefined);
    recordForm.setFieldsValue({ generatedBy: 'HUMAN' });
    setRecordModalOpen(true);
  };

  const openEditRecord = useCallback(
    (record: QARecord) => {
      const citation = record.citations[0];
      setEditingRecord(record);
      recordForm.setFieldsValue({
        question: record.question,
        answer: record.answer,
        generatedBy: record.generatedBy,
        aiModel: record.aiModel ?? undefined,
        citationSourceType: citation?.sourceType,
        citationSourceId: citation?.sourceId,
        citationTitle: citation?.title ?? undefined,
        citationSnippet: citation?.snippet,
      });
      setRecordModalOpen(true);
    },
    [recordForm]
  );

  const submitRecord = (values: RecordFormValues) => {
    if (!selectedSessionId && !editingRecord) return;
    const { citationSourceType, citationSourceId, citationTitle, citationSnippet, ...record } =
      values;
    const normalizedSourceId = citationSourceId?.trim();
    const normalizedSnippet = citationSnippet?.trim();
    const hasCitation = Boolean(normalizedSourceId && normalizedSnippet);

    const data: CreateRecordInput = {
      ...record,
      citations: hasCitation
        ? [
            {
              sourceType: citationSourceType?.trim() || 'manual',
              sourceId: normalizedSourceId!,
              title: citationTitle?.trim() || undefined,
              snippet: normalizedSnippet!,
            },
          ]
        : editingRecord
          ? []
          : undefined,
    };

    if (editingRecord) {
      updateRecordMutation.mutate({ id: editingRecord.id, data });
      return;
    }
    createRecordMutation.mutate({ sessionId: selectedSessionId!, data });
  };

  const columns = useMemo<TableProps<QARecord>['columns']>(
    () => [
      {
        title: '问题',
        dataIndex: 'question',
        width: 230,
        ellipsis: true,
      },
      {
        title: '回答',
        dataIndex: 'answer',
        ellipsis: true,
      },
      {
        title: '会话',
        dataIndex: 'session',
        width: 160,
        ellipsis: true,
        render: (session: QARecord['session'], record) => session?.title ?? record.sessionId,
      },
      {
        title: '来源',
        dataIndex: 'citations',
        width: 100,
        render: (citations: QARecord['citations']) =>
          citations.length ? (
            <Popover
              title="引用内容"
              content={
                <div className="qa-citation-list">
                  {citations.map((citation) => (
                    <div key={citation.id}>
                      <strong>{citation.title || citation.sourceId}</strong>
                      <div>{citation.snippet}</div>
                    </div>
                  ))}
                </div>
              }
            >
              <Button type="link" size="small" icon={<FileTextOutlined />}>
                {citations.length} 条
              </Button>
            </Popover>
          ) : (
            '-'
          ),
      },
      {
        title: '生成方式',
        dataIndex: 'generatedBy',
        width: 120,
        render: (value: QARecord['generatedBy'], record) => (
          <Space size={4}>
            <Tag color={value === 'AI' ? 'processing' : 'default'}>{value}</Tag>
            {record.aiModel ? (
              <Typography.Text type="secondary">{record.aiModel}</Typography.Text>
            ) : null}
          </Space>
        ),
      },
      {
        title: '反馈',
        dataIndex: 'rating',
        width: 120,
        render: (value: QARecord['rating'], record) => (
          <Perm permission={PERMISSIONS.QA.FEEDBACK_CREATE} fallback={value || '-'}>
            <Space size={0}>
              <Button
                type={value === 'LIKE' ? 'primary' : 'text'}
                icon={<LikeOutlined />}
                aria-label="满意"
                onClick={() =>
                  feedbackMutation.mutate({
                    recordId: record.id,
                    nextRating: value === 'LIKE' ? null : 'LIKE',
                  })
                }
              />
              <Button
                danger={value === 'DISLIKE'}
                type={value === 'DISLIKE' ? 'primary' : 'text'}
                icon={<DislikeOutlined />}
                aria-label="不满意"
                onClick={() =>
                  feedbackMutation.mutate({
                    recordId: record.id,
                    nextRating: value === 'DISLIKE' ? null : 'DISLIKE',
                  })
                }
              />
            </Space>
          </Perm>
        ),
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        width: 180,
        render: (value: string) => new Date(value).toLocaleString('zh-CN'),
      },
      {
        title: '操作',
        key: 'actions',
        width: 110,
        fixed: 'right',
        render: (_, record) => (
          <Space size={0}>
            <Perm permission={PERMISSIONS.QA.RECORD_UPDATE}>
              <Button
                type="text"
                icon={<EditOutlined />}
                aria-label="编辑问答记录"
                onClick={() => openEditRecord(record)}
              />
            </Perm>
            <Perm permission={PERMISSIONS.QA.RECORD_DELETE}>
              <Popconfirm
                title="确定删除这条问答记录吗？"
                onConfirm={() => deleteRecordMutation.mutate(record.id)}
              >
                <Button danger type="text" icon={<DeleteOutlined />} aria-label="删除问答记录" />
              </Popconfirm>
            </Perm>
          </Space>
        ),
      },
    ],
    [deleteRecordMutation, feedbackMutation, openEditRecord]
  );

  return (
    <div className="qa-data-hub-page">
      <div className="qa-data-hub-toolbar">
        <Input.Search
          className="qa-data-hub-search"
          allowClear
          placeholder="搜索问题或回答"
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
        <div className="qa-session-controls">
          <Typography.Text>会话</Typography.Text>
          <Select
            allowClear
            placeholder="选择会话"
            loading={sessionsQuery.isLoading}
            value={selectedSessionId}
            onChange={(value) => {
              setSelectedSessionId(value);
              setPage(1);
            }}
            options={sessionsQuery.data?.items.map((session) => ({
              value: session.id,
              label: session.title,
            }))}
          />
          <Perm permission={PERMISSIONS.QA.SESSION_UPDATE}>
            <Button
              type="text"
              icon={<EditOutlined />}
              disabled={!selectedSession}
              aria-label="编辑会话"
              onClick={() => selectedSession && openEditSession(selectedSession)}
            />
          </Perm>
          <Perm permission={PERMISSIONS.QA.SESSION_DELETE}>
            <Popconfirm
              title="确定删除这个会话及其问答记录吗？"
              disabled={!selectedSession}
              onConfirm={() => selectedSession && deleteSessionMutation.mutate(selectedSession.id)}
            >
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                disabled={!selectedSession}
                aria-label="删除会话"
              />
            </Popconfirm>
          </Perm>
        </div>
        <Select
          allowClear
          placeholder="反馈状态"
          value={rating}
          onChange={(value) => {
            setRating(value);
            setPage(1);
          }}
          options={[
            { value: 'LIKE', label: '满意' },
            { value: 'DISLIKE', label: '不满意' },
          ]}
        />
        <div className="qa-data-hub-actions">
          <Perm permission={PERMISSIONS.QA.SESSION_CREATE}>
            <Button icon={<PlusOutlined />} onClick={openCreateSession}>
              新建会话
            </Button>
          </Perm>
          <Perm permission={PERMISSIONS.QA.RECORD_CREATE}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!selectedSessionId}
              onClick={openCreateRecord}
            >
              录入问答
            </Button>
          </Perm>
        </div>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={recordsQuery.data?.items ?? []}
        loading={recordsQuery.isLoading}
        scroll={{ x: 1210 }}
        pagination={{
          current: page,
          pageSize,
          total: recordsQuery.data?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={(pagination) => {
          setPage(pagination.current ?? 1);
          setPageSize(pagination.pageSize ?? 20);
        }}
      />

      <Modal
        title={editingSessionId ? '编辑问答会话' : '新建问答会话'}
        open={sessionModalOpen}
        confirmLoading={createSessionMutation.isPending || updateSessionMutation.isPending}
        onCancel={closeSessionModal}
        onOk={() => sessionForm.submit()}
      >
        <Form
          form={sessionForm}
          layout="vertical"
          initialValues={{ targetType: 'GLOBAL' }}
          onFinish={submitSession}
        >
          <Form.Item name="title" label="会话标题" rules={[{ required: true }]}>
            <Input placeholder="例如：产品会议问答" maxLength={200} />
          </Form.Item>
          <Form.Item name="targetType" label="关联类型">
            <Select options={targetTypeOptions} />
          </Form.Item>
          <Form.Item name="targetId" label="关联对象 ID">
            <Input placeholder="全局会话可不填写" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingRecord ? '编辑问答记录' : '录入问答记录'}
        open={recordModalOpen}
        width={680}
        confirmLoading={createRecordMutation.isPending || updateRecordMutation.isPending}
        onCancel={closeRecordModal}
        onOk={() => recordForm.submit()}
      >
        <Form
          form={recordForm}
          layout="vertical"
          initialValues={{ generatedBy: 'HUMAN' }}
          onFinish={submitRecord}
        >
          <Form.Item name="question" label="问题" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="answer" label="回答" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Space className="qa-record-meta" align="start">
            <Form.Item name="generatedBy" label="生成方式">
              <Select
                options={[
                  { value: 'HUMAN', label: '人工' },
                  { value: 'AI', label: 'AI' },
                  { value: 'SYSTEM', label: '系统' },
                ]}
              />
            </Form.Item>
            <Form.Item name="aiModel" label="AI 模型">
              <Input placeholder="例如 gpt-4o" />
            </Form.Item>
          </Space>
          <Typography.Title level={5}>引用（可选）</Typography.Title>
          <Space className="qa-record-meta" align="start">
            <Form.Item name="citationSourceType" label="来源类型">
              <Input placeholder="例如 transcript" />
            </Form.Item>
            <Form.Item name="citationSourceId" label="来源 ID">
              <Input />
            </Form.Item>
          </Space>
          <Form.Item name="citationTitle" label="来源标题">
            <Input />
          </Form.Item>
          <Form.Item name="citationSnippet" label="引用片段">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
