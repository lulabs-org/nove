import Button from 'antd/es/button';
import Space from 'antd/es/space';
import Table from 'antd/es/table';
import message from 'antd/es/message';
import Popconfirm from 'antd/es/popconfirm';
import Input from 'antd/es/input';
import Select from 'antd/es/select';
import DatePicker from 'antd/es/date-picker';
import Tag from 'antd/es/tag';
import type { TableProps } from 'antd/es/table';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useTableQuery,
  useTableDeleteMutation,
  useTableMutation,
  type TableQueryParams,
} from '../../../shared/hooks/useTableQuery';
import { meetingApi } from '../api/meetingApi';
import type { Meeting, MeetingListItem, MeetingListParams } from '../model/types';
import { MeetingControllerGetMeetingRecordsPlatform } from '../../../shared/lib/api/orval/business/schemas';
import { formatDateTime, getMeetingPlatformText } from '../utils/formatters';
import { MeetingFormModal } from '../components/MeetingFormModal';
import type { CreateMeetingDto, UpdateMeetingDto } from '../model/types';
import { Perm } from '../../../app/guards/Perm';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import './MeetingList.css';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

export function MeetingList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TableQueryParams>({
    page: 1,
    pageSize: 10,
    search: '',
    platform: undefined,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);

  const {
    data: meetingList,
    isLoading,
    refetch,
  } = useTableQuery<MeetingListItem>({
    queryKey: 'meetings',
    queryFn: async (params) => {
      const { pageSize, ...restParams } = params;
      const response = await meetingApi.list({
        ...restParams,
        limit: pageSize,
      } as unknown as MeetingListParams);
      return {
        data: response.data,
        total: response.total,
        page: response.page,
        pageSize: response.limit,
      };
    },
    params: filters,
  });

  const deleteMutation = useTableDeleteMutation({
    queryKey: 'meetings',
    mutationFn: meetingApi.delete,
    onSuccess: () => {
      message.success('删除会议成功');
    },
    onError: () => {
      message.error('删除会议失败');
    },
  });

  const createMutation = useTableMutation({
    queryKey: 'meetings',
    mutationFn: (data: CreateMeetingDto) => meetingApi.create(data),
    onSuccess: () => {
      message.success('新增会议成功');
      setFormOpen(false);
    },
    onError: () => message.error('新增会议失败'),
  });

  const updateMutation = useTableMutation({
    queryKey: 'meetings',
    mutationFn: ({ id, data }: { id: string; data: UpdateMeetingDto }) =>
      meetingApi.update(id, data),
    onSuccess: () => {
      message.success('编辑会议成功');
      setEditingMeeting(null);
      setFormOpen(false);
    },
    onError: () => message.error('编辑会议失败'),
  });

  const handleCreate = () => {
    setEditingMeeting(null);
    setFormOpen(true);
  };

  const handleViewMinutes = (record: MeetingListItem) => {
    navigate(`/minutes?meetingId=${encodeURIComponent(record.id)}`);
  };

  const handleEdit = async (record: MeetingListItem) => {
    setEditingMeetingId(record.id);
    try {
      const meeting = await meetingApi.getById(record.id);
      setEditingMeeting(meeting);
      setFormOpen(true);
    } catch {
      message.error('获取会议详情失败');
    } finally {
      setEditingMeetingId(null);
    }
  };

  const handleDelete = (record: MeetingListItem) => {
    deleteMutation.mutate(record.id);
  };

  const handleSearch = (field: string, value: string) => {
    setFilters((prev: TableQueryParams) => ({
      ...prev,
      [field]: value,
      page: 1,
    }));
  };

  const handleDateRangeChange = (dates: null | [unknown, unknown]) => {
    if (dates && dates[0] && dates[1]) {
      setFilters((prev: TableQueryParams) => ({
        ...prev,
        startDate: (dates[0] as { format: (format: string) => string }).format('YYYY-MM-DD'),
        endDate: (dates[1] as { format: (format: string) => string }).format('YYYY-MM-DD'),
        page: 1,
      }));
    } else {
      setFilters((prev: TableQueryParams) => ({
        ...prev,
        startDate: undefined,
        endDate: undefined,
        page: 1,
      }));
    }
  };

  const handleTableChange: TableProps<MeetingListItem>['onChange'] = (
    pagination,
    _filters,
    sorter
  ) => {
    setFilters((prev: TableQueryParams) => ({
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

  const columns = [
    {
      title: '会议标题',
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      width: 240,
      fixed: 'left' as const,
      render: (title: string, record: MeetingListItem) => (
        <Button
          type="link"
          className="meeting-title-link"
          onClick={() => handleViewMinutes(record)}
        >
          {title}
        </Button>
      ),
    },
    {
      title: '会议平台',
      dataIndex: 'platform',
      key: 'platform',
      filters: [
        { text: '腾讯会议', value: 'TENCENT_MEETING' },
        { text: 'Zoom', value: 'ZOOM' },
        { text: 'Teams', value: 'TEAMS' },
        { text: '钉钉', value: 'DINGTALK' },
        { text: '飞书', value: 'FEISHU' },
        { text: 'Webex', value: 'WEBEX' },
        { text: 'Voov', value: 'VOOV' },
        { text: '其他', value: 'OTHER' },
      ],
      render: (platform: MeetingControllerGetMeetingRecordsPlatform) =>
        getMeetingPlatformText(platform),
      width: 130,
    },
    {
      title: '开始时间',
      dataIndex: 'startAt',
      key: 'startAt',
      sorter: true,
      render: (time: unknown) => formatDateTime(time),
      width: 170,
    },
    {
      title: '结束时间',
      dataIndex: 'endAt',
      key: 'endAt',
      sorter: true,
      render: (time: unknown) => formatDateTime(time),
      width: 170,
    },
    {
      title: '主持人',
      key: 'host',
      render: (_: unknown, record: MeetingListItem) =>
        record.host?.displayName || record.host?.platformUserId || '-',
      width: 160,
      ellipsis: true,
    },
    {
      title: '参与人数',
      dataIndex: 'participantCount',
      key: 'participantCount',
      render: (count: number | null | undefined) => `${count ?? 0} 人`,
      width: 110,
    },
    {
      title: '是否有录制',
      dataIndex: 'hasRecording',
      key: 'hasRecording',
      render: (hasRecording: boolean) => (
        <Tag color={hasRecording ? 'success' : 'default'}>{hasRecording ? '有妙记' : '无妙记'}</Tag>
      ),
      width: 110,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 180,
      render: (_: unknown, record: MeetingListItem) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewMinutes(record)}>
            查看妙记
          </Button>
          <Perm permission={PERMISSIONS.MEETING.UPDATE}>
            <Button
              type="link"
              size="small"
              loading={editingMeetingId === record.id}
              onClick={() => void handleEdit(record)}
            >
              编辑
            </Button>
          </Perm>
          <Perm permission={PERMISSIONS.MEETING.DELETE}>
            <Popconfirm
              title="确定要删除吗？"
              onConfirm={() => handleDelete(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger loading={deleteMutation.isPending}>
                删除
              </Button>
            </Popconfirm>
          </Perm>
        </Space>
      ),
    },
  ];

  return (
    <div className="meeting-list-page">
      <div className="meeting-list-toolbar">
        <Search
          placeholder="搜索会议标题"
          allowClear
          style={{ width: 200 }}
          onSearch={(value) => handleSearch('search', value)}
          onChange={(e) => !e.target.value && handleSearch('search', '')}
        />

        <Select
          placeholder="选择会议平台"
          allowClear
          style={{ width: 120 }}
          onChange={(value) => handleSearch('platform', value)}
        >
          <Option value="TENCENT_MEETING">腾讯会议</Option>
          <Option value="ZOOM">Zoom</Option>
          <Option value="TEAMS">Teams</Option>
          <Option value="DINGTALK">钉钉</Option>
          <Option value="FEISHU">飞书</Option>
          <Option value="WEBEX">Webex</Option>
          <Option value="VOOV">Voov</Option>
          <Option value="OTHER">其他</Option>
        </Select>

        <RangePicker placeholder={['开始日期', '结束日期']} onChange={handleDateRangeChange} />

        <Button onClick={() => refetch()}>刷新</Button>

        <Perm permission={PERMISSIONS.MEETING.CREATE}>
          <Button className="meeting-create-button" type="primary" onClick={handleCreate}>
            新增会议
          </Button>
        </Perm>
      </div>

      <div className="meeting-list-table-card">
        <Table
          columns={columns}
          dataSource={meetingList?.data || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: filters.page,
            pageSize: filters.pageSize,
            total: meetingList?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 1270 }}
          onChange={handleTableChange}
        />
      </div>

      <MeetingFormModal
        open={formOpen}
        meeting={editingMeeting}
        submitting={createMutation.isPending || updateMutation.isPending}
        onCancel={() => {
          setFormOpen(false);
          setEditingMeeting(null);
        }}
        onSubmit={(data) => {
          if (editingMeeting)
            updateMutation.mutate({ id: editingMeeting.id, data: data as UpdateMeetingDto });
          else createMutation.mutate(data as CreateMeetingDto);
        }}
      />
    </div>
  );
}
