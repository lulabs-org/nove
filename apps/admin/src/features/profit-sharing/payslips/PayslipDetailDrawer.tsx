import React, { useState } from 'react';
import {
  Drawer,
  Spin,
  Card,
  Descriptions,
  Table,
  Tag,
  Space,
  Button,
  Popconfirm,
  message,
  Tabs,
  Alert,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  PrinterOutlined,
  DollarOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { payslipApi } from './api/payslipApi';
import { PayslipAdjustmentModal } from './PayslipAdjustmentModal';

interface PayslipDetailDrawerProps {
  open: boolean;
  memberId: string | null;
  month: string;
  onClose: () => void;
  onSettleSuccess?: () => void;
}

export const PayslipDetailDrawer: React.FC<PayslipDetailDrawerProps> = ({
  open,
  memberId,
  month,
  onClose,
  onSettleSuccess,
}) => {
  const queryClient = useQueryClient();
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['profit-sharing-payslip-detail', memberId, month],
    queryFn: () => payslipApi.getDetail(memberId!, month),
    enabled: !!memberId && open,
  });

  const settleMutation = useMutation({
    mutationFn: () => payslipApi.settle(memberId!, month),
    onSuccess: (res) => {
      message.success(res.message || '结算成功！');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-payslips'] });
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-records'] });
      queryClient.invalidateQueries({ queryKey: ['profit-dashboard-stats'] });
      onSettleSuccess?.();
    },
    onError: () => {
      message.error('结算失败，请稍后重试');
    },
  });

  if (!open) return null;

  const handlePrint = () => {
    window.print();
  };

  const genericColumns = [
    {
      title: '所属规则 / 来源',
      dataIndex: 'ruleName',
      key: 'ruleName',
      render: (text: string) => <span className="font-medium text-gray-800">{text}</span>,
    },
    {
      title: '款项名称',
      dataIndex: 'moduleName',
      key: 'moduleName',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '金额',
      dataIndex: 'profitAmount',
      key: 'profitAmount',
      render: (val: number) => {
        const isNeg = val < 0;
        return (
          <span className={`font-semibold ${isNeg ? 'text-red-500' : 'text-emerald-600'}`}>
            {isNeg ? '-' : '+'}¥{(Math.abs(val) / 100).toFixed(2)}
          </span>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) =>
        status === 'SETTLED' ? (
          <Tag color="success">已结算</Tag>
        ) : (
          <Tag color="warning">待结算</Tag>
        ),
    },
    {
      title: '备注说明',
      dataIndex: 'remark',
      key: 'remark',
      render: (val?: string) => val || '-',
    },
    {
      title: '生成时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const commissionColumns = [
    {
      title: '关联订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text?: string) => (text ? <Tag color="blue">{text}</Tag> : '-'),
    },
    {
      title: '渠道',
      dataIndex: 'channelName',
      key: 'channelName',
      render: (text?: string) => text || '-',
    },
    {
      title: '订单金额',
      dataIndex: 'orderAmount',
      key: 'orderAmount',
      render: (val?: number) => (val ? `¥${(val / 100).toFixed(2)}` : '-'),
    },
    {
      title: '分润模块',
      dataIndex: 'moduleName',
      key: 'moduleName',
      render: (text: string) => <span className="text-gray-700">{text}</span>,
    },
    {
      title: '提成分润',
      dataIndex: 'profitAmount',
      key: 'profitAmount',
      render: (val: number) => (
        <span className="text-green-600 font-semibold">+¥{(val / 100).toFixed(2)}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) =>
        status === 'SETTLED' ? (
          <Tag color="success">已结算</Tag>
        ) : (
          <Tag color="warning">待结算</Tag>
        ),
    },
    {
      title: '关单/生成时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const summary = data?.summary;
  const isAllSettled = summary && summary.pendingAmount === 0 && summary.settledAmount > 0;

  const baseSalaryList = data?.baseSalaryItems || data?.fixedItems || [];
  const commissionList = data?.commissionItems || [];
  const bonusList = data?.bonusItems || [];
  const subsidyList = data?.subsidyItems || [];
  const deductionList = data?.deductionItems || data?.clawbackItems || [];

  return (
    <>
      <Drawer
        title={
          <div className="flex items-center justify-between pr-4">
            <span className="text-lg font-semibold text-gray-800">{month} 月度电子工资条凭据</span>
            {isAllSettled ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                已发放结算完毕
              </Tag>
            ) : (
              <Tag color="warning" icon={<ClockCircleOutlined />}>
                含待结算款项
              </Tag>
            )}
          </div>
        }
        width={880}
        onClose={onClose}
        open={open}
        destroyOnClose
        footer={
          <div className="flex justify-between items-center py-1">
            <Space>
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                打印凭证
              </Button>
              <Button icon={<PlusCircleOutlined />} onClick={() => setAdjustmentModalOpen(true)}>
                录入奖惩/补贴
              </Button>
            </Space>
            <Space>
              {summary && summary.pendingAmount > 0 && (
                <Popconfirm
                  title="确认一键结算发放？"
                  description={`将为该员工结算发放 ${month} 剩余待结算金额 ¥${(
                    summary.pendingAmount / 100
                  ).toFixed(2)}。`}
                  onConfirm={() => settleMutation.mutate()}
                  okText="确认结算"
                  cancelText="取消"
                >
                  <Button
                    type="primary"
                    loading={settleMutation.isPending}
                    icon={<DollarOutlined />}
                  >
                    一键结算发薪 (¥{(summary.pendingAmount / 100).toFixed(2)})
                  </Button>
                </Popconfirm>
              )}
              <Button onClick={onClose}>关闭</Button>
            </Space>
          </div>
        }
      >
        {isLoading ? (
          <div className="py-20 text-center">
            <Spin size="large" />
            <div className="mt-2 text-gray-400">正在核算工资条数据...</div>
          </div>
        ) : !data ? (
          <Alert message="暂无工资条数据" type="info" />
        ) : (
          <div className="space-y-6">
            {/* 员工档案与发放信息 */}
            <Card className="shadow-sm border-gray-200">
              <Descriptions title="员工基本档案与发放信息" column={3} size="small">
                <Descriptions.Item label="姓名">
                  <span className="font-semibold text-gray-800">{data.member.name}</span>
                </Descriptions.Item>
                <Descriptions.Item label="系统账号">
                  {data.member.username || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="岗位角色">
                  <Tag color="geekblue">{data.member.role}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="所属部门">
                  {data.member.department || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="联系电话">{data.member.phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="工资月份">
                  <Tag color="blue">{data.month}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 5+1 薪酬构成结算卡片 */}
            <div className="grid grid-cols-6 gap-3">
              <Card className="bg-blue-50/60 border-blue-200 col-span-2">
                <div className="text-xs text-blue-600 font-medium">应发分润/总薪酬合计</div>
                <div className="text-2xl font-bold text-blue-700 mt-1">
                  ¥{((summary?.totalGrossAmount || 0) / 100).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">底薪+提成+奖金+补贴-扣减</div>
              </Card>

              <Card className="bg-purple-50/60 border-purple-200">
                <div className="text-xs text-purple-600 font-medium">固定底薪/课酬</div>
                <div className="text-lg font-bold text-purple-700 mt-1">
                  ¥{((summary?.baseSalaryAmount || summary?.fixedAmount || 0) / 100).toFixed(2)}
                </div>
                <div className="text-xs text-gray-400 mt-1">{baseSalaryList.length} 项</div>
              </Card>

              <Card className="bg-emerald-50/60 border-emerald-200">
                <div className="text-xs text-emerald-600 font-medium">订单提成</div>
                <div className="text-lg font-bold text-emerald-700 mt-1">
                  ¥{((summary?.commissionAmount || 0) / 100).toFixed(2)}
                </div>
                <div className="text-xs text-gray-400 mt-1">{summary?.orderCount || 0} 笔订单</div>
              </Card>

              <Card className="bg-amber-50/60 border-amber-200">
                <div className="text-xs text-amber-600 font-medium">各类奖金</div>
                <div className="text-lg font-bold text-amber-700 mt-1">
                  ¥{((summary?.bonusAmount || 0) / 100).toFixed(2)}
                </div>
                <div className="text-xs text-gray-400 mt-1">{bonusList.length} 项奖金</div>
              </Card>

              <Card className="bg-cyan-50/60 border-cyan-200">
                <div className="text-xs text-cyan-600 font-medium">福利津贴补贴</div>
                <div className="text-lg font-bold text-cyan-700 mt-1">
                  ¥{((summary?.subsidyAmount || 0) / 100).toFixed(2)}
                </div>
                <div className="text-xs text-gray-400 mt-1">{subsidyList.length} 项津贴</div>
              </Card>
            </div>

            {/* 发放结算进度 */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-green-50/40 border-green-200">
                <div className="text-xs text-green-600 font-medium">已结算发放金额</div>
                <div className="text-xl font-bold text-green-700 mt-1">
                  ¥{((summary?.settledAmount || 0) / 100).toFixed(2)}
                </div>
              </Card>

              <Card
                className={
                  (summary?.pendingAmount || 0) > 0
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-gray-50 border-gray-200'
                }
              >
                <div
                  className={`text-xs font-medium ${
                    (summary?.pendingAmount || 0) > 0 ? 'text-amber-600' : 'text-gray-500'
                  }`}
                >
                  待结算发放金额
                </div>
                <div
                  className={`text-xl font-bold mt-1 ${
                    (summary?.pendingAmount || 0) > 0 ? 'text-amber-700' : 'text-gray-700'
                  }`}
                >
                  ¥{((summary?.pendingAmount || 0) / 100).toFixed(2)}
                </div>
              </Card>
            </div>

            {/* 款项明细 5 大 Tab 列表 */}
            <Card title="薪酬构成明细凭证" bordered={false} className="shadow-sm">
              <Tabs
                defaultActiveKey="commission"
                items={[
                  {
                    key: 'commission',
                    label: `订单提成 (${commissionList.length})`,
                    children: (
                      <Table
                        columns={commissionColumns}
                        dataSource={commissionList}
                        rowKey="id"
                        pagination={{ pageSize: 5 }}
                        size="small"
                      />
                    ),
                  },
                  {
                    key: 'baseSalary',
                    label: `固定底薪/课酬 (${baseSalaryList.length})`,
                    children: (
                      <Table
                        columns={genericColumns}
                        dataSource={baseSalaryList}
                        rowKey="id"
                        pagination={{ pageSize: 5 }}
                        size="small"
                      />
                    ),
                  },
                  {
                    key: 'bonus',
                    label: `各类奖金 (${bonusList.length})`,
                    children: (
                      <Table
                        columns={genericColumns}
                        dataSource={bonusList}
                        rowKey="id"
                        pagination={{ pageSize: 5 }}
                        size="small"
                      />
                    ),
                  },
                  {
                    key: 'subsidy',
                    label: `福利津贴补贴 (${subsidyList.length})`,
                    children: (
                      <Table
                        columns={genericColumns}
                        dataSource={subsidyList}
                        rowKey="id"
                        pagination={{ pageSize: 5 }}
                        size="small"
                      />
                    ),
                  },
                  {
                    key: 'deduction',
                    label: `各项扣减 (${deductionList.length})`,
                    children: (
                      <Table
                        columns={genericColumns}
                        dataSource={deductionList}
                        rowKey="id"
                        pagination={{ pageSize: 5 }}
                        size="small"
                      />
                    ),
                  },
                ]}
              />
            </Card>
          </div>
        )}
      </Drawer>

      {/* 录入调整项弹窗 */}
      <PayslipAdjustmentModal
        open={adjustmentModalOpen}
        month={month}
        memberId={memberId}
        memberName={data?.member.name}
        onClose={() => setAdjustmentModalOpen(false)}
        onSuccess={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ['profit-sharing-payslips'] });
        }}
      />
    </>
  );
};
