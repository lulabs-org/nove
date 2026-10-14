import React, { useState } from 'react';
import {
  Table,
  Card,
  Tag,
  DatePicker,
  Select,
  Space,
  Button,
  Popconfirm,
  message,
  notification,
  Alert,
} from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd/es/table';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { recordApi } from './api/recordApi';
import { ruleApi } from '../rules/api/ruleApi';
import dayjs from 'dayjs';
import {
  useTableQuery,
  useTableMutation,
  type TableQueryParams,
} from '../../../shared/hooks/useTableQuery';
import type { ProfitSharingRecord } from './types';

const { RangePicker } = DatePicker;

export const RecordList: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TableQueryParams>({
    page: 1,
    pageSize: 10,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { data: rulesData } = useQuery({
    queryKey: ['profit-sharing-rules'],
    queryFn: () => ruleApi.list(),
  });

  const { data: recordsData, isLoading } = useTableQuery<ProfitSharingRecord>({
    queryKey: 'profit-sharing-records',
    queryFn: recordApi.list,
    params: filters,
  });

  const settleMutation = useTableMutation({
    queryKey: 'profit-sharing-records',
    mutationFn: recordApi.settle,
    onSuccess: () => {
      message.success('结算成功');
      queryClient.invalidateQueries({ queryKey: ['profit-dashboard-stats'] });
    },
    onError: (error: unknown) => {
      const apiErr = error as { response?: { data?: { message?: string } } };
      message.error(apiErr?.response?.data?.message || '结算失败');
    },
  });

  const cancelMutation = useTableMutation({
    queryKey: 'profit-sharing-records',
    mutationFn: recordApi.cancel,
    onSuccess: () => {
      message.success('取消成功');
      queryClient.invalidateQueries({ queryKey: ['profit-dashboard-stats'] });
    },
    onError: (error: unknown) => {
      const apiErr = error as { response?: { data?: { message?: string } } };
      message.error(apiErr?.response?.data?.message || '取消失败');
    },
  });

  const undoSettleMutation = useTableMutation({
    queryKey: 'profit-sharing-records',
    mutationFn: recordApi.undoSettle,
    onSuccess: () => {
      message.success('撤销结算成功');
      queryClient.invalidateQueries({ queryKey: ['profit-dashboard-stats'] });
    },
    onError: (error: unknown) => {
      const apiErr = error as { response?: { data?: { message?: string } } };
      message.error(apiErr?.response?.data?.message || '撤销结算失败');
    },
  });

  const restoreMutation = useTableMutation({
    queryKey: 'profit-sharing-records',
    mutationFn: recordApi.restore,
    onSuccess: () => {
      message.success('恢复成功');
      queryClient.invalidateQueries({ queryKey: ['profit-dashboard-stats'] });
    },
    onError: (error: unknown) => {
      const apiErr = error as { response?: { data?: { message?: string } } };
      message.error(apiErr?.response?.data?.message || '恢复失败');
    },
  });

  const deleteMutation = useTableMutation({
    queryKey: 'profit-sharing-records',
    mutationFn: recordApi.delete,
    onSuccess: () => {
      message.success('分润流水删除成功');
      setSelectedRowKeys((prev) => prev.filter((k) => !selectedRowKeys.includes(k)));
      queryClient.invalidateQueries({ queryKey: ['profit-dashboard-stats'] });
    },
    onError: (error: unknown) => {
      const apiErr = error as { response?: { data?: { message?: string } } };
      message.error(apiErr?.response?.data?.message || '删除流水失败');
    },
  });

  const batchDeleteMutation = useTableMutation({
    queryKey: 'profit-sharing-records',
    mutationFn: recordApi.batchDelete,
    onSuccess: (res) => {
      message.success(`成功批量删除 ${res?.count ?? selectedRowKeys.length} 笔分润流水`);
      setSelectedRowKeys([]);
      queryClient.invalidateQueries({ queryKey: ['profit-dashboard-stats'] });
    },
    onError: (error: unknown) => {
      const apiErr = error as { response?: { data?: { message?: string } } };
      message.error(apiErr?.response?.data?.message || '批量删除失败');
    },
  });

  const [isReconciling, setIsReconciling] = useState(false);

  const handleReconcile = async () => {
    setIsReconciling(true);
    try {
      const res = await recordApi.reconcileRefunds();
      if (res.compensatedOrders > 0) {
        notification.success({
          message: '退款对账与补偿完成',
          description: `全库共扫描 ${res.scannedRefunds} 笔已结算退款，成功补偿 ${res.compensatedOrders} 笔漏扣流水，总计扣减 ¥${res.totalCompensatedAmount.toFixed(2)}。`,
          duration: 6,
        });
      } else {
        message.success(
          `退款对账完成：全库共扫描 ${res.scannedRefunds} 笔已结算退款，数据全部一致，无遗漏扣款。`
        );
      }
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-records'] });
      queryClient.invalidateQueries({ queryKey: ['profit-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-payslips'] });
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      message.error(apiErr?.response?.data?.message || '退款对账失败');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleTableChange: TableProps<ProfitSharingRecord>['onChange'] = (pagination) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
    }));
  };

  const handleStatusChange = (status: string | undefined) => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  };

  const handleRuleChange = (ruleId: string | undefined) => {
    setFilters((prev) => {
      const next = { ...prev, page: 1 } as Record<string, unknown>;
      if (ruleId) {
        next['ruleId'] = ruleId;
      } else {
        delete next['ruleId'];
      }
      return next as TableQueryParams;
    });
  };

  const handleDateRangeChange = (dates: unknown, dateStrings: [string, string]) => {
    if (dates) {
      setFilters((prev) => ({
        ...prev,
        startDate: dateStrings[0],
        endDate: dateStrings[1],
        page: 1,
      }));
    } else {
      setFilters((prev) => {
        const next = { ...prev, page: 1 } as Record<string, unknown>;
        delete next['startDate'];
        delete next['endDate'];
        return next as TableQueryParams;
      });
    }
  };

  const columns: TableProps<ProfitSharingRecord>['columns'] = [
    {
      title: '流水号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text: string) => (
        <span className="text-gray-500 font-mono text-xs" style={{ whiteSpace: 'nowrap' }}>
          {text.slice(0, 8)}...
        </span>
      ),
    },
    {
      title: '所属规则 / 周期',
      key: 'rulePeriod',
      width: 170,
      render: (_, record) => {
        const rule = record.rule;
        const snapshot = record.ruleSnapshot as
          | { name?: string; validStartTime?: string; validEndTime?: string }
          | undefined;
        const ruleName = rule?.name || snapshot?.name || '-';
        const start = rule?.validStartTime || snapshot?.validStartTime;
        const end = rule?.validEndTime || snapshot?.validEndTime;

        let periodTag = null;
        if (record.periodMonth) {
          periodTag = (
            <Tag color="purple" style={{ margin: 0 }}>
              {record.periodMonth} 固定
            </Tag>
          );
        } else if (start && end) {
          const dStart = dayjs(start);
          const dEnd = dayjs(end);
          if (dEnd.year() >= 2090) {
            periodTag = (
              <Tag color="purple" style={{ margin: 0 }}>
                长期有效
              </Tag>
            );
          } else if (dStart.format('YYYY-MM') === dEnd.format('YYYY-MM')) {
            periodTag = (
              <Tag color="cyan" style={{ margin: 0 }}>
                {dStart.format('YYYY年MM月')}
              </Tag>
            );
          } else {
            periodTag = (
              <span className="text-xs text-gray-500" style={{ whiteSpace: 'nowrap' }}>
                {dStart.format('YYYY-MM-DD')} ~ {dEnd.format('MM-DD')}
              </span>
            );
          }
        }

        return (
          <div>
            <div
              className="font-medium text-gray-800"
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 160,
              }}
            >
              {ruleName}
            </div>
            <div className="mt-0.5">{periodTag}</div>
          </div>
        );
      },
    },
    {
      title: '订单号',
      key: 'orderNumber',
      width: 150,
      render: (_, record) => {
        if (record.order?.orderNumber) {
          return (
            <span className="font-mono text-xs text-gray-700" style={{ whiteSpace: 'nowrap' }}>
              {record.order.orderNumber}
            </span>
          );
        }
        return <Tag color="purple">月度固定</Tag>;
      },
    },
    {
      title: '分润模块',
      dataIndex: ['module', 'name'],
      key: 'moduleName',
      width: 95,
      align: 'center',
      render: (text: string) => (
        <Tag color="blue" style={{ margin: 0 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: '收益人',
      key: 'memberId',
      width: 140,
      render: (_, record) => (
        <div style={{ whiteSpace: 'nowrap' }}>
          <span className="font-medium text-gray-800" style={{ marginRight: 6 }}>
            {record.memberName || record.memberId}
          </span>
          {record.memberRole && (
            <Tag color="geekblue" style={{ margin: 0 }}>
              {record.memberRole}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '订单基数 (元)',
      dataIndex: 'baseAmount',
      key: 'baseAmount',
      width: 110,
      align: 'right',
      render: (amount: number, record) => {
        if (!record.orderId) return '-';
        return <span className="font-mono">{(amount / 100).toFixed(2)}</span>;
      },
    },
    {
      title: '分润金额 (元)',
      dataIndex: 'profitAmount',
      key: 'profitAmount',
      width: 110,
      align: 'right',
      render: (amount: number) => {
        const value = (amount / 100).toFixed(2);
        return (
          <span
            className={`font-mono font-medium ${amount < 0 ? 'text-red-500' : 'text-green-600'}`}
          >
            ¥{value}
          </span>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 85,
      align: 'center',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          PENDING: { color: 'warning', text: '待结算' },
          SETTLED: { color: 'success', text: '已结算' },
          CLAWBACK: { color: 'error', text: '已回扣' },
          CANCELLED: { color: 'default', text: '已取消' },
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return (
          <Tag color={config.color} style={{ margin: 0 }}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '预计结算时间',
      dataIndex: 'settlementTime',
      key: 'settlementTime',
      width: 135,
      render: (time: string) => (
        <span className="text-gray-500 font-mono text-xs" style={{ whiteSpace: 'nowrap' }}>
          {time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'}
        </span>
      ),
    },
    {
      title: '流水生成时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 135,
      render: (time: string) => (
        <span className="text-gray-500 font-mono text-xs" style={{ whiteSpace: 'nowrap' }}>
          {dayjs(time).format('YYYY-MM-DD HH:mm')}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      align: 'center',
      render: (_, record) => {
        const deleteBtn = (
          <Popconfirm
            title="确定要删除该笔流水吗？"
            description="删除后该分润记录将被彻底移除，不可恢复。"
            okText="确认删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button type="link" danger size="small" style={{ padding: 0 }}>
              删除
            </Button>
          </Popconfirm>
        );

        if (record.status === 'CLAWBACK') {
          return <Space size="small">{deleteBtn}</Space>;
        }

        if (record.status === 'SETTLED') {
          return (
            <Space size="small">
              <Popconfirm
                title="确定要撤销结算吗？这会将流水恢复为待结算状态。"
                onConfirm={() => undoSettleMutation.mutate(record.id)}
              >
                <Button type="link" size="small" style={{ padding: 0 }}>
                  撤销结算
                </Button>
              </Popconfirm>
              {deleteBtn}
            </Space>
          );
        }

        if (record.status === 'CANCELLED') {
          return (
            <Space size="small">
              <Popconfirm
                title="确定要恢复该笔流水吗？"
                onConfirm={() => restoreMutation.mutate(record.id)}
              >
                <Button type="link" size="small" style={{ padding: 0 }}>
                  恢复
                </Button>
              </Popconfirm>
              {deleteBtn}
            </Space>
          );
        }

        return (
          <Space size="small">
            <Popconfirm
              title="确定要结算该笔流水吗？"
              onConfirm={() => settleMutation.mutate(record.id)}
            >
              <Button type="link" size="small" style={{ padding: 0 }}>
                结算
              </Button>
            </Popconfirm>
            <Popconfirm
              title="确定要取消该笔流水吗？"
              onConfirm={() => cancelMutation.mutate(record.id)}
            >
              <Button type="link" danger size="small" style={{ padding: 0 }}>
                取消
              </Button>
            </Popconfirm>
            {deleteBtn}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <Card bordered={false} className="shadow-sm">
        <div className="mb-4 flex justify-between items-center flex-wrap gap-2">
          <Space wrap>
            <Select
              placeholder="按所属规则筛选"
              style={{ width: 180 }}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={rulesData?.map((r) => ({ label: r.name, value: r.id }))}
              onChange={handleRuleChange}
            />
            <RangePicker placeholder={['流水开始', '流水结束']} onChange={handleDateRangeChange} />
            <Select
              placeholder="结算状态"
              style={{ width: 120 }}
              allowClear
              onChange={handleStatusChange}
            >
              <Select.Option value="PENDING">待结算</Select.Option>
              <Select.Option value="SETTLED">已结算</Select.Option>
              <Select.Option value="CLAWBACK">已回扣</Select.Option>
              <Select.Option value="CANCELLED">已取消</Select.Option>
            </Select>
          </Space>

          <Space>
            <Button
              icon={<SyncOutlined spin={isReconciling} />}
              onClick={handleReconcile}
              loading={isReconciling}
            >
              退款对账同步
            </Button>
          </Space>
        </div>

        {selectedRowKeys.length > 0 && (
          <Alert
            type="info"
            showIcon
            className="mb-4"
            message={
              <div className="flex justify-between items-center">
                <span>
                  已选择 <strong className="text-blue-600">{selectedRowKeys.length}</strong>{' '}
                  笔流水记录
                </span>
                <Space>
                  <Popconfirm
                    title={`确定要批量删除选中的 ${selectedRowKeys.length} 笔流水吗？`}
                    description="删除后这些分润记录将被彻底移除，不可恢复。"
                    okText="确认删除"
                    okButtonProps={{ danger: true }}
                    cancelText="取消"
                    onConfirm={() => batchDeleteMutation.mutate(selectedRowKeys as string[])}
                  >
                    <Button type="primary" danger size="small">
                      批量删除 ({selectedRowKeys.length})
                    </Button>
                  </Popconfirm>
                  <Button type="link" size="small" onClick={() => setSelectedRowKeys([])}>
                    取消选择
                  </Button>
                </Space>
              </div>
            }
          />
        )}

        <Table
          columns={columns}
          dataSource={recordsData?.data || []}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          loading={
            isLoading ||
            settleMutation.isPending ||
            cancelMutation.isPending ||
            deleteMutation.isPending ||
            batchDeleteMutation.isPending
          }
          pagination={{
            current: recordsData?.page || filters.page || 1,
            pageSize: recordsData?.pageSize || filters.pageSize || 10,
            total: recordsData?.total || 0,
            showSizeChanger: true,
          }}
          scroll={{ x: 1200 }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};
