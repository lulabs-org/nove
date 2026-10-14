import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Segmented, Spin, Button } from 'antd';
import {
  TeamOutlined,
  DollarOutlined,
  RiseOutlined,
  ReloadOutlined,
  UserOutlined,
  AccountBookOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { recordApi } from '../records/api/recordApi';
import { payslipApi } from '../payslips/api/payslipApi';
import type { ProfitSharingDashboardStats } from '../records/types';
import { MultiMemberCompareView } from './components/MultiMemberCompareView';
import { SingleMemberDrilldownView } from './components/SingleMemberDrilldownView';
import { MonthlyOperationsView } from './components/MonthlyOperationsView';
import './ProfitDashboard.css';

export const ProfitDashboard: React.FC = () => {
  // 核心视角切换：'COMPARE'（全员多人员对比） | 'DRILLDOWN'（单人深度透视） | 'OPERATIONS'（账期经营盘点）
  const [activeTab, setActiveTab] = useState<'COMPARE' | 'DRILLDOWN' | 'OPERATIONS'>('COMPARE');

  // 历史数据配置
  const [monthsCount, setMonthsCount] = useState<number>(6);
  const [drilldownMemberId, setDrilldownMemberId] = useState<string>('');

  // 账期经营配置
  const currentMonthStr = dayjs().format('YYYY-MM');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // 1. 查询全员历史数据与成员列表
  const {
    data: allHistoricalData,
    isLoading: isAllHistoricalLoading,
    isFetching: isAllHistoricalFetching,
    refetch: refetchAllHistorical,
  } = useQuery({
    queryKey: ['profit-sharing-historical-stats', 'all', monthsCount],
    queryFn: () => payslipApi.getHistoricalStats({ months: monthsCount }),
  });

  const members = allHistoricalData?.members || [];
  const effectiveDrilldownId = drilldownMemberId || members[0]?.id || '';

  // 个人透视必须使用独立的员工维度查询，避免复用全员汇总数据。
  const {
    data: memberHistoricalData,
    isLoading: isMemberHistoricalLoading,
    isFetching: isMemberHistoricalFetching,
    refetch: refetchMemberHistorical,
  } = useQuery({
    queryKey: ['profit-sharing-historical-stats', 'member', effectiveDrilldownId, monthsCount],
    queryFn: () =>
      payslipApi.getHistoricalStats({
        memberId: effectiveDrilldownId,
        months: monthsCount,
      }),
    enabled: activeTab === 'DRILLDOWN' && !!effectiveDrilldownId,
  });

  const historicalData = activeTab === 'DRILLDOWN' ? memberHistoricalData : allHistoricalData;

  // 2. 查询单月经营统计
  const {
    data: operationStatsData,
    isLoading: isOpsLoading,
    isFetching: isOpsFetching,
    refetch: refetchOps,
  } = useQuery({
    queryKey: ['profit-dashboard-stats', selectedMonth],
    queryFn: () => recordApi.getDashboardStats(selectedMonth),
  });

  const handleRefresh = () => {
    refetchAllHistorical();
    if (activeTab === 'DRILLDOWN' && effectiveDrilldownId) {
      refetchMemberHistorical();
    }
    refetchOps();
  };

  const isRefreshing = isAllHistoricalFetching || isMemberHistoricalFetching || isOpsFetching;
  const isLoading =
    activeTab === 'OPERATIONS'
      ? isOpsLoading
      : isAllHistoricalLoading ||
        (activeTab === 'DRILLDOWN' && !!effectiveDrilldownId && isMemberHistoricalLoading);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
        <Spin size="large" />
      </div>
    );
  }

  const months = historicalData?.months || [];
  const memberSeries = historicalData?.memberSeries || [];
  const overall = historicalData?.overall || {
    totalGrossAmount: 0,
    totalSettledAmount: 0,
    totalPendingAmount: 0,
    avgMonthlyGross: 0,
    maxMonthlyGross: 0,
  };
  const categoryTotals = historicalData?.categoryTotals || {
    baseSalaryAmount: 0,
    commissionAmount: 0,
    bonusAmount: 0,
    subsidyAmount: 0,
    deductionAmount: 0,
  };

  const opsStats: ProfitSharingDashboardStats = operationStatsData || {
    month: selectedMonth,
    totalOrders: 0,
    totalSettled: 0,
    totalPending: 0,
    totalClawback: 0,
    moduleStats: [],
    memberRankings: [],
  };

  // 当前钻取选中的成员
  const activeDrilldownMember = members.find((m) => m.id === effectiveDrilldownId);

  // 从全员对比点击“单人透视”快捷跳转
  const handleSelectMemberForDrilldown = (memberId: string) => {
    setDrilldownMemberId(memberId);
    setActiveTab('DRILLDOWN');
  };

  return (
    <div className="profit-dashboard-page">
      {/* 顶部控制栏（全局统一：左侧视角切换，右侧刷新数据） */}
      <div className="profit-dashboard-header">
        <div className="profit-dashboard-controls">
          <Segmented
            className="profit-view-segmented"
            value={activeTab}
            onChange={(val) => setActiveTab(val as 'COMPARE' | 'DRILLDOWN' | 'OPERATIONS')}
            options={[
              {
                value: 'COMPARE',
                icon: <TeamOutlined />,
                label: '全员薪酬对比与趋势',
              },
              {
                value: 'DRILLDOWN',
                icon: <UserOutlined />,
                label: '员工个人薪酬透视',
              },
              {
                value: 'OPERATIONS',
                icon: <AccountBookOutlined />,
                label: '月度账期经营分析',
              },
            ]}
          />
        </div>

        <Button
          className="profit-dashboard-refresh-btn"
          icon={<ReloadOutlined spin={isRefreshing} />}
          loading={isRefreshing}
          onClick={handleRefresh}
        >
          刷新数据
        </Button>
      </div>

      {/* 全局精简 4 维动态财务 KPI 指标栏 (在全员对比与单人透视模式下呈现) */}
      {activeTab !== 'OPERATIONS' && (
        <Row gutter={[16, 16]}>
          {activeTab === 'COMPARE' ? (
            <>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="profit-kpi-card profit-kpi-card-blue">
                  <Statistic
                    title={
                      <span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>
                        周期内全员发薪总盘
                      </span>
                    }
                    value={overall.totalGrossAmount / 100}
                    precision={2}
                    prefix={<DollarOutlined style={{ color: '#2563eb' }} />}
                    valueStyle={{ color: '#1677ff', fontWeight: 700 }}
                  />
                  <div className="profit-kpi-subtext">
                    涵盖近 {monthsCount} 个月全员全部发薪总额
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="profit-kpi-card profit-kpi-card-green">
                  <Statistic
                    title={
                      <span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>
                        全员月均发薪支出
                      </span>
                    }
                    value={overall.avgMonthlyGross / 100}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#16a34a', fontWeight: 700 }}
                  />
                  <div className="profit-kpi-subtext">全平台月均平稳薪资水平</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="profit-kpi-card profit-kpi-card-amber">
                  <Statistic
                    title={
                      <span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>
                        创收领先标杆员工
                      </span>
                    }
                    value={memberSeries.length > 0 ? memberSeries[0].memberName : '-'}
                    prefix={<RiseOutlined style={{ color: '#d97706' }} />}
                    valueStyle={{ color: '#d97706', fontWeight: 700 }}
                  />
                  <div className="profit-kpi-subtext">
                    {memberSeries.length > 0
                      ? `累计创收 ¥${(memberSeries[0].totalGrossAmount / 100).toFixed(2)}`
                      : '业绩排名第一位'}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="profit-kpi-card profit-kpi-card-purple">
                  <Statistic
                    title={
                      <span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>
                        核算覆盖人员规模
                      </span>
                    }
                    value={memberSeries.length}
                    suffix="人"
                    prefix={<TeamOutlined style={{ color: '#9333ea' }} />}
                    valueStyle={{ color: '#722ed1', fontWeight: 700 }}
                  />
                  <div className="profit-kpi-subtext">共包含 {members.length} 名在册核算成员</div>
                </Card>
              </Col>
            </>
          ) : (
            <>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="profit-kpi-card profit-kpi-card-blue">
                  <Statistic
                    title={
                      <span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>
                        该员工周期总实发
                      </span>
                    }
                    value={overall.totalGrossAmount / 100}
                    precision={2}
                    prefix={<DollarOutlined style={{ color: '#2563eb' }} />}
                    valueStyle={{ color: '#1677ff', fontWeight: 700 }}
                  />
                  <div className="profit-kpi-subtext">近 {monthsCount} 个月该员工累计发薪总额</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="profit-kpi-card profit-kpi-card-green">
                  <Statistic
                    title={
                      <span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>
                        该员工月均实发
                      </span>
                    }
                    value={overall.avgMonthlyGross / 100}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#16a34a', fontWeight: 700 }}
                  />
                  <div className="profit-kpi-subtext">月度平均综合薪酬收益</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="profit-kpi-card profit-kpi-card-amber">
                  <Statistic
                    title={
                      <span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>
                        单月最高收入纪录
                      </span>
                    }
                    value={overall.maxMonthlyGross / 100}
                    precision={2}
                    prefix={<RiseOutlined style={{ color: '#d97706' }} />}
                    valueStyle={{ color: '#d97706', fontWeight: 700 }}
                  />
                  <div className="profit-kpi-subtext">峰值创收发薪月份记录</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="profit-kpi-card profit-kpi-card-purple">
                  <Statistic
                    title={
                      <span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>
                        待结算发放金额
                      </span>
                    }
                    value={overall.totalPendingAmount / 100}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#722ed1', fontWeight: 700 }}
                  />
                  <div className="profit-kpi-subtext">
                    已结清发放: ¥{(overall.totalSettledAmount / 100).toFixed(2)}
                  </div>
                </Card>
              </Col>
            </>
          )}
        </Row>
      )}

      {/* 主体分析内容区（根据选中视角无缝切换） */}
      {activeTab === 'COMPARE' && (
        <MultiMemberCompareView
          months={months}
          memberSeries={memberSeries}
          monthsCount={monthsCount}
          onMonthsCountChange={setMonthsCount}
          onSelectMemberForDrilldown={handleSelectMemberForDrilldown}
        />
      )}

      {activeTab === 'DRILLDOWN' && (
        <SingleMemberDrilldownView
          months={months}
          categoryTotals={categoryTotals}
          members={members}
          selectedMemberId={effectiveDrilldownId}
          selectedMember={activeDrilldownMember}
          monthsCount={monthsCount}
          onSelectMember={setDrilldownMemberId}
          onMonthsCountChange={setMonthsCount}
        />
      )}

      {activeTab === 'OPERATIONS' && (
        <MonthlyOperationsView
          stats={opsStats}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      )}
    </div>
  );
};
