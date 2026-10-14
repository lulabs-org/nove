import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  List,
  Button,
  DatePicker,
  Radio,
  Space,
  Tag,
  Empty,
  Spin,
  message,
  notification,
} from 'antd';
import {
  CalendarOutlined,
  ArrowRightOutlined,
  TrophyOutlined,
  AppstoreOutlined,
  TeamOutlined,
  ProfileOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { payslipApi } from '../../payslips/api/payslipApi';
import { recordApi } from '../../records/api/recordApi';
import type { ProfitSharingDashboardStats } from '../../records/types';

interface MonthlyOperationsViewProps {
  stats: ProfitSharingDashboardStats;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export const MonthlyOperationsView: React.FC<MonthlyOperationsViewProps> = ({
  stats,
  selectedMonth,
  onMonthChange,
}) => {
  const navigate = useNavigate();
  const currentMonthStr = dayjs().format('YYYY-MM');
  const periodDisplay = selectedMonth === 'ALL' ? '全部历史累计' : `${selectedMonth} 账期`;

  // 查询该月份工资条的 5+1 薪酬构成统计数据
  const { data: payslipData, isLoading: isPayslipLoading } = useQuery({
    queryKey: ['profit-sharing-monthly-payslips', selectedMonth],
    queryFn: () =>
      payslipApi.list({
        month: selectedMonth !== 'ALL' ? selectedMonth : undefined,
      }),
  });

  const summary = payslipData?.summary || {
    totalGrossAmount: 0,
    totalBaseSalaryAmount: 0,
    totalCommissionAmount: 0,
    totalBonusAmount: 0,
    totalSubsidyAmount: 0,
    totalDeductionAmount: 0,
    totalSettledAmount: 0,
    totalPendingAmount: 0,
    totalMembers: 0,
  };

  const totalModuleAmount = (stats.moduleStats || []).reduce((sum, m) => sum + Number(m.amount), 0);

  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({ queryKey: ['profit-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-records'] });
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-monthly-payslips'] });
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      message.error(apiErr?.response?.data?.message || '退款对账失败');
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 账期月份选择控制台（作为独立卡片板块拆分呈现，与其他板块工具栏保持一致） */}
      <div className="profit-toolbar-card">
        <Space size="middle" align="center">
          <CalendarOutlined style={{ color: '#2563eb' }} />
          <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>核算账期选择：</span>
          <Tag color={selectedMonth === 'ALL' ? 'blue' : 'cyan'}>{periodDisplay}</Tag>
        </Space>

        <Space size="middle" wrap align="center">
          <DatePicker
            picker="month"
            value={selectedMonth !== 'ALL' ? dayjs(selectedMonth, 'YYYY-MM') : null}
            placeholder="选择指定月份"
            allowClear={false}
            onChange={(date) => {
              if (date) {
                onMonthChange(date.format('YYYY-MM'));
              }
            }}
            style={{ width: 140 }}
          />

          <Radio.Group
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            size="middle"
          >
            <Radio.Button value={currentMonthStr}>本月</Radio.Button>
            <Radio.Button value={dayjs().subtract(1, 'month').format('YYYY-MM')}>上月</Radio.Button>
            <Radio.Button value="ALL">全部累计</Radio.Button>
          </Radio.Group>

          <Button
            icon={<SyncOutlined spin={isReconciling} />}
            onClick={handleReconcile}
            loading={isReconciling}
          >
            退款对账同步
          </Button>
        </Space>
      </div>
      {/* 5+1 薪酬板块全景指标卡（原放置在工资条页面，现统一归并至看板进行深度经营分析） */}
      {isPayslipLoading ? (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <Spin size="small" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 第一排：5 大板块构成与应发总额 */}
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} lg={4}>
              <Card bordered={false} className="profit-kpi-card profit-kpi-card-blue">
                <Statistic
                  title={
                    <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>
                      应发分润 / 总薪酬
                    </span>
                  }
                  value={summary.totalGrossAmount / 100}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#1677ff', fontWeight: 700, fontSize: 18 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card bordered={false} className="profit-kpi-card profit-kpi-card-purple">
                <Statistic
                  title={
                    <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>
                      固定底薪 / 课酬
                    </span>
                  }
                  value={summary.totalBaseSalaryAmount / 100}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#722ed1', fontWeight: 700, fontSize: 18 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card bordered={false} className="profit-kpi-card profit-kpi-card-green">
                <Statistic
                  title={
                    <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>
                      订单提成总额
                    </span>
                  }
                  value={summary.totalCommissionAmount / 100}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#16a34a', fontWeight: 700, fontSize: 18 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card bordered={false} className="profit-kpi-card profit-kpi-card-amber">
                <Statistic
                  title={
                    <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>
                      各类奖金总额
                    </span>
                  }
                  value={summary.totalBonusAmount / 100}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#d97706', fontWeight: 700, fontSize: 18 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card
                bordered={false}
                className="profit-kpi-card"
                style={{ background: '#f0fdfa', borderColor: '#ccfbf1' }}
              >
                <Statistic
                  title={
                    <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>
                      福利津贴补贴
                    </span>
                  }
                  value={summary.totalSubsidyAmount / 100}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#0d9488', fontWeight: 700, fontSize: 18 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card bordered={false} className="profit-kpi-card profit-kpi-card-red">
                <Statistic
                  title={
                    <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>
                      各项扣减总额
                    </span>
                  }
                  value={summary.totalDeductionAmount / 100}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#dc2626', fontWeight: 700, fontSize: 18 }}
                />
              </Card>
            </Col>
          </Row>

          {/* 第二排：发放结算进度与业务量 */}
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="profit-kpi-card profit-kpi-card-green">
                <Statistic
                  title={
                    <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>
                      已发放 / 已结清金额
                    </span>
                  }
                  value={summary.totalSettledAmount / 100}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#16a34a', fontWeight: 700 }}
                />
                <div className="profit-kpi-subtext">财务已划转完成</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="profit-kpi-card profit-kpi-card-amber">
                <Statistic
                  title={
                    <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>
                      待发放 / 待结算金额
                    </span>
                  }
                  value={summary.totalPendingAmount / 100}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#d97706', fontWeight: 700 }}
                />
                <div className="profit-kpi-subtext">等待批量发薪结算</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="profit-kpi-card profit-kpi-card-blue">
                <Statistic
                  title={
                    <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>
                      处理分润订单数
                    </span>
                  }
                  value={stats.totalOrders}
                  prefix={<ProfileOutlined style={{ color: '#2563eb' }} />}
                  valueStyle={{ color: '#1677ff', fontWeight: 700 }}
                />
                <div className="profit-kpi-subtext">产生分润收益的业务订单</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="profit-kpi-card profit-kpi-card-purple">
                <Statistic
                  title={
                    <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>
                      参与核算员工数
                    </span>
                  }
                  value={summary.totalMembers}
                  suffix="人"
                  prefix={<TeamOutlined style={{ color: '#9333ea' }} />}
                  valueStyle={{ color: '#722ed1', fontWeight: 700 }}
                />
                <div className="profit-kpi-subtext">当期产生薪资记录的成员</div>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* 两栏卡片：模块占比与当期 TOP5 创收榜 */}
      <Row gutter={[16, 16]}>
        {/* 左侧：分润模块占比 */}
        <Col span={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AppstoreOutlined style={{ color: '#2563eb' }} />
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {periodDisplay} · 各分润业务模块金额占比
                </span>
              </div>
            }
            bordered={false}
            className="profit-kpi-card"
            style={{ height: '100%' }}
          >
            {!stats.moduleStats || stats.moduleStats.length === 0 ? (
              <Empty description="该账期暂无模块分润数据" style={{ padding: '48px 0' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {stats.moduleStats.map((item, index) => {
                  const colors = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#13c2c2'];
                  const percent =
                    item.percent ??
                    (totalModuleAmount > 0
                      ? Math.round((Number(item.amount) / totalModuleAmount) * 100)
                      : 0);

                  return (
                    <div key={item.name || index}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 6,
                          fontSize: 12,
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#334155' }}>
                          {item.name || '分润模块'}
                        </span>
                        <Space size="middle">
                          <span style={{ color: '#94a3b8', fontWeight: 500 }}>{percent}%</span>
                          <span
                            style={{ fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}
                          >
                            ¥{' '}
                            {Number(item.amount).toLocaleString('zh-CN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </Space>
                      </div>
                      <Progress
                        percent={percent}
                        strokeColor={colors[index % colors.length]}
                        showInfo={false}
                        size="small"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>

        {/* 右侧：当期成员收益榜 TOP 5 */}
        <Col span={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrophyOutlined style={{ color: '#d97706' }} />
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {periodDisplay} · 成员创收排行榜 TOP 5
                </span>
              </div>
            }
            bordered={false}
            className="profit-kpi-card"
            style={{ height: '100%' }}
            extra={
              <Button
                type="link"
                size="small"
                icon={<ArrowRightOutlined />}
                onClick={() => navigate('/profit-sharing/payslips')}
              >
                前往工资条发薪
              </Button>
            }
          >
            {!stats.memberRankings || stats.memberRankings.length === 0 ? (
              <Empty description="该账期暂无成员收益排名" style={{ padding: '48px 0' }} />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={stats.memberRankings.slice(0, 5)}
                renderItem={(item, index) => {
                  const rankClass =
                    index === 0
                      ? 'profit-rank-1'
                      : index === 1
                        ? 'profit-rank-2'
                        : index === 2
                          ? 'profit-rank-3'
                          : 'profit-rank-default';
                  return (
                    <List.Item
                      style={{
                        padding: '10px 8px',
                        borderRadius: 8,
                        transition: 'background 0.2s',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                        }}
                      >
                        <Space size="middle">
                          <span className={`profit-rank-badge ${rankClass}`}>{index + 1}</span>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>
                              {item.name || '未分配人员'}
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>
                              岗位角色：{item.role || '成员'}
                            </div>
                          </div>
                        </Space>

                        <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#1677ff' }}>
                            ¥{' '}
                            {Number(item.amount).toLocaleString('zh-CN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
