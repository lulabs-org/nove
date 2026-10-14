import { useCallback, useState } from 'react';
import Button from 'antd/es/button';
import DatePicker from 'antd/es/date-picker';
import Input from 'antd/es/input';
import message from 'antd/es/message';
import Popconfirm from 'antd/es/popconfirm';
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import type { TableProps } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Perm } from '../../../app/guards/Perm';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { trackingReportApi } from '../api/trackingReportApi';
import { TrackingReportDetail } from '../components/TrackingReportDetail';
import { ReportTargetSummary } from '../components/ReportSubject';
import {
  TRACKING_CADENCE_LABELS,
  TRACKING_REPORT_TYPE_LABELS,
  TRACKING_TARGET_TYPE_LABELS,
  TrackingCadence,
  TrackingReportType,
  TrackingTargetType,
} from '../model/types';
import type { TrackingReportListItem, TrackingReportListParams } from '../model/types';
import './TrackingReportList.css';

const { RangePicker } = DatePicker;

interface Filters {
  keyword?: string;
  targetType?: TrackingTargetType;
  trackingType?: TrackingReportType;
  cadence?: TrackingCadence;
  periodStart?: string;
  periodEnd?: string;
  page: number;
  limit: number;
}

const initialFilters: Filters = { page: 1, limit: 20 };

export function TrackingReportList() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [detailId, setDetailId] = useState<string | null>(null);
  const queryParams: TrackingReportListParams = filters;

  const { data, isLoading } = useQuery({
    queryKey: ['tracking-reports', queryParams],
    queryFn: () => trackingReportApi.list(queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: trackingReportApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['tracking-reports'], exact: false });
    },
    onError: () => message.error('删除失败'),
  });

  const setFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((previous) => ({ ...previous, [key]: value, page: 1 }));
  }, []);

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setFilters((previous) => ({
      ...previous,
      periodStart: dates?.[0]?.toISOString(),
      periodEnd: dates?.[1]?.add(1, 'day').startOf('day').toISOString(),
      page: 1,
    }));
  };

  const columns: TableProps<TrackingReportListItem>['columns'] = [
    {
      title: '追踪目标',
      key: 'target',
      width: 180,
      render: (_value, record) => <ReportTargetSummary target={record.target} />,
    },
    {
      title: '报告类型',
      dataIndex: 'trackingType',
      width: 120,
      render: (value: TrackingReportType) => TRACKING_REPORT_TYPE_LABELS[value] ?? value,
    },
    {
      title: '报告周期',
      key: 'period',
      width: 220,
      render: (_value, record) => (
        <div className="tracking-report-period">
          <span>
            {new Date(record.periodStart).toLocaleDateString('zh-CN')} –{' '}
            {new Date(new Date(record.periodEnd).getTime() - 1).toLocaleDateString('zh-CN')}
          </span>
          <span className="tracking-report-period__cadence">
            {TRACKING_CADENCE_LABELS[record.cadence]}
            {record.periodKey ? ` · ${record.periodKey}` : ''}
          </span>
        </div>
      ),
    },
    {
      title: '生成方式',
      dataIndex: 'generatedBy',
      width: 100,
      render: (value: TrackingReportListItem['generatedBy']) =>
        value ? <Tag color={value === 'AI' ? 'processing' : 'default'}>{value}</Tag> : '-',
    },
    {
      title: '来源',
      dataIndex: 'sourceCount',
      width: 80,
      render: (value: number) => `${value} 项`,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 140,
      render: (_value, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setDetailId(record.id)}>
            查看
          </Button>
          <Perm permission={PERMISSIONS.TRACKING_REPORT.DELETE}>
            <Popconfirm
              title="确定要删除此报告吗？"
              onConfirm={() => deleteMutation.mutate(record.id)}
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
    <div>
      <div className="tracking-report-list-toolbar">
        <Input.Search
          allowClear
          placeholder="搜索目标名称"
          style={{ width: 220 }}
          onSearch={(value) => setFilter('keyword', value.trim() || undefined)}
        />
        <Select
          placeholder="目标类型"
          allowClear
          style={{ width: 130 }}
          onChange={(value) => setFilter('targetType', value)}
          options={Object.values(TrackingTargetType).map((value) => ({
            value,
            label: TRACKING_TARGET_TYPE_LABELS[value],
          }))}
        />
        <Select
          placeholder="报告类型"
          allowClear
          style={{ width: 140 }}
          onChange={(value) => setFilter('trackingType', value)}
          options={Object.values(TrackingReportType).map((value) => ({
            value,
            label: TRACKING_REPORT_TYPE_LABELS[value],
          }))}
        />
        <Select
          placeholder="周期单位"
          allowClear
          style={{ width: 110 }}
          onChange={(value) => setFilter('cadence', value)}
          options={Object.values(TrackingCadence).map((value) => ({
            value,
            label: TRACKING_CADENCE_LABELS[value],
          }))}
        />
        <RangePicker
          placeholder={['周期开始', '周期结束']}
          onChange={(dates) => handleDateRangeChange(dates as [Dayjs | null, Dayjs | null] | null)}
        />
      </div>

      <div>
        <Table
          columns={columns}
          dataSource={data?.data ?? []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: filters.page,
            pageSize: filters.limit,
            total: data?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50'],
          }}
          scroll={{ x: 1010 }}
          onChange={(pagination) =>
            setFilters((previous) => ({
              ...previous,
              page: pagination.current ?? 1,
              limit: pagination.pageSize ?? 20,
            }))
          }
        />
      </div>

      <TrackingReportDetail id={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
