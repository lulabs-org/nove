import React, { useState } from 'react';
import {
  Table,
  Card,
  Button,
  Tag,
  Space,
  Drawer,
  message,
  Popconfirm,
  Dropdown,
  Alert,
  notification,
} from 'antd';
import {
  PlusOutlined,
  CopyOutlined,
  EditOutlined,
  DownOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { type ColumnsType } from 'antd/es/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ruleApi } from './api/ruleApi';
import { recordApi } from '../records/api/recordApi';
import { RuleForm } from './RuleForm';
import { BatchDuplicateModal } from './BatchDuplicateModal';
import type { ProfitSharingModule, ProfitSharingRule } from './types';
import './RuleList.css';

export const RuleList: React.FC = () => {
  const {
    data: rules,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['profit-sharing-rules'],
    queryFn: () => ruleApi.list(),
  });

  const queryClient = useQueryClient();

  const calculateMutation = useMutation({
    mutationFn: ruleApi.calculate,
    onSuccess: (data: {
      success: boolean;
      processedOrders: number;
      totalFound: number;
      isFixedMonthly?: boolean;
      compensatedRefundOrders?: number;
    }) => {
      if (data.isFixedMonthly) {
        message.success(
          `固定分账计算完成！共检查 ${data.totalFound} 个自然月，生成 ${data.processedOrders} 笔待结算流水。`
        );
      } else {
        const extraInfo =
          data.compensatedRefundOrders && data.compensatedRefundOrders > 0
            ? `，并自动对账补发了 ${data.compensatedRefundOrders} 笔退款回扣流水`
            : '';
        message.success(
          `批量计算与退款对账完成！共匹配 ${data.totalFound} 笔订单（生成 ${data.processedOrders} 笔提成流水）${extraInfo}。`
        );
      }
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-records'] });
      queryClient.invalidateQueries({ queryKey: ['profit-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-payslips'] });
    },
    onError: (error: unknown) => {
      const err = error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };
      message.error(err?.response?.data?.message || '批量计算失败');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => ruleApi.duplicate(id),
    onSuccess: (newRule) => {
      message.success(`规则【${newRule.name}】已成功克隆！`);
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-rules'] });
    },
    onError: () => {
      message.error('规则克隆失败，请稍后重试');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => ruleApi.toggleStatus(id),
    onSuccess: (data) => {
      message.success(data.status === 'ACTIVE' ? '规则已启用！' : '规则已停用！');
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-rules'] });
    },
    onError: () => {
      message.error('切换规则状态失败');
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
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-rules'] });
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ruleApi.delete(id),
    onSuccess: () => {
      message.success('规则已成功删除！');
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-rules'] });
    },
    onError: () => {
      message.error('删除规则失败');
    },
  });

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [copyFromRuleId, setCopyFromRuleId] = useState<string | null>(null);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchModalVisible, setBatchModalVisible] = useState(false);

  const handleEdit = (id: string) => {
    setEditingRuleId(id);
    setCopyFromRuleId(null);
    setDrawerVisible(true);
  };

  const handleCreate = () => {
    setEditingRuleId(null);
    setCopyFromRuleId(null);
    setDrawerVisible(true);
  };

  const handleCopyAndEdit = (id: string) => {
    setEditingRuleId(null);
    setCopyFromRuleId(id);
    setDrawerVisible(true);
  };

  const columns: ColumnsType<ProfitSharingRule> = [
    {
      title: '规则名称与款项板块',
      key: 'name',
      render: (_, record: ProfitSharingRule) => {
        const isFixed = record.ruleType === 'FIXED_MONTHLY';
        const cats = new Set<string>();
        record.modules?.forEach((m) => {
          if (/\[奖金\]|奖|绩效|销冠|全勤|激励|优秀|年终|分红/i.test(m.name)) cats.add('奖金');
          else if (/\[补贴\]|补|津贴|餐|车|房|交通|话费|通讯|差旅|住宿/i.test(m.name))
            cats.add('补贴');
          else if (/\[扣减\]|扣|罚|缺勤|迟到|事假|病假|代扣/i.test(m.name)) cats.add('扣除');
          else cats.add('底薪课酬');
        });

        return (
          <Space direction="vertical" size={2}>
            <span style={{ fontWeight: 500, color: '#1e293b' }}>{record.name}</span>
            <Space size={4} wrap>
              {isFixed ? (
                <Tag color="purple">月度固定薪资/津贴</Tag>
              ) : (
                <Tag color="blue">按单比例分润</Tag>
              )}
              {isFixed &&
                Array.from(cats).map((c) => (
                  <Tag
                    key={c}
                    color={
                      c === '奖金'
                        ? 'gold'
                        : c === '补贴'
                          ? 'cyan'
                          : c === '扣除'
                            ? 'red'
                            : 'geekblue'
                    }
                    style={{ fontSize: 11 }}
                  >
                    {c}
                  </Tag>
                ))}
            </Space>
          </Space>
        );
      },
    },
    {
      title: '生效时间周期',
      key: 'validTime',
      render: (_: string, record: ProfitSharingRule) => {
        const start = dayjs(record.validStartTime);
        const end = dayjs(record.validEndTime);

        if (end.year() >= 2090) {
          return (
            <Space size="small">
              <Tag color="purple">长期有效</Tag>
              <span style={{ color: '#64748b', fontSize: 12 }}>
                自 {start.format('YYYY-MM-DD')} 起
              </span>
            </Space>
          );
        }

        if (start.format('YYYY-MM') === end.format('YYYY-MM')) {
          return (
            <Space size="small">
              <Tag color="cyan">{start.format('YYYY年MM月')}</Tag>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>整月</span>
            </Space>
          );
        }

        return (
          <span style={{ color: '#475569' }}>
            {start.format('YYYY-MM-DD')} ~ {end.format('YYYY-MM-DD')}
          </span>
        );
      },
    },
    {
      title: '配置模块 / 款项',
      key: 'modules',
      render: (_: string, record: ProfitSharingRule) => {
        const isFixed = record.ruleType === 'FIXED_MONTHLY';
        return (
          <Space wrap>
            {record.modules?.map((m: ProfitSharingModule) => {
              if (isFixed) {
                const allocDesc = m.allocations
                  ?.map((a) => {
                    const amount = a.fixedAmount ? (a.fixedAmount / 100).toFixed(2) : '0.00';
                    return `¥${amount}/月`;
                  })
                  .join(', ');

                const isBonus = /\[奖金\]|奖|绩效|销冠|全勤|激励|优秀|年终|分红/i.test(m.name);
                const isSubsidy = /\[补贴\]|补|津贴|餐|车|房|交通|话费|通讯|差旅|住宿/i.test(
                  m.name
                );
                const isDeduction = /\[扣减\]|扣|罚|缺勤|迟到|事假|病假|代扣/i.test(m.name);
                const tagColor = isBonus
                  ? 'gold'
                  : isSubsidy
                    ? 'cyan'
                    : isDeduction
                      ? 'red'
                      : 'purple';

                return (
                  <Tag key={m.id} color={tagColor}>
                    {m.name} {allocDesc ? `(${allocDesc})` : ''}
                  </Tag>
                );
              }

              const ratioStr = `${Number(m.shareRatio || 0) * 100}%`;
              if (m.allocationMode === 'ORDER_OWNER') {
                return (
                  <Tag key={m.id} color="cyan">
                    {m.name} ({ratioStr} 随订单负责人)
                  </Tag>
                );
              }
              if (m.allocationMode === 'FINANCIAL_CLOSER') {
                return (
                  <Tag key={m.id} color="geekblue">
                    {m.name} ({ratioStr} 随订单关单人)
                  </Tag>
                );
              }
              return (
                <Tag key={m.id} color="blue">
                  {m.name} ({ratioStr} 固定比例)
                </Tag>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ProfitSharingRule['status']) => {
        const color = status === 'ACTIVE' ? 'success' : status === 'DRAFT' ? 'default' : 'error';
        const label = status === 'ACTIVE' ? '启用' : status === 'DRAFT' ? '草稿' : '已停用';
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: string, record: ProfitSharingRule) => {
        const isFixed = record.ruleType === 'FIXED_MONTHLY';
        return (
          <Space size="middle">
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => handleEdit(record.id)}
            >
              编辑
            </Button>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'quick',
                    icon: <CopyOutlined />,
                    label: '快速克隆副本',
                    onClick: () => duplicateMutation.mutate(record.id),
                  },
                  {
                    key: 'copy-edit',
                    icon: <EditOutlined />,
                    label: '复制并编辑',
                    onClick: () => handleCopyAndEdit(record.id),
                  },
                ],
              }}
            >
              <Button type="link" size="small" style={{ padding: 0 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  复制 <DownOutlined style={{ fontSize: 9 }} />
                </span>
              </Button>
            </Dropdown>
            <Popconfirm
              title={isFixed ? '确认生成月度固定分账流水？' : '确认执行批量计算？'}
              description={
                isFixed
                  ? '将为生效月份生成待结算流水（已生成的月份自动跳过，不重复发放）。'
                  : '系统将自动核算该规则适用的订单提成，并自动对账补齐退款回扣流水。'
              }
              onConfirm={() => calculateMutation.mutate(record.id)}
              okText="确认计算"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                className="rule-action-btn-calculate"
                style={{ padding: 0 }}
              >
                计算
              </Button>
            </Popconfirm>
            {record.status === 'ACTIVE' ? (
              <Popconfirm
                title="确认停用该规则？"
                description="停用后，关单时将不再匹配该规则。"
                onConfirm={() => toggleStatusMutation.mutate(record.id)}
                okText="确认停用"
                cancelText="取消"
              >
                <Button
                  type="link"
                  size="small"
                  className="rule-action-btn-disable"
                  style={{ padding: 0 }}
                >
                  停用
                </Button>
              </Popconfirm>
            ) : (
              <Popconfirm
                title="确认启用该规则？"
                description="启用后，该规则将在生效期内参与分润计算。"
                onConfirm={() => toggleStatusMutation.mutate(record.id)}
                okText="确认启用"
                cancelText="取消"
              >
                <Button
                  type="link"
                  size="small"
                  className="rule-action-btn-enable"
                  style={{ padding: 0 }}
                >
                  启用
                </Button>
              </Popconfirm>
            )}

            <Popconfirm
              title="确认删除该规则？"
              description="删除后该规则将从列表中移除，已生成的历史分润记录不受影响。"
              onConfirm={() => deleteMutation.mutate(record.id)}
              okText="确认删除"
              okButtonProps={{ danger: true }}
              cancelText="取消"
            >
              <Button type="link" size="small" danger style={{ padding: 0 }}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  const selectedRules = (rules || []).filter((r) => selectedRowKeys.includes(r.id));

  return (
    <div className="p-6">
      <Card
        title="分润规则管理"
        bordered={false}
        className="shadow-sm"
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <Button icon={<CopyOutlined />} onClick={() => setBatchModalVisible(true)}>
                批量复制 ({selectedRowKeys.length})
              </Button>
            )}
            <Button
              icon={<SyncOutlined spin={isReconciling} />}
              onClick={handleReconcile}
              loading={isReconciling}
            >
              退款对账同步
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建规则
            </Button>
          </Space>
        }
      >
        {selectedRowKeys.length > 0 && (
          <Alert
            type="info"
            showIcon
            className="mb-4"
            message={
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>
                  已选择 <strong style={{ color: '#2563eb' }}>{selectedRowKeys.length}</strong>{' '}
                  条规则
                </span>
                <Space>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => setBatchModalVisible(true)}
                  >
                    批量复制
                  </Button>
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
          dataSource={rules || []}
          rowKey="id"
          rowSelection={rowSelection}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Drawer
        title={editingRuleId ? '编辑分润规则' : copyFromRuleId ? '复制并新建规则' : '新建分润规则'}
        width={760}
        onClose={() => {
          setDrawerVisible(false);
          setEditingRuleId(null);
          setCopyFromRuleId(null);
        }}
        open={drawerVisible}
        destroyOnClose
      >
        <RuleForm
          ruleId={editingRuleId}
          copyFromRuleId={copyFromRuleId}
          onSuccess={() => {
            setDrawerVisible(false);
            setEditingRuleId(null);
            setCopyFromRuleId(null);
            refetch();
          }}
          onCancel={() => {
            setDrawerVisible(false);
            setEditingRuleId(null);
            setCopyFromRuleId(null);
          }}
        />
      </Drawer>

      <BatchDuplicateModal
        open={batchModalVisible}
        selectedRules={selectedRules}
        onClose={() => setBatchModalVisible(false)}
        onSuccess={() => {
          setBatchModalVisible(false);
          setSelectedRowKeys([]);
          refetch();
        }}
      />
    </div>
  );
};
