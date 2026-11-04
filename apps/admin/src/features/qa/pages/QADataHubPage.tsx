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
  type QATargetOption,
  type QATargetType,
  type UpdateRecordInput,
  type UpdateSessionInput,
} from '../api/qaApi';
import './QADataHubPage.css';

interface RecordFormValues extends CreateRecordInput {
  sessionId: string;
  citationSourceType?: Exclude<QATargetType, 'GLOBAL'>;
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

const targetLabels: Record<QATargetType, string> = {
  GLOBAL: '全局',
  PROJECT: '项目',
  MINUTE: '妙记',
  DRIVE_FILE: '云盘文件',
};

function toSelectOptions(items?: QATargetOption[]) {
  return items?.map((item) => ({
    value: item.id,
    label: item.description ? `${item.label}（${item.description}）` : item.label,
  }));
}

function normalizeCitationType(sourceType?: string) {
  const value = sourceType?.toUpperCase();
  if (value === 'TRANSCRIPT') return 'MINUTE';
  if (value === 'PROJECT' || value === 'MINUTE' || value === 'DRIVE_FILE') return value;
  return undefined;
}

export function QADataHubPage() {
  const queryClient = useQueryClient();
  const [sessionForm] = Form.useForm<CreateSessionInput>();
  const [recordForm] = Form.useForm<RecordFormValues>();
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [creatingSessionForRecord, setCreatingSessionForRecord] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string>();
  const [editingRecord, setEditingRecord] = useState<QARecord>();
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [keyword, setKeyword] = useState<string>();
  const [rating, setRating] = useState<QAFeedbackRating>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const sessionTargetType = Form.useWatch('targetType', sessionForm) ?? 'GLOBAL';
  const recordSessionId = Form.useWatch('sessionId', recordForm);
  const generatedBy = Form.useWatch('generatedBy', recordForm) ?? 'HUMAN';
  const citationSourceType = Form.useWatch('citationSourceType', recordForm);

  const sessionsQuery = useQuery({
    queryKey: ['qa-sessions'],
    queryFn: qaApi.listSessions,
  });

  const recordParams = { page, pageSize, keyword, rating, sessionId: selectedSessionId };
  const recordsQuery = useQuery({
    queryKey: ['qa-records', recordParams],
    queryFn: () => qaApi.listRecords(recordParams),
  });

  const sessionTargetOptionsQuery = useQuery({
    queryKey: ['qa-target-options', sessionTargetType],
    queryFn: () => qaApi.listTargetOptions(sessionTargetType),
    enabled: sessionModalOpen && sessionTargetType !== 'GLOBAL',
  });

  const citationOptionsQuery = useQuery({
    queryKey: ['qa-target-options', citationSourceType],
    queryFn: () => qaApi.listTargetOptions(citationSourceType!),
    enabled: recordModalOpen && Boolean(citationSourceType),
  });

  const selectedSession = sessionsQuery.data?.items.find(
    (session) => session.id === selectedSessionId
  );
  const recordSession = sessionsQuery.data?.items.find((session) => session.id === recordSessionId);

  const createSessionMutation = useMutation({
    mutationFn: qaApi.createSession,
    onSuccess: (session) => {
      message.success('会话创建成功');
      setSessionModalOpen(false);
      sessionForm.resetFields();
      if (creatingSessionForRecord) {
        recordForm.setFieldValue('sessionId', session.id);
        setCreatingSessionForRecord(false);
      } else {
        setSelectedSessionId(session.id);
      }
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
      if (recordForm.getFieldValue('sessionId') === deletedId) {
        recordForm.setFieldValue('sessionId', undefined);
      }
      if (editingRecord?.sessionId === deletedId) {
        setRecordModalOpen(false);
        setEditingRecord(undefined);
        recordForm.resetFields();
      }
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
    setCreatingSessionForRecord(false);
    sessionForm.resetFields();
  };

  const openCreateSession = (forRecord = false) => {
    setEditingSessionId(undefined);
    setCreatingSessionForRecord(forRecord);
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
    const citationType =
      selectedSession?.targetType && selectedSession.targetType !== 'GLOBAL'
        ? selectedSession.targetType
        : undefined;
    recordForm.setFieldsValue({
      sessionId: selectedSessionId,
      generatedBy: 'HUMAN',
      citationSourceType: citationType,
      citationSourceId: citationType ? (selectedSession?.targetId ?? undefined) : undefined,
    });
    setRecordModalOpen(true);
  };

  const openEditRecord = useCallback(
    (record: QARecord) => {
      const citation = record.citations[0];
      const citationType = normalizeCitationType(citation?.sourceType);
      setEditingRecord(record);
      recordForm.setFieldsValue({
        sessionId: record.sessionId,
        question: record.question,
        answer: record.answer,
        generatedBy: record.generatedBy,
        aiModel: record.aiModel ?? undefined,
        citationSourceType: citationType,
        citationSourceId: citationType ? citation?.sourceId : undefined,
        citationTitle: citationType ? (citation?.title ?? undefined) : undefined,
        citationSnippet: citationType ? citation?.snippet : undefined,
      });
      setRecordModalOpen(true);
    },
    [recordForm]
  );

  const submitRecord = (values: RecordFormValues) => {
    const {
      sessionId,
      citationSourceType,
      citationSourceId,
      citationTitle,
      citationSnippet,
      ...record
    } = values;
    const normalizedSourceId = citationSourceId?.trim();
    const normalizedSnippet = citationSnippet?.trim();
    const hasCitation = Boolean(citationSourceType && normalizedSourceId && normalizedSnippet);
    const selectedCitationSource = citationOptionsQuery.data?.find(
      (item) => item.id === normalizedSourceId
    );

    const data: CreateRecordInput = {
      ...record,
      aiModel: record.generatedBy === 'AI' ? record.aiModel?.trim() || undefined : undefined,
      citations: hasCitation
        ? [
            {
              sourceType: citationSourceType!,
              sourceId: normalizedSourceId!,
              title: citationTitle?.trim() || selectedCitationSource?.label,
              snippet: normalizedSnippet!,
            },
          ]
        : editingRecord
          ? []
          : undefined,
    };

    if (editingRecord) {
      updateRecordMutation.mutate({ id: editingRecord.id, data: { ...data, sessionId } });
      return;
    }
    createRecordMutation.mutate({ sessionId, data });
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
          <Typography.Text>会话筛选</Typography.Text>
          <Select
            allowClear
            placeholder="全部会话"
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
          <Perm permission={PERMISSIONS.QA.RECORD_CREATE}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateRecord}>
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
            <Select
              options={targetTypeOptions}
              onChange={() => sessionForm.setFieldValue('targetId', undefined)}
            />
          </Form.Item>
          {sessionTargetType !== 'GLOBAL' ? (
            <Form.Item
              name="targetId"
              label={`关联${targetLabels[sessionTargetType]}`}
              rules={[{ required: true, message: `请选择${targetLabels[sessionTargetType]}` }]}
              extra="系统仍保存对象 ID，但你可以直接按名称选择。"
            >
              <Select
                showSearch
                optionFilterProp="label"
                loading={sessionTargetOptionsQuery.isLoading}
                placeholder={`请选择${targetLabels[sessionTargetType]}`}
                options={toSelectOptions(sessionTargetOptionsQuery.data)}
              />
            </Form.Item>
          ) : null}
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
          <Form.Item
            name="sessionId"
            label={
              <Space size={4}>
                <span>所属会话</span>
                <Perm permission={PERMISSIONS.QA.SESSION_CREATE}>
                  <Button type="link" size="small" onClick={() => openCreateSession(true)}>
                    新建会话
                  </Button>
                </Perm>
                <Perm permission={PERMISSIONS.QA.SESSION_UPDATE}>
                  <Button
                    type="link"
                    size="small"
                    disabled={!recordSession}
                    onClick={() => recordSession && openEditSession(recordSession)}
                  >
                    编辑会话
                  </Button>
                </Perm>
                <Perm permission={PERMISSIONS.QA.SESSION_DELETE}>
                  <Popconfirm
                    title="确定删除这个会话及其全部问答记录吗？"
                    disabled={!recordSession}
                    onConfirm={() =>
                      recordSession && deleteSessionMutation.mutate(recordSession.id)
                    }
                  >
                    <Button danger type="link" size="small" disabled={!recordSession}>
                      删除会话
                    </Button>
                  </Popconfirm>
                </Perm>
              </Space>
            }
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择保存到哪个会话"
              options={sessionsQuery.data?.items.map((session) => ({
                value: session.id,
                label: session.title,
              }))}
            />
          </Form.Item>
          <Space className="qa-record-meta" align="start">
            <Form.Item name="generatedBy" label="生成方式">
              <Select
                onChange={(value) => {
                  if (value !== 'AI') recordForm.setFieldValue('aiModel', undefined);
                }}
                options={[
                  { value: 'HUMAN', label: '人工' },
                  { value: 'AI', label: 'AI' },
                  { value: 'SYSTEM', label: '系统' },
                ]}
              />
            </Form.Item>
            {generatedBy === 'AI' ? (
              <Form.Item name="aiModel" label="AI 模型">
                <Input placeholder="例如 gpt-4o" />
              </Form.Item>
            ) : null}
          </Space>
          <Typography.Title level={5}>答案依据（可选）</Typography.Title>
          <Typography.Paragraph type="secondary">
            选择答案来自哪个业务对象，并填写真正支持这个答案的原文片段。
          </Typography.Paragraph>
          <Space className="qa-record-meta" align="start">
            <Form.Item name="citationSourceType" label="来源类型">
              <Select
                allowClear
                placeholder="选择来源类型"
                options={targetTypeOptions.filter((option) => option.value !== 'GLOBAL')}
                onChange={() => {
                  recordForm.setFieldValue('citationSourceId', undefined);
                  recordForm.setFieldValue('citationTitle', undefined);
                }}
              />
            </Form.Item>
            {citationSourceType ? (
              <Form.Item
                name="citationSourceId"
                label="来源对象"
                rules={[{ required: true, message: '请选择来源对象' }]}
              >
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  loading={citationOptionsQuery.isLoading}
                  placeholder={`选择${targetLabels[citationSourceType]}`}
                  options={toSelectOptions(citationOptionsQuery.data)}
                  onChange={(value) => {
                    const option = citationOptionsQuery.data?.find((item) => item.id === value);
                    recordForm.setFieldValue('citationTitle', option?.label);
                  }}
                />
              </Form.Item>
            ) : null}
          </Space>
          {citationSourceType ? (
            <>
              <Form.Item name="citationTitle" label="来源标题">
                <Input placeholder="选择来源对象后自动填写，也可以修改" />
              </Form.Item>
              <Form.Item
                name="citationSnippet"
                label="依据原文"
                rules={[{ required: true, message: '请填写支持答案的原文片段' }]}
                extra="例如会议原话、项目说明或文档原文，用来说明答案从哪里得出。"
              >
                <Input.TextArea rows={3} />
              </Form.Item>
            </>
          ) : null}
        </Form>
      </Modal>
    </div>
  );
}
