import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Space,
  Button,
  Segmented,
  Select,
  Empty,
  Typography,
  Progress,
  Badge,
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  UserOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { HistoricalMonthPoint } from '../../payslips/types';

const { Text } = Typography;

interface SingleMemberDrilldownViewProps {
  months: HistoricalMonthPoint[];
  categoryTotals: {
    baseSalaryAmount: number;
    commissionAmount: number;
    bonusAmount: number;
    subsidyAmount: number;
    deductionAmount: number;
  };
  members: Array<{
    id: string;
    name: string;
    role?: string;
    department?: string;
  }>;
  selectedMemberId: string;
  selectedMember?: {
    id: string;
    name: string;
    role?: string;
    department?: string;
  };
  monthsCount: number;
  onSelectMember: (id: string) => void;
  onMonthsCountChange: (count: number) => void;
}

export const SingleMemberDrilldownView: React.FC<SingleMemberDrilldownViewProps> = ({
  months,
  categoryTotals,
  members,
  selectedMemberId,
  selectedMember,
  monthsCount,
  onSelectMember,
  onMonthsCountChange,
}) => {
  const navigate = useNavigate();
  const [chartMode, setChartMode] = useState<'STACKED' | 'TREND'>('STACKED');
  const [hoveredMonth, setHoveredMonth] = useState<HistoricalMonthPoint | null>(null);

  const maxY = Math.max(
    ...months.map((m) =>
      Math.max(
        (m.baseSalaryAmount + m.commissionAmount + m.bonusAmount + m.subsidyAmount) / 100,
        m.totalGrossAmount / 100
      )
    ),
    100
  );

  const chartHeight = 270;
  const chartWidth = 680;
  const paddingX = 55;
  const paddingY = 30;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  // 正向收入总额
  const totalPositive =
    categoryTotals.baseSalaryAmount +
    categoryTotals.commissionAmount +
    categoryTotals.bonusAmount +
    categoryTotals.subsidyAmount;

  const basePercent = totalPositive
    ? Math.round((categoryTotals.baseSalaryAmount / totalPositive) * 100)
    : 0;
  const commPercent = totalPositive
    ? Math.round((categoryTotals.commissionAmount / totalPositive) * 100)
    : 0;
  const bonusPercent = totalPositive
    ? Math.round((categoryTotals.bonusAmount / totalPositive) * 100)
    : 0;
  const subsidyPercent = totalPositive
    ? Math.round((categoryTotals.subsidyAmount / totalPositive) * 100)
    : 0;

  const columns = [
    {
      title: '业务月份',
      dataIndex: 'month',
      key: 'month',
      render: (m: string) => <Tag color="blue">{m}</Tag>,
    },
    {
      title: '固定底薪/课酬',
      dataIndex: 'baseSalaryAmount',
      key: 'baseSalaryAmount',
      render: (val: number) => (
        <span style={{ color: '#722ed1', fontWeight: 500 }}>¥{(val / 100).toFixed(2)}</span>
      ),
    },
    {
      title: '订单提成',
      dataIndex: 'commissionAmount',
      key: 'commissionAmount',
      render: (val: number) => (
        <span style={{ color: '#52c41a', fontWeight: 500 }}>¥{(val / 100).toFixed(2)}</span>
      ),
    },
    {
      title: '各类奖金',
      dataIndex: 'bonusAmount',
      key: 'bonusAmount',
      render: (val: number) =>
        val > 0 ? (
          <span style={{ color: '#fa8c16', fontWeight: 500 }}>+¥{(val / 100).toFixed(2)}</span>
        ) : (
          <span style={{ color: '#cbd5e1' }}>-</span>
        ),
    },
    {
      title: '福利津贴',
      dataIndex: 'subsidyAmount',
      key: 'subsidyAmount',
      render: (val: number) =>
        val > 0 ? (
          <span style={{ color: '#13c2c2', fontWeight: 500 }}>+¥{(val / 100).toFixed(2)}</span>
        ) : (
          <span style={{ color: '#cbd5e1' }}>-</span>
        ),
    },
    {
      title: '各项扣除',
      dataIndex: 'deductionAmount',
      key: 'deductionAmount',
      render: (val: number) =>
        val > 0 ? (
          <span style={{ color: '#ff4d4f', fontWeight: 500 }}>-¥{(val / 100).toFixed(2)}</span>
        ) : (
          <span style={{ color: '#cbd5e1' }}>-</span>
        ),
    },
    {
      title: '实发合计',
      dataIndex: 'totalGrossAmount',
      key: 'totalGrossAmount',
      render: (val: number) => (
        <span style={{ color: '#1677ff', fontWeight: 700, fontFamily: 'monospace', fontSize: 14 }}>
          ¥{(val / 100).toFixed(2)}
        </span>
      ),
    },
    {
      title: '已发 / 待结',
      key: 'split',
      render: (_: unknown, r: HistoricalMonthPoint) => (
        <div style={{ fontSize: 12 }}>
          <div style={{ color: '#64748b' }}>已发: ¥{(r.settledAmount / 100).toFixed(2)}</div>
          {r.pendingAmount > 0 ? (
            <div style={{ color: '#fa8c16', fontWeight: 600 }}>
              待发: ¥{(r.pendingAmount / 100).toFixed(2)}
            </div>
          ) : (
            <div style={{ color: '#52c41a' }}>已结清</div>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Button
          type="link"
          size="small"
          icon={<ArrowRightOutlined />}
          onClick={() => navigate(`/profit-sharing/payslips`)}
        >
          查看工资条
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 顶部个人控制卡片 */}
      <div className="profit-toolbar-card">
        <Space size="middle" wrap>
          <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>聚焦透视员工：</span>
          <Select
            showSearch
            value={selectedMemberId}
            onChange={(val) => onSelectMember(val)}
            style={{ width: 220 }}
            filterOption={(input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            options={members.map((m) => ({
              label: `${m.name}${m.role ? ` (${m.role})` : ''}`,
              value: m.id,
            }))}
          />
          {selectedMember && (
            <Space size="small">
              <Tag color="geekblue" icon={<UserOutlined />}>
                {selectedMember.role || '员工'}
              </Tag>
              {selectedMember.department && (
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  部门：{selectedMember.department}
                </span>
              )}
            </Space>
          )}
        </Space>

        <Space size="middle" wrap>
          <Space size="small">
            <span style={{ fontSize: 12, color: '#64748b' }}>统计周期：</span>
            <Segmented
              size="small"
              value={monthsCount}
              onChange={(val) => onMonthsCountChange(Number(val))}
              options={[
                { label: '近 3 个月', value: 3 },
                { label: '近 6 个月', value: 6 },
                { label: '近 12 个月', value: 12 },
              ]}
            />
          </Space>

          <Segmented
            size="small"
            value={chartMode}
            onChange={(val) => setChartMode(val as 'STACKED' | 'TREND')}
            options={[
              { label: '5板块堆叠分析', value: 'STACKED', icon: <BarChartOutlined /> },
              { label: '实发走势折线', value: 'TREND', icon: <LineChartOutlined /> },
            ]}
          />
        </Space>
      </div>

      {/* 图表与结构分析两栏卡片 */}
      <Row gutter={[16, 16]}>
        {/* 左侧：图表卡片 */}
        <Col span={16}>
          <Card
            title={
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {chartMode === 'STACKED'
                    ? `${selectedMember?.name || '员工'} · 各月薪资板块构成堆叠柱状图`
                    : `${selectedMember?.name || '员工'} · 过往月份实发总薪酬走势折线图`}
                </span>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  （单位：元）
                </Text>
              </div>
            }
            bordered={false}
            className="profit-kpi-card"
          >
            {months.length === 0 ? (
              <Empty description="该员工暂无历史薪资记录" style={{ padding: '48px 0' }} />
            ) : (
              <div className="profit-chart-container">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="profit-chart-svg">
                  {/* 背景网格线 */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = paddingY + innerHeight * (1 - ratio);
                    const val = maxY * ratio;
                    return (
                      <g key={ratio}>
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={chartWidth - paddingX}
                          y2={y}
                          stroke="#e2e8f0"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={paddingX - 10}
                          y={y + 4}
                          textAnchor="end"
                          fill="#94a3b8"
                          fontSize="11"
                          fontFamily="monospace"
                        >
                          ¥{Math.round(val)}
                        </text>
                      </g>
                    );
                  })}

                  {/* 堆叠柱模式 */}
                  {chartMode === 'STACKED' && (
                    <g>
                      {months.map((m, idx) => {
                        const slotWidth = innerWidth / months.length;
                        const barWidth = Math.min(slotWidth - 20, 38);
                        const x = paddingX + slotWidth * idx + (slotWidth - barWidth) / 2;

                        const hBase = (m.baseSalaryAmount / 100 / maxY) * innerHeight;
                        const hComm = (m.commissionAmount / 100 / maxY) * innerHeight;
                        const hBonus = (m.bonusAmount / 100 / maxY) * innerHeight;
                        const hSubsidy = (m.subsidyAmount / 100 / maxY) * innerHeight;
                        const totalH = hBase + hComm + hBonus + hSubsidy;

                        let currentY = paddingY + innerHeight;
                        const yBase = currentY - hBase;
                        currentY = yBase;
                        const yComm = currentY - hComm;
                        currentY = yComm;
                        const yBonus = currentY - hBonus;
                        currentY = yBonus;
                        const ySubsidy = currentY - hSubsidy;

                        const isHover = hoveredMonth?.month === m.month;

                        return (
                          <g
                            key={m.month}
                            style={{
                              cursor: 'pointer',
                              opacity: hoveredMonth && !isHover ? 0.35 : 1,
                              transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={() => setHoveredMonth(m)}
                            onMouseLeave={() => setHoveredMonth(null)}
                          >
                            {/* 当月无数据时的底线空状态标记 */}
                            {totalH === 0 && (
                              <circle
                                cx={x + barWidth / 2}
                                cy={paddingY + innerHeight}
                                r={3}
                                fill="#cbd5e1"
                              />
                            )}

                            {/* 底薪 (Purple) */}
                            {hBase > 0 && (
                              <rect
                                x={x}
                                y={yBase}
                                width={barWidth}
                                height={hBase}
                                fill="#722ed1"
                                rx={hComm === 0 && hBonus === 0 && hSubsidy === 0 ? 4 : 0}
                              />
                            )}
                            {/* 提成 (Emerald) */}
                            {hComm > 0 && (
                              <rect
                                x={x}
                                y={yComm}
                                width={barWidth}
                                height={hComm}
                                fill="#52c41a"
                                rx={hBonus === 0 && hSubsidy === 0 ? 4 : 0}
                              />
                            )}
                            {/* 奖金 (Amber) */}
                            {hBonus > 0 && (
                              <rect
                                x={x}
                                y={yBonus}
                                width={barWidth}
                                height={hBonus}
                                fill="#fa8c16"
                                rx={hSubsidy === 0 ? 4 : 0}
                              />
                            )}
                            {/* 补贴 (Cyan) */}
                            {hSubsidy > 0 && (
                              <rect
                                x={x}
                                y={ySubsidy}
                                width={barWidth}
                                height={hSubsidy}
                                fill="#13c2c2"
                                rx={4}
                              />
                            )}

                            {/* X 轴月份 */}
                            <text
                              x={x + barWidth / 2}
                              y={paddingY + innerHeight + 20}
                              textAnchor="middle"
                              fontSize="12"
                              fill={isHover ? '#1677ff' : '#64748b'}
                              fontWeight={isHover ? 700 : 500}
                            >
                              {m.label}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  )}

                  {/* 折线走势模式 */}
                  {chartMode === 'TREND' && (
                    <g>
                      {(() => {
                        const points = months.map((m, idx) => {
                          const slotWidth = innerWidth / months.length;
                          const x = paddingX + slotWidth * idx + slotWidth / 2;
                          const y = paddingY + innerHeight * (1 - m.totalGrossAmount / 100 / maxY);
                          return { x, y, m };
                        });

                        const pathD = points
                          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                          .join(' ');
                        const areaD = `${pathD} L ${points[points.length - 1].x} ${
                          paddingY + innerHeight
                        } L ${points[0].x} ${paddingY + innerHeight} Z`;

                        return (
                          <>
                            <defs>
                              <linearGradient id="singleTrendGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#1677ff" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#1677ff" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            <path d={areaD} fill="url(#singleTrendGrad)" />
                            <path
                              d={pathD}
                              fill="none"
                              stroke="#1677ff"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                            {points.map((p) => {
                              const isHover = hoveredMonth?.month === p.m.month;
                              return (
                                <g
                                  key={p.m.month}
                                  style={{ cursor: 'pointer' }}
                                  onMouseEnter={() => setHoveredMonth(p.m)}
                                  onMouseLeave={() => setHoveredMonth(null)}
                                >
                                  <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={isHover ? 6 : 4}
                                    fill={isHover ? '#1677ff' : '#ffffff'}
                                    stroke="#1677ff"
                                    strokeWidth="2.5"
                                  />
                                  <text
                                    x={p.x}
                                    y={paddingY + innerHeight + 20}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill={isHover ? '#1677ff' : '#64748b'}
                                    fontWeight={isHover ? 700 : 500}
                                  >
                                    {p.m.label}
                                  </text>
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </g>
                  )}
                </svg>

                {/* 悬停浮窗 Tooltip (定位在绝对右上角，不再跌入文档流) */}
                {hoveredMonth && (
                  <div className="profit-chart-tooltip">
                    <div className="profit-tooltip-header">
                      <span>{hoveredMonth.month} 工资账期</span>
                      <span style={{ color: '#1677ff', fontFamily: 'monospace' }}>
                        实发: ¥{(hoveredMonth.totalGrossAmount / 100).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div className="profit-tooltip-row">
                        <span style={{ color: '#722ed1' }}>● 固定底薪/课酬:</span>
                        <span style={{ fontFamily: 'monospace' }}>
                          ¥{(hoveredMonth.baseSalaryAmount / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="profit-tooltip-row">
                        <span style={{ color: '#52c41a' }}>● 订单提成:</span>
                        <span style={{ fontFamily: 'monospace' }}>
                          ¥{(hoveredMonth.commissionAmount / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="profit-tooltip-row">
                        <span style={{ color: '#fa8c16' }}>● 各类奖金:</span>
                        <span style={{ fontFamily: 'monospace' }}>
                          +¥{(hoveredMonth.bonusAmount / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="profit-tooltip-row">
                        <span style={{ color: '#13c2c2' }}>● 福利津贴:</span>
                        <span style={{ fontFamily: 'monospace' }}>
                          +¥{(hoveredMonth.subsidyAmount / 100).toFixed(2)}
                        </span>
                      </div>
                      {hoveredMonth.deductionAmount > 0 && (
                        <div className="profit-tooltip-row" style={{ color: '#ff4d4f' }}>
                          <span>● 考勤扣除:</span>
                          <span style={{ fontFamily: 'monospace' }}>
                            -¥{(hoveredMonth.deductionAmount / 100).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 图例 (使用 Ant Design 原生 Badge 组件，规整横排) */}
                <div className="profit-chart-legend">
                  <Badge color="#722ed1" text="固定底薪/课酬" />
                  <Badge color="#52c41a" text="订单提成" />
                  <Badge color="#fa8c16" text="各类奖金" />
                  <Badge color="#13c2c2" text="福利津贴" />
                  <Badge color="#ff4d4f" text="各项扣除" />
                  <Badge color="#1677ff" text="实发合计" />
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* 右侧：薪资结构占比 */}
        <Col span={8}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieChartOutlined style={{ color: '#722ed1' }} />
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {selectedMember?.name || '该员工'} · 薪资结构分布
                </span>
              </div>
            }
            bordered={false}
            className="profit-kpi-card"
            style={{ height: '100%' }}
          >
            <div className="profit-structure-container">
              {/* 底薪 */}
              <div className="profit-structure-item">
                <div className="profit-structure-header">
                  <span className="profit-structure-title" style={{ color: '#722ed1' }}>
                    固定底薪 / 课酬 ({basePercent}%)
                  </span>
                  <span className="profit-structure-amount">
                    ¥{(categoryTotals.baseSalaryAmount / 100).toFixed(2)}
                  </span>
                </div>
                <Progress
                  percent={basePercent}
                  strokeColor="#722ed1"
                  showInfo={false}
                  size="small"
                />
              </div>

              {/* 提成 */}
              <div className="profit-structure-item">
                <div className="profit-structure-header">
                  <span className="profit-structure-title" style={{ color: '#52c41a' }}>
                    订单提成 ({commPercent}%)
                  </span>
                  <span className="profit-structure-amount">
                    ¥{(categoryTotals.commissionAmount / 100).toFixed(2)}
                  </span>
                </div>
                <Progress
                  percent={commPercent}
                  strokeColor="#52c41a"
                  showInfo={false}
                  size="small"
                />
              </div>

              {/* 奖金 */}
              <div className="profit-structure-item">
                <div className="profit-structure-header">
                  <span className="profit-structure-title" style={{ color: '#fa8c16' }}>
                    各类奖金 ({bonusPercent}%)
                  </span>
                  <span className="profit-structure-amount">
                    ¥{(categoryTotals.bonusAmount / 100).toFixed(2)}
                  </span>
                </div>
                <Progress
                  percent={bonusPercent}
                  strokeColor="#fa8c16"
                  showInfo={false}
                  size="small"
                />
              </div>

              {/* 津贴 */}
              <div className="profit-structure-item">
                <div className="profit-structure-header">
                  <span className="profit-structure-title" style={{ color: '#13c2c2' }}>
                    福利津贴 ({subsidyPercent}%)
                  </span>
                  <span className="profit-structure-amount">
                    ¥{(categoryTotals.subsidyAmount / 100).toFixed(2)}
                  </span>
                </div>
                <Progress
                  percent={subsidyPercent}
                  strokeColor="#13c2c2"
                  showInfo={false}
                  size="small"
                />
              </div>

              {categoryTotals.deductionAmount > 0 && (
                <div style={{ paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: '#ff4d4f',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <span>累计扣减总额:</span>
                    <span style={{ fontFamily: 'monospace' }}>
                      -¥{(categoryTotals.deductionAmount / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="profit-structure-insight">
                💡 <strong>结构洞察</strong>：
                {commPercent > basePercent
                  ? '该员工提成贡献占比高于固定底薪，属于高绩效、高产出的业绩驱动型收益结构。'
                  : '该员工固定课酬/底薪贡献占比较高，属于高稳定性、底薪课酬保障型收益结构。'}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 历史各月份明细台账 */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>
              {selectedMember?.name || '该员工'} · 过往月份薪资明细台账
            </span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              共 {months.length} 个历史月度账期
            </span>
          </div>
        }
        size="small"
        bordered={false}
        className="profit-kpi-card"
      >
        <Table
          columns={columns}
          dataSource={months}
          rowKey="month"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};
