import Button from 'antd/es/button';
import Input from 'antd/es/input';
import message from 'antd/es/message';
import Popconfirm from 'antd/es/popconfirm';
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import type { TableProps } from 'antd/es/table';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Perm } from '../../../app/guards/Perm';
import {
  useTableDeleteMutation,
  useTableQuery,
  type TableQueryParams,
} from '../../../shared/hooks/useTableQuery';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { formatDateTime, getMeetingPlatformText } from '../../meetings/utils/formatters';
import { minuteApi } from '../api/minuteApi';
import type { Minute, MinuteListParams } from '../model/types';
import './MinuteList.css';

const SOURCE_LABELS = {
  PLATFORM_AUTO: '平台自动',
  USER_MANUAL: '用户手动',
  THIRD_PARTY: '第三方',
} as const;

export function MinuteList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const meetingId = searchParams.get('meetingId') || undefined;
  const [filters, setFilters] = useState<TableQueryParams>({
    page: 1,
    pageSize: 10,
    search: '',
    source: undefined,
  });

  const { data, isLoading, refetch } = useTableQuery<Minute>({
    queryKey: 'minutes',
    queryFn: async (params) => {
      const { pageSize, ...rest } = params;
      const response = await minuteApi.list({
        ...rest,
        meetingId,
        limit: pageSize,
      } as MinuteListParams);
      return {
        data: response.data,
        total: response.total,
        page: response.page,
        pageSize: response.limit,
      };
    },
    params: { ...filters, meetingId },
  });

  const deleteMutation = useTableDeleteMutation({
    queryKey: 'minutes',
    mutationFn: minuteApi.delete,
    onSuccess: () => message.success('删除妙记成功'),
    onError: () => message.error('删除妙记失败'),
  });

  const updateFilter = (field: string, value: string | undefined) => {
    setFilters((current) => ({ ...current, [field]: value, page: 1 }));
  };

  const updateMeetingId = (value: string) => {
    const next = new URLSearchParams(searchParams);
    const normalized = value.trim();
    if (normalized) next.set('meetingId', normalized);
    else next.delete('meetingId');
    setSearchParams(next, { replace: true });
    setFilters((current) => ({ ...current, page: 1 }));
  };

  const columns: TableProps<Minute>['columns'] = [
    {
      title: '关联会议',
      key: 'meeting',
      fixed: 'left',
      width: 260,
      render: (_, record) => (
        <div className="minute-meeting-cell">
          <Button type="link" onClick={() => navigate(`/minutes/${record.id}`)}>
            {record.meeting?.title || '未关联会议'}
          </Button>
          <span>
            {record.meeting
              ? getMeetingPlatformText(record.meeting.platform)
              : record.meetingId || '-'}
          </span>
        </div>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (source: Minute['source']) => SOURCE_LABELS[source] || source,
    },
    {
      title: '外部录制 ID',
      dataIndex: 'externalId',
      key: 'externalId',
      width: 180,
      ellipsis: true,
      render: (value: string | null | undefined) => value || '-',
    },
    {
      title: '开始时间',
      dataIndex: 'startAt',
      key: 'startAt',
      width: 170,
      render: formatDateTime,
    },
    {
      title: '结束时间',
      dataIndex: 'endAt',
      key: 'endAt',
      width: 170,
      render: formatDateTime,
    },
    {
      title: '处理结果',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      width: 160,
      ellipsis: true,
      render: (error: string | null | undefined) =>
        error ? <Tag color="error">{error}</Tag> : <Tag>无错误</Tag>,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 170,
      render: formatDateTime,
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 130,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => navigate(`/minutes/${record.id}`)}>
            查看
          </Button>
          <Perm permission={PERMISSIONS.MINUTE.DELETE}>
            <Popconfirm
              title="确定删除这条妙记吗？"
              okText="确定"
              cancelText="取消"
              onConfirm={() => deleteMutation.mutate(record.id)}
            >
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          </Perm>
        </Space>
      ),
    },
  ];

  return (
    <div className="minute-list-page">
      <div className="minute-list-toolbar">
        <Input.Search
          allowClear
          placeholder="搜索会议标题或外部录制 ID"
          onSearch={(value) => updateFilter('search', value.trim() || undefined)}
          onChange={(event) => !event.target.value && updateFilter('search', undefined)}
        />
        <Select
          allowClear
          placeholder="选择来源"
          options={Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label }))}
          onChange={(value) => updateFilter('source', value)}
        />
        <Input.Search
          allowClear
          defaultValue={meetingId}
          key={meetingId || 'all-meetings'}
          placeholder="按内部会议 ID 筛选"
          onSearch={updateMeetingId}
          onChange={(event) => !event.target.value && updateMeetingId('')}
        />
        <Button onClick={() => void refetch()}>刷新</Button>
      </div>
      {meetingId ? (
        <div className="minute-list-filter-hint">
          当前仅显示会议 <code>{meetingId}</code> 的妙记
          <Button type="link" onClick={() => updateMeetingId('')}>
            清除筛选
          </Button>
        </div>
      ) : null}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.data || []}
        loading={isLoading}
        scroll={{ x: 1370 }}
        pagination={{
          current: filters.page,
          pageSize: filters.pageSize,
          total: data?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={(pagination) =>
          setFilters((current) => ({
            ...current,
            page: pagination.current,
            pageSize: pagination.pageSize,
          }))
        }
      />
    </div>
  );
}
