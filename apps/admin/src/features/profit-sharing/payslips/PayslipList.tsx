import React, { useState } from 'react';
import { Table, Card, DatePicker, Input, Button, Space, Tag, Popconfirm, message } from 'antd';
import {
  DownloadOutlined,
  DollarOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { payslipApi } from './api/payslipApi';
import { PayslipDetailDrawer } from './PayslipDetailDrawer';
import { PayslipAdjustmentModal } from './PayslipAdjustmentModal';
import type { PayslipSummaryItem } from './types';

const { Search } = Input;

export const PayslipList: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [keyword, setKeyword] = useState<string>('');

  const monthStr = selectedMonth.format('YYYY-MM');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['profit-sharing-payslips', monthStr, keyword],
    queryFn: () => payslipApi.list({ month: monthStr, keyword: keyword || undefined }),
  });

  const items = data?.items || [];
  const summary = data?.summary;

  // 抽屉详情状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // 调整项弹窗状态
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjustmentTarget, setAdjustmentTarget] = useState<{ id: string; name: string } | null>(
    null
  );

  const settleMutation = useMutation({
    mutationFn: (memberId: string) => payslipApi.settle(memberId, monthStr),
    onSuccess: (res) => {
      message.success(res.message || '结算发薪成功！');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-records'] });
      queryClient.invalidateQueries({ queryKey: ['profit-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-monthly-payslips'] });
    },
    onError: () => {
      message.error('结算发薪失败');
    },
  });

  // 一键全员批量发薪
  const batchSettleMutation = useMutation({
    mutationFn: async () => {
      const pendingMembers = items.filter((i) => (i.pendingAmount ?? 0) > 0);
      for (const m of pendingMembers) {
        await payslipApi.settle(m.memberId, monthStr);
      }
    },
    onSuccess: () => {
      message.success('当月所有待发工资条已完成一键发薪结算！');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-records'] });
      queryClient.invalidateQueries({ queryKey: ['profit-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-monthly-payslips'] });
    },
    onError: () => {
      message.error('一键发薪结算过程中出现异常');
    },
  });

  const [exporting, setExporting] = useState(false);

  const handleViewDetail = (memberId: string) => {
    setSelectedMemberId(memberId);
    setDrawerVisible(true);
  };

  const handleOpenAdjustment = (member: { id: string; name: string }) => {
    setAdjustmentTarget(member);
    setAdjustmentModalOpen(true);
  };

  const handleExport = () => {
    const exportItems = items.length > 0 ? items : data?.items || [];
    if (exportItems.length === 0) {
      message.warning('当前月份暂无可导出的工资条数据');
      return;
    }

    try {
      setExporting(true);
      const filename = `工资条-${monthStr}.csv`;
      const headers = [
        '员工姓名',
        '系统账号',
        '岗位角色',
        '所属部门',
        '工资月份',
        '固定底薪/课酬(元)',
        '订单提成(元)',
        '贡献订单数',
        '各类奖金(元)',
        '福利补贴(元)',
        '各项扣减(元)',
        '应发分润总额(元)',
        '已发放金额(元)',
        '待结算金额(元)',
        '结算状态',
      ];

      const rows = exportItems.map((item) => [
        item.memberName,
        item.username || '-',
        item.memberRole || '员工',
        item.departmentName || '-',
        item.month,
        ((item.baseSalaryAmount ?? item.fixedAmount ?? 0) / 100).toFixed(2),
        ((item.commissionAmount ?? 0) / 100).toFixed(2),
        item.orderCount || 0,
        ((item.bonusAmount ?? 0) / 100).toFixed(2),
        ((item.subsidyAmount ?? 0) / 100).toFixed(2),
        ((item.deductionAmount ?? item.clawbackAmount ?? 0) / 100).toFixed(2),
        (item.totalGrossAmount / 100).toFixed(2),
        ((item.settledAmount ?? 0) / 100).toFixed(2),
        ((item.pendingAmount ?? 0) / 100).toFixed(2),
        item.status === 'SETTLED'
          ? '全部已结'
          : item.status === 'PARTIALLY_SETTLED'
            ? '部分已结'
            : '待结算',
      ]);

      const escapeField = (val: string | number) => {
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvContent = [
        headers.map(escapeField).join(','),
        ...rows.map((r) => r.map(escapeField).join(',')),
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success(`已成功导出 ${exportItems.length} 条工资条数据至 ${filename}`);
    } catch (err) {
      console.error('导出失败:', err);
      message.error('导出工资条失败，请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  const hasPendingSalaries = items.some((i) => (i.pendingAmount ?? 0) > 0);

  const columns: ColumnsType<PayslipSummaryItem> = [
    {
      title: '员工姓名',
      key: 'memberInfo',
      width: 120,
      render: (_, record: PayslipSummaryItem) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>{record.memberName}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {record.departmentName || '未分配部门'}
          </div>
        </div>
      ),
    },
    {
      title: '岗位角色',
      dataIndex: 'memberRole',
      key: 'memberRole',
      width: 80,
      align: 'center',
      render: (role: string) => (
        <Tag color="geekblue" style={{ margin: 0 }}>
          {role || '员工'}
        </Tag>
      ),
    },
    {
      title: '固定底薪',
      key: 'baseSalaryAmount',
      width: 95,
      align: 'right',
      render: (_, record: PayslipSummaryItem) => {
        const val = record.baseSalaryAmount ?? record.fixedAmount ?? 0;
        return val > 0 ? (
          <span className="text-purple-600 font-medium font-mono">¥{(val / 100).toFixed(2)}</span>
        ) : (
          <span className="text-gray-300">-</span>
        );
      },
    },
    {
      title: '订单提成',
      key: 'commissionAmount',
      width: 105,
      align: 'right',
      render: (_, record: PayslipSummaryItem) => {
        const val = record.commissionAmount ?? 0;
        return val > 0 ? (
          <Space size="small">
            <span className="text-emerald-600 font-medium font-mono">
              ¥{(val / 100).toFixed(2)}
            </span>
            <Tag color="cyan" className="text-xs" style={{ margin: 0 }}>
              {record.orderCount} 笔
            </Tag>
          </Space>
        ) : (
          <span className="text-gray-300">-</span>
        );
      },
    },
    {
      title: '各类奖金',
      key: 'bonusAmount',
      width: 85,
      align: 'right',
      render: (_, record: PayslipSummaryItem) => {
        const val = record.bonusAmount ?? 0;
        return val > 0 ? (
          <Space size="small">
            <span className="text-amber-600 font-medium font-mono">+¥{(val / 100).toFixed(2)}</span>
            {record.bonusCount > 0 && (
              <Tag color="orange" className="text-xs" style={{ margin: 0 }}>
                {record.bonusCount}
              </Tag>
            )}
          </Space>
        ) : (
          <span className="text-gray-300">-</span>
        );
      },
    },
    {
      title: '福利津贴',
      key: 'subsidyAmount',
      width: 85,
      align: 'right',
      render: (_, record: PayslipSummaryItem) => {
        const val = record.subsidyAmount ?? 0;
        return val > 0 ? (
          <Space size="small">
            <span className="text-cyan-600 font-medium font-mono">+¥{(val / 100).toFixed(2)}</span>
            {record.subsidyCount > 0 && (
              <Tag color="cyan" className="text-xs" style={{ margin: 0 }}>
                {record.subsidyCount}
              </Tag>
            )}
          </Space>
        ) : (
          <span className="text-gray-300">-</span>
        );
      },
    },
    {
      title: '各项扣减',
      key: 'deductionAmount',
      width: 85,
      align: 'right',
      render: (_, record: PayslipSummaryItem) => {
        const val = record.deductionAmount ?? record.clawbackAmount ?? 0;
        return val > 0 ? (
          <span className="text-red-500 font-medium font-mono">-¥{(val / 100).toFixed(2)}</span>
        ) : (
          <span className="text-gray-300">-</span>
        );
      },
    },
    {
      title: '应发合计',
      dataIndex: 'totalGrossAmount',
      key: 'totalGrossAmount',
      width: 105,
      align: 'right',
      render: (val: number) => (
        <span className="text-base font-bold text-blue-600 font-mono">
          ¥{(val / 100).toFixed(2)}
        </span>
      ),
    },
    {
      title: '已发 / 待结算',
      key: 'settlementSplit',
      width: 115,
      render: (_, record: PayslipSummaryItem) => (
        <Space direction="vertical" size={1}>
          <span className="text-xs text-gray-500 font-mono">
            已发: ¥{((record.settledAmount ?? 0) / 100).toFixed(2)}
          </span>
          {(record.pendingAmount ?? 0) > 0 ? (
            <span className="text-xs text-amber-600 font-medium font-mono">
              待发: ¥{(record.pendingAmount / 100).toFixed(2)}
            </span>
          ) : (
            <span className="text-xs text-green-600 font-medium">全部结清</span>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 85,
      align: 'center',
      render: (status: string) => {
        if (status === 'SETTLED') {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />} style={{ margin: 0 }}>
              全部已结
            </Tag>
          );
        }
        if (status === 'PARTIALLY_SETTLED') {
          return (
            <Tag color="warning" icon={<ClockCircleOutlined />} style={{ margin: 0 }}>
              部分已结
            </Tag>
          );
        }
        return (
          <Tag color="processing" icon={<ClockCircleOutlined />} style={{ margin: 0 }}>
            待结算
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 135,
      align: 'center',
      render: (_, record: PayslipSummaryItem) => (
        <Space size="middle">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            style={{ padding: 0 }}
            onClick={() => handleViewDetail(record.memberId)}
          >
            明细
          </Button>
          <Button
            type="link"
            size="small"
            style={{ color: '#722ed1', padding: 0 }}
            icon={<PlusCircleOutlined />}
            onClick={() => handleOpenAdjustment({ id: record.memberId, name: record.memberName })}
          >
            调整
          </Button>
          {(record.pendingAmount ?? 0) > 0 && (
            <Popconfirm
              title={`确定结算 ${record.memberName} 的待发薪资 ¥${(
                record.pendingAmount / 100
              ).toFixed(2)}？`}
              description="结算后，该月份的相关待发分润和工资记录将标记为已发放。"
              onConfirm={() => settleMutation.mutate(record.memberId)}
              okText="确认结算"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                style={{ color: '#16a34a', padding: 0 }}
                icon={<DollarOutlined />}
              >
                发薪
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      {/* 现代化紧凑单行操作工具栏：纯单行布局，彻底消除换行膨胀 */}
      <Card bordered={false} className="shadow-sm" styles={{ body: { padding: '12px 20px' } }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {/* 左侧：标题、月份选择与实时财务统计 */}
          <Space size="middle" align="center" style={{ flexWrap: 'nowrap', minWidth: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', whiteSpace: 'nowrap' }}>
              工资条台账
            </span>
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={(date) => {
                if (date) setSelectedMonth(date);
              }}
              allowClear={false}
              style={{ width: 115, flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
              共 <strong>{items.length}</strong> 人 · 应发合计{' '}
              <strong style={{ color: '#1677ff', fontFamily: 'monospace' }}>
                ¥{((summary?.totalGrossAmount || 0) / 100).toFixed(2)}
              </strong>{' '}
              (已发{' '}
              <span style={{ fontFamily: 'monospace' }}>
                ¥{((summary?.totalSettledAmount || 0) / 100).toFixed(2)}
              </span>{' '}
              / 待发{' '}
              <span
                style={{
                  color: (summary?.totalPendingAmount || 0) > 0 ? '#d97706' : '#16a34a',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                }}
              >
                ¥{((summary?.totalPendingAmount || 0) / 100).toFixed(2)}
              </span>
              )
            </span>
          </Space>

          {/* 右侧：紧凑搜索与操作按钮 */}
          <Space size="small" align="center" style={{ flexShrink: 0 }}>
            <Search
              placeholder="搜索员工姓名 / 角色 / 部门"
              allowClear
              onSearch={(val) => setKeyword(val)}
              style={{ width: 170 }}
            />
            <Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport}>
              导出 CSV
            </Button>
            <Popconfirm
              title="确定一键发放结算当月所有待发工资与分润？"
              description={`将为当月所有未结清的员工（共计待发 ¥${((summary?.totalPendingAmount || 0) / 100).toFixed(2)}）批量标记已发放。`}
              onConfirm={() => batchSettleMutation.mutate()}
              okText="确认一键发薪"
              cancelText="取消"
              disabled={!hasPendingSalaries}
            >
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                loading={batchSettleMutation.isPending}
                disabled={!hasPendingSalaries}
              >
                一键全员发薪
              </Button>
            </Popconfirm>
          </Space>
        </div>
      </Card>

      {/* 核心工资条表格：首屏立即可见，支持翻页、穿透明细、加减项调整与逐人发薪 */}
      <Card bordered={false} className="shadow-sm">
        <Table
          columns={columns}
          dataSource={items}
          rowKey="memberId"
          loading={isLoading || settleMutation.isPending || batchSettleMutation.isPending}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1100 }}
          size="middle"
        />
      </Card>

      {/* 单人电子工资条穿透抽屉 */}
      <PayslipDetailDrawer
        open={drawerVisible}
        memberId={selectedMemberId}
        month={monthStr}
        onClose={() => setDrawerVisible(false)}
      />

      {/* 奖惩/补贴调整项录入弹窗 */}
      <PayslipAdjustmentModal
        open={adjustmentModalOpen}
        memberId={adjustmentTarget?.id || null}
        memberName={adjustmentTarget?.name || ''}
        month={monthStr}
        onClose={() => {
          setAdjustmentModalOpen(false);
          setAdjustmentTarget(null);
        }}
        onSuccess={() => {
          setAdjustmentModalOpen(false);
          setAdjustmentTarget(null);
          refetch();
          queryClient.invalidateQueries({ queryKey: ['profit-dashboard-stats'] });
          queryClient.invalidateQueries({ queryKey: ['profit-sharing-monthly-payslips'] });
        }}
      />
    </div>
  );
};
