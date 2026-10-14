import React, { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Segmented,
  Input,
  Empty,
  Typography,
  Alert,
  Popover,
  Checkbox,
} from 'antd';
import {
  LineChartOutlined,
  BarChartOutlined,
  SearchOutlined,
  ArrowRightOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { HistoricalMonthPoint, MemberHistoricalSeries } from '../../payslips/types';

const { Text } = Typography;

interface MultiMemberCompareViewProps {
  months: HistoricalMonthPoint[];
  memberSeries: MemberHistoricalSeries[];
  monthsCount: number;
  onMonthsCountChange: (count: number) => void;
  onSelectMemberForDrilldown: (memberId: string) => void;
}

// 贝塞尔曲线平滑生成算法
function getSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export const MultiMemberCompareView: React.FC<MultiMemberCompareViewProps> = ({
  months,
  memberSeries,
  monthsCount,
  onMonthsCountChange,
  onSelectMemberForDrilldown,
}) => {
  const [chartSubMode, setChartSubMode] = useState<'LINES' | 'BARS'>('LINES');
  // 快速对比预设: 'TOP5' | 'TOP10' | 'HAS_PROFIT' | 'CUSTOM'
  const [scopePreset, setScopePreset] = useState<'TOP5' | 'TOP10' | 'HAS_PROFIT' | 'CUSTOM'>(
    'TOP5'
  );
  const [customMemberIds, setCustomMemberIds] = useState<string[]>([]);
  const [popoverSearch, setPopoverSearch] = useState<string>('');

  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [onlyShowProfitInTable, setOnlyShowProfitInTable] = useState<boolean>(false);
  const [tablePagination, setTablePagination] = useState({ current: 1, pageSize: 10 });

  // 根据当前预设计算实际对比的成员 ID 列表
  const effectiveMemberIds = useMemo(() => {
    if (scopePreset === 'TOP5') {
      return memberSeries.slice(0, 5).map((m) => m.memberId);
    }
    if (scopePreset === 'TOP10') {
      return memberSeries.slice(0, 10).map((m) => m.memberId);
    }
    if (scopePreset === 'HAS_PROFIT') {
      const profitable = memberSeries.filter((m) => m.totalGrossAmount > 0);
      return (profitable.length > 0 ? profitable : memberSeries.slice(0, 5)).map((m) => m.memberId);
    }
    // CUSTOM
    if (customMemberIds.length > 0) {
      return customMemberIds;
    }
    return memberSeries.slice(0, 5).map((m) => m.memberId);
  }, [scopePreset, customMemberIds, memberSeries]);

  const activeSeries = useMemo(() => {
    return memberSeries.filter((m) => effectiveMemberIds.includes(m.memberId));
  }, [memberSeries, effectiveMemberIds]);

  // 计算最大 Y 轴数值
  const maxY = useMemo(() => {
    if (chartSubMode === 'BARS') {
      const maxVal = Math.max(...activeSeries.map((s) => s.totalGrossAmount / 100), 100);
      return maxVal * 1.15;
    }
    const allVals = activeSeries.flatMap((s) =>
      s.monthlyPoints.map((p) => p.totalGrossAmount / 100)
    );
    const maxVal = Math.max(...allVals, 100);
    return maxVal * 1.15;
  }, [chartSubMode, activeSeries]);

  const chartHeight = 280;
  const chartWidth = 760;
  const paddingX = 60;
  const paddingY = 32;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  // 快捷切换预设
  const handlePresetChange = (val: string) => {
    setScopePreset(val as 'TOP5' | 'TOP10' | 'HAS_PROFIT' | 'CUSTOM');
  };

  // 切换单人勾选
  const handleToggleMember = (id: string) => {
    let next: string[];
    if (effectiveMemberIds.includes(id)) {
      if (effectiveMemberIds.length === 1) return;
      next = effectiveMemberIds.filter((mId) => mId !== id);
    } else {
      next = [...effectiveMemberIds, id];
    }
    setCustomMemberIds(next);
    setScopePreset('CUSTOM');
  };

  const handleSelectAll = () => {
    setCustomMemberIds(memberSeries.map((m) => m.memberId));
    setScopePreset('CUSTOM');
  };

  const handleClearAll = () => {
    if (memberSeries.length > 0) {
      setCustomMemberIds([memberSeries[0].memberId]);
      setScopePreset('CUSTOM');
    }
  };

  // 表格多选框联动
  const handleTableRowSelect = (selectedKeys: React.Key[]) => {
    setCustomMemberIds(selectedKeys as string[]);
    setScopePreset('CUSTOM');
  };

  // Popover 内部搜索过滤
  const popoverFilteredMembers = useMemo(() => {
    if (!popoverSearch.trim()) return memberSeries;
    const kw = popoverSearch.trim().toLowerCase();
    return memberSeries.filter(
      (m) =>
        m.memberName.toLowerCase().includes(kw) ||
        (m.memberRole && m.memberRole.toLowerCase().includes(kw))
    );
  }, [memberSeries, popoverSearch]);

  // 过滤后的表格数据
  const filteredMemberSeries = useMemo(() => {
    let list = memberSeries;
    if (onlyShowProfitInTable) {
      list = list.filter((m) => m.totalGrossAmount > 0);
    }
    if (!searchKeyword.trim()) return list;
    const kw = searchKeyword.trim().toLowerCase();
    return list.filter(
      (m) =>
        m.memberName.toLowerCase().includes(kw) ||
        (m.memberRole && m.memberRole.toLowerCase().includes(kw)) ||
        (m.departmentName && m.departmentName.toLowerCase().includes(kw))
    );
  }, [memberSeries, searchKeyword, onlyShowProfitInTable]);
  const tableCurrentPage = Math.min(
    tablePagination.current,
    Math.max(1, Math.ceil(filteredMemberSeries.length / tablePagination.pageSize))
  );

  // 表格列定义
  const columns = [
    {
      title: '排名',
      key: 'rank',
      width: 65,
      render: (_: unknown, __: unknown, index: number) => {
        const rank = (tableCurrentPage - 1) * tablePagination.pageSize + index + 1;
        const rankClass =
          rank === 1
            ? 'profit-rank-1'
            : rank === 2
              ? 'profit-rank-2'
              : rank === 3
                ? 'profit-rank-3'
                : 'profit-rank-default';
        return <div className={`profit-rank-badge ${rankClass}`}>{rank}</div>;
      },
    },
    {
      title: '成员姓名',
      key: 'name',
      render: (_: unknown, r: MemberHistoricalSeries) => {
        const isCurrentlyCompared = effectiveMemberIds.includes(r.memberId);
        return (
          <Space size="small">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: r.color,
                display: 'inline-block',
                flexShrink: 0,
                opacity: isCurrentlyCompared ? 1 : 0.25,
              }}
            />
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{r.memberName}</span>
            {isCurrentlyCompared && (
              <Tag color="orange" style={{ fontSize: 10, lineHeight: '18px', padding: '0 4px' }}>
                对比中
              </Tag>
            )}
            <Tag color="geekblue" style={{ fontSize: 11 }}>
              {r.memberRole || '员工'}
            </Tag>
            {r.departmentName && (
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{r.departmentName}</span>
            )}
          </Space>
        );
      },
    },
    ...months.map((m, mIdx) => ({
      title: m.label,
      key: m.month,
      render: (_: unknown, r: MemberHistoricalSeries) => {
        const pt = r.monthlyPoints[mIdx];
        const val = pt ? pt.totalGrossAmount / 100 : 0;
        return (
          <span
            style={{
              fontSize: 12,
              fontWeight: val > 0 ? 600 : 400,
              color: val > 0 ? '#1e293b' : '#cbd5e1',
              fontFamily: 'monospace',
            }}
          >
            {val > 0 ? `¥${val.toFixed(0)}` : '-'}
          </span>
        );
      },
    })),
    {
      title: '周期总实发',
      key: 'totalGross',
      sorter: (a: MemberHistoricalSeries, b: MemberHistoricalSeries) =>
        a.totalGrossAmount - b.totalGrossAmount,
      render: (_: unknown, r: MemberHistoricalSeries) => (
        <span className="profit-amount-bold">¥{(r.totalGrossAmount / 100).toFixed(2)}</span>
      ),
    },
    {
      title: '月均实发',
      key: 'avgGross',
      sorter: (a: MemberHistoricalSeries, b: MemberHistoricalSeries) =>
        a.avgMonthlyGross - b.avgMonthlyGross,
      render: (_: unknown, r: MemberHistoricalSeries) => (
        <span style={{ color: '#52c41a', fontWeight: 600, fontFamily: 'monospace' }}>
          ¥{(r.avgMonthlyGross / 100).toFixed(2)}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, r: MemberHistoricalSeries) => (
        <Button
          type="link"
          size="small"
          icon={<ArrowRightOutlined />}
          onClick={() => onSelectMemberForDrilldown(r.memberId)}
        >
          单人透视
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 顶部现代化紧凑控制台（单行高颜值布局，无多余突兀输入框） */}
      <div
        className="profit-toolbar-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {/* 左侧：智能预设分流与自选设置 */}
        <Space size="middle" align="center" wrap>
          <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>对比范围：</span>
          <Segmented
            value={scopePreset}
            onChange={handlePresetChange}
            options={[
              { label: '🏆 TOP 5 标杆', value: 'TOP5' },
              { label: '📊 TOP 10 创收', value: 'TOP10' },
              { label: '💰 仅看有收益成员', value: 'HAS_PROFIT' },
              { label: `🎯 自选人员 (${effectiveMemberIds.length}人)`, value: 'CUSTOM' },
            ]}
          />

          {/* 只有自选对比模式下，提供优雅的 Popover 勾选弹层 */}
          {scopePreset === 'CUSTOM' && (
            <Popover
              trigger="click"
              placement="bottomLeft"
              title={
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600 }}>选择对比人员</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    已选 {effectiveMemberIds.length} 人
                  </span>
                </div>
              }
              content={
                <div style={{ width: 280, padding: '4px 0' }}>
                  <Input
                    placeholder="搜索成员姓名 / 角色..."
                    prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                    size="small"
                    allowClear
                    value={popoverSearch}
                    onChange={(e) => setPopoverSearch(e.target.value)}
                    style={{ marginBottom: 8 }}
                  />
                  <div
                    style={{
                      maxHeight: 220,
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    {popoverFilteredMembers.map((m) => (
                      <Checkbox
                        key={m.memberId}
                        checked={effectiveMemberIds.includes(m.memberId)}
                        onChange={() => handleToggleMember(m.memberId)}
                        style={{ margin: 0, padding: '4px 6px', borderRadius: 4 }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#1e293b' }}>
                          {m.memberName}
                        </span>
                        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>
                          {m.memberRole ? `(${m.memberRole})` : ''} - ¥
                          {(m.totalGrossAmount / 100).toFixed(0)}
                        </span>
                      </Checkbox>
                    ))}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px solid #f1f5f9',
                    }}
                  >
                    <Button size="small" type="link" onClick={handleSelectAll}>
                      全选全部
                    </Button>
                    <Button size="small" type="link" onClick={handleClearAll}>
                      重置单选
                    </Button>
                  </div>
                </div>
              }
            >
              <Button size="small" icon={<SettingOutlined />}>
                筛选人员
              </Button>
            </Popover>
          )}
        </Space>

        {/* 右侧：对比周期与图表展示模式 */}
        <Space size="middle" align="center" wrap>
          <Space size="small">
            <span style={{ fontSize: 12, color: '#64748b' }}>周期：</span>
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
            value={chartSubMode}
            onChange={(val) => setChartSubMode(val as 'LINES' | 'BARS')}
            options={[
              { label: '走势折线', value: 'LINES', icon: <LineChartOutlined /> },
              { label: '天梯排行', value: 'BARS', icon: <BarChartOutlined /> },
            ]}
          />
        </Space>
      </div>

      {/* 提示条（当成员较多时温和引导） */}
      {memberSeries.length > 8 && (
        <Alert
          message={
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 12,
              }}
            >
              <span>
                💡 <strong>防过密清晰机制</strong>：企业共有 <strong>{memberSeries.length}</strong>{' '}
                名成员。当前聚焦对比 <strong>{activeSeries.length}</strong> 位核心成员。
              </span>
              <span style={{ color: '#64748b' }}>您可在下方表格中随时勾选任意人员实时增减对比</span>
            </div>
          }
          type="info"
          showIcon
          style={{ borderRadius: 8, padding: '8px 16px' }}
        />
      )}

      {/* 主对比图表卡片 */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size="middle">
              <span style={{ fontWeight: 600, color: '#1e293b' }}>
                {chartSubMode === 'LINES'
                  ? `核心成员月度实发薪资多曲线对比走势 (${activeSeries.length} 位对比中)`
                  : `核心成员周期内累计实发薪资天梯排行榜 (${activeSeries.length} 位对比中)`}
              </span>
              <Tag color="blue">
                当前展示 {activeSeries.length} / {memberSeries.length} 人
              </Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              （单位：元）
            </Text>
          </div>
        }
        bordered={false}
        className="profit-kpi-card"
      >
        {months.length === 0 ? (
          <Empty description="该周期内暂无历史工资数据" style={{ padding: '48px 0' }} />
        ) : chartSubMode === 'LINES' ? (
          /* ================= 多人多曲线走势对比 ================= */
          <div className="profit-chart-container">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="profit-chart-svg">
              {/* 背景网格线与 Y 轴刻度 */}
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

              {/* 垂直月份网格与底部标签 */}
              {months.map((m, mIdx) => {
                const slotWidth = innerWidth / (months.length - 1 || 1);
                const x = paddingX + slotWidth * mIdx;
                const isHoveredCol = hoveredMonthIndex === mIdx;

                return (
                  <g key={m.month}>
                    {isHoveredCol && (
                      <line
                        x1={x}
                        y1={paddingY}
                        x2={x}
                        y2={paddingY + innerHeight}
                        stroke="#1677ff"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                    )}
                    <text
                      x={x}
                      y={paddingY + innerHeight + 20}
                      textAnchor="middle"
                      fontSize="12"
                      fill={isHoveredCol ? '#1677ff' : '#64748b'}
                      fontWeight={isHoveredCol ? 700 : 500}
                    >
                      {m.label}
                    </text>
                  </g>
                );
              })}

              {/* 每个成员平滑贝塞尔曲线 */}
              {activeSeries.map((s) => {
                const isMemberHovered = hoveredMemberId === s.memberId;
                const opacity = hoveredMemberId && !isMemberHovered ? 0.15 : 1;
                const strokeWidth = isMemberHovered ? 3.5 : 2.2;

                const points = s.monthlyPoints.map((pt, mIdx) => {
                  const slotWidth = innerWidth / (months.length - 1 || 1);
                  const x = paddingX + slotWidth * mIdx;
                  const y = paddingY + innerHeight * (1 - pt.totalGrossAmount / 100 / maxY);
                  return { x, y, pt };
                });

                const pathD = getSmoothPath(points);

                return (
                  <g
                    key={s.memberId}
                    style={{ opacity, transition: 'opacity 0.2s' }}
                    onMouseEnter={() => setHoveredMemberId(s.memberId)}
                    onMouseLeave={() => setHoveredMemberId(null)}
                  >
                    <path
                      d={pathD}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {points.map((p, pIdx) => {
                      const isPtHovered = hoveredMonthIndex === pIdx || isMemberHovered;
                      return (
                        <circle
                          key={pIdx}
                          cx={p.x}
                          cy={p.y}
                          r={isPtHovered ? 5.5 : 3.5}
                          fill={isPtHovered ? s.color : '#ffffff'}
                          stroke={s.color}
                          strokeWidth={2}
                          style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                          onMouseEnter={() => {
                            setHoveredMonthIndex(pIdx);
                            setHoveredMemberId(s.memberId);
                          }}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* 悬停感应热区 */}
              {months.map((_, mIdx) => {
                const colW = innerWidth / months.length;
                const x = paddingX + colW * mIdx;
                return (
                  <rect
                    key={mIdx}
                    x={x}
                    y={paddingY}
                    width={colW}
                    height={innerHeight}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredMonthIndex(mIdx)}
                    onMouseLeave={() => setHoveredMonthIndex(null)}
                  />
                );
              })}
            </svg>

            {/* 悬停当月全员实发横向排名浮窗 */}
            {hoveredMonthIndex !== null && (
              <div className="profit-chart-tooltip" style={{ width: 260 }}>
                <div className="profit-tooltip-header">
                  <span>{months[hoveredMonthIndex]?.month} 账期收益榜</span>
                  <Tag color="blue" style={{ margin: 0 }}>
                    {months[hoveredMonthIndex]?.label}
                  </Tag>
                </div>
                <div
                  style={{
                    maxHeight: 200,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {activeSeries
                    .map((s) => ({
                      member: s,
                      amount: s.monthlyPoints[hoveredMonthIndex]?.totalGrossAmount || 0,
                    }))
                    .sort((a, b) => b.amount - a.amount)
                    .map(({ member, amount }, rank) => (
                      <div
                        key={member.memberId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '2px 4px',
                          borderRadius: 4,
                          background:
                            hoveredMemberId === member.memberId ? '#eff6ff' : 'transparent',
                          fontWeight: hoveredMemberId === member.memberId ? 700 : 400,
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: member.color,
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ color: '#94a3b8', fontSize: 11, width: 14 }}>
                            {rank + 1}.
                          </span>
                          <span style={{ color: '#334155' }}>{member.memberName}</span>
                        </span>
                        <span
                          style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1e293b' }}
                        >
                          ¥{(amount / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================= 柱状天梯排行榜 ================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
            {activeSeries.map((s, idx) => {
              const maxGross = activeSeries[0]?.totalGrossAmount || 1;
              const ratio = Math.max(Math.round((s.totalGrossAmount / maxGross) * 100), 2);
              const isHovered = hoveredMemberId === s.memberId;
              const rankClass =
                idx === 0
                  ? 'profit-rank-1'
                  : idx === 1
                    ? 'profit-rank-2'
                    : idx === 2
                      ? 'profit-rank-3'
                      : 'profit-rank-default';

              return (
                <div
                  key={s.memberId}
                  style={{
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: isHovered ? '#f8fafc' : 'transparent',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={() => setHoveredMemberId(s.memberId)}
                  onMouseLeave={() => setHoveredMemberId(null)}
                  onClick={() => onSelectMemberForDrilldown(s.memberId)}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                      fontSize: 13,
                    }}
                  >
                    <Space size="middle">
                      <span className={`profit-rank-badge ${rankClass}`}>{idx + 1}</span>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{s.memberName}</span>
                      <Tag color="geekblue">{s.memberRole || '员工'}</Tag>
                      {s.departmentName && (
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{s.departmentName}</span>
                      )}
                    </Space>
                    <Space size="large">
                      <span style={{ color: '#64748b', fontSize: 12 }}>
                        月均: ¥{(s.avgMonthlyGross / 100).toFixed(2)}
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: '#1677ff',
                          fontSize: 15,
                          fontFamily: 'monospace',
                        }}
                      >
                        ¥{(s.totalGrossAmount / 100).toFixed(2)}
                      </span>
                    </Space>
                  </div>

                  <div
                    style={{
                      width: '100%',
                      background: '#f1f5f9',
                      height: 10,
                      borderRadius: 9999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${ratio}%`,
                        height: '100%',
                        borderRadius: 9999,
                        backgroundColor: s.color,
                        opacity: hoveredMemberId && !isHovered ? 0.3 : 1,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 下方全员各月实发薪资横向对比一览表（支持复选框自由勾选对比、快速搜索、分页） */}
      <Card
        title={
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <Space size="middle">
              <span style={{ fontWeight: 600, color: '#1e293b' }}>
                全员各月实发薪资横向对比明细表
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                （在表格左侧勾选复选框，可直接加入上方图表对比）
              </span>
            </Space>
            <Space size="middle">
              <Button
                size="small"
                type={onlyShowProfitInTable ? 'primary' : 'default'}
                onClick={() => {
                  setOnlyShowProfitInTable(!onlyShowProfitInTable);
                  setTablePagination((pagination) => ({ ...pagination, current: 1 }));
                }}
              >
                {onlyShowProfitInTable ? '显示全部在册人员' : '仅看有分润人员'}
              </Button>
              <Input
                placeholder="搜索成员姓名 / 部门 / 角色"
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                size="small"
                allowClear
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setTablePagination((pagination) => ({ ...pagination, current: 1 }));
                }}
                style={{ width: 220 }}
              />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                共 {filteredMemberSeries.length} 名成员
              </span>
            </Space>
          </div>
        }
        size="small"
        bordered={false}
        className="profit-kpi-card"
      >
        <Table
          rowSelection={{
            selectedRowKeys: effectiveMemberIds,
            onChange: handleTableRowSelect,
          }}
          columns={columns}
          dataSource={filteredMemberSeries}
          rowKey="memberId"
          pagination={{
            current: tableCurrentPage,
            pageSize: tablePagination.pageSize,
            showSizeChanger: true,
            onChange: (current, pageSize) =>
              setTablePagination((pagination) => ({
                current: pageSize === pagination.pageSize ? current : 1,
                pageSize,
              })),
          }}
          size="small"
        />
      </Card>
    </div>
  );
};
