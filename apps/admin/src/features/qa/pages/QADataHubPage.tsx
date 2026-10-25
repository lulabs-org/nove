import { DislikeOutlined, FileTextOutlined, LikeOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from 'antd/es/button';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import message from 'antd/es/message';
import Modal from 'antd/es/modal';
import Popover from 'antd/es/popover';
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';
import type { TableProps } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { Perm } from '../../../app/guards/Perm';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import {
  qaApi,
  type CreateRecordInput,
  type CreateSessionInput,
  type QAFeedbackRating,
  type QARecord,
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

  const feedbackMutation = useMutation({
    mutationFn: ({ recordId, nextRating }: { recordId: string; nextRating: QAFeedbackRating }) =>
      qaApi.submitFeedback(recordId, nextRating),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qa-records'] }),
    onError: () => message.error('反馈提交失败'),
  });

  const submitRecord = (values: RecordFormValues) => {
    if (!selectedSessionId) return;
    const { citationSourceType, citationSourceId, citationTitle, citationSnippet, ...record } =
      values;
    const normalizedSourceId = citationSourceId?.trim();
    const normalizedSnippet = citationSnippet?.trim();
    const hasCitation = Boolean(normalizedSourceId && normalizedSnippet);

    createRecordMutation.mutate({
      sessionId: selectedSessionId,
      data: {
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
          : undefined,
      },
    });
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
                onClick={() => feedbackMutation.mutate({ recordId: record.id, nextRating: 'LIKE' })}
              />
              <Button
                danger={value === 'DISLIKE'}
                type={value === 'DISLIKE' ? 'primary' : 'text'}
                icon={<DislikeOutlined />}
                aria-label="不满意"
                onClick={() =>
                  feedbackMutation.mutate({ recordId: record.id, nextRating: 'DISLIKE' })
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
    ],
    [feedbackMutation]
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
            <Button icon={<PlusOutlined />} onClick={() => setSessionModalOpen(true)}>
              新建会话
            </Button>
          </Perm>
          <Perm permission={PERMISSIONS.QA.RECORD_CREATE}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!selectedSessionId}
              onClick={() => setRecordModalOpen(true)}
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
        scroll={{ x: 1050 }}
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
        title="新建问答会话"
        open={sessionModalOpen}
        confirmLoading={createSessionMutation.isPending}
        onCancel={() => setSessionModalOpen(false)}
        onOk={() => sessionForm.submit()}
      >
        <Form
          form={sessionForm}
          layout="vertical"
          initialValues={{ targetType: 'GLOBAL' }}
          onFinish={(values) => createSessionMutation.mutate(values)}
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
        title="录入问答记录"
        open={recordModalOpen}
        width={680}
        confirmLoading={createRecordMutation.isPending}
        onCancel={() => setRecordModalOpen(false)}
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
