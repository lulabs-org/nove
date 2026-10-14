import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Space,
  Card,
  Switch,
  InputNumber,
  Segmented,
  Row,
  Col,
  Tag,
  Alert,
  message,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { ruleApi } from './api/ruleApi';
import { OrderUserSelect } from '../../transactions/orders/components/OrderUserSelect';
import { OrderProductSelect } from '../../transactions/orders/components/OrderProductSelect';
import { OrderChannelSelect } from '../../transactions/orders/components/OrderChannelSelect';
import type { ProfitSharingModule, RuleType, AllocationMode, RuleWritePayload } from './types';

const { RangePicker } = DatePicker;

export type PeriodMode = 'MONTH' | 'CUSTOM' | 'PERMANENT';

function inferCategoryFromName(
  name?: string
): 'BASE_SALARY' | 'BONUS' | 'SUBSIDY' | 'DEDUCTION' | 'COMMISSION' {
  if (!name) return 'BASE_SALARY';
  if (/\[奖金\]|奖|绩效|销冠|全勤|激励|优秀|年终|分红/i.test(name)) return 'BONUS';
  if (/\[补贴\]|补|津贴|餐|车|房|交通|话费|通讯|差旅|住宿/i.test(name)) return 'SUBSIDY';
  if (/\[扣减\]|扣|罚|缺勤|迟到|事假|病假|代扣/i.test(name)) return 'DEDUCTION';
  return 'BASE_SALARY';
}

interface RuleFormProps {
  ruleId?: string | null;
  copyFromRuleId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface RuleFormAllocation {
  id?: string;
  memberId: string;
  allocationRatio?: number;
  fixedAmountYuan?: number;
}

interface RuleFormModule {
  id?: string;
  name: string;
  category?: 'BASE_SALARY' | 'BONUS' | 'SUBSIDY' | 'DEDUCTION' | 'COMMISSION';
  shareRatio?: number;
  fixedAmountYuan?: number;
  isRefundable?: boolean;
  amortizationType?: 'NONE' | 'MONTHLY' | 'END_OF_TERM';
  allocationMode?: AllocationMode;
  fallbackMemberId?: string;
  allocations?: RuleFormAllocation[];
}

interface RuleFormValues {
  name: string;
  ruleType: RuleType;
  productId?: string;
  channelId?: number;
  periodMode: PeriodMode;
  monthPicker?: Dayjs;
  customRange?: [Dayjs, Dayjs];
  permanentStart?: Dayjs;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  modules?: RuleFormModule[];
}

export const RuleForm: React.FC<RuleFormProps> = ({
  ruleId,
  copyFromRuleId,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [ruleType, setRuleType] = useState<RuleType>('ORDER_PERCENTAGE');
  const [periodMode, setPeriodMode] = useState<PeriodMode>('MONTH');

  const sourceId = ruleId || copyFromRuleId;
  const isCopying = Boolean(copyFromRuleId && !ruleId);

  const modulesValue = Form.useWatch('modules', form) || [];

  const handleAllocationChange = (
    moduleIndex: number,
    allocIndex: number,
    newValue: number | null
  ) => {
    if (newValue === null) return;
    const modules = (form.getFieldValue('modules') || []) as RuleFormModule[];
    const module = modules[moduleIndex];
    if (!module || !module.allocations) return;

    const allocs = [...module.allocations];
    const n = allocs.length;

    if (n === 1) {
      if (newValue !== 100) {
        allocs[0].allocationRatio = 100;
        form.setFieldsValue({ modules });
      }
      return;
    }

    allocs[allocIndex].allocationRatio = newValue;

    const others = allocs.filter((_, idx) => idx !== allocIndex);
    const remainingTarget = Math.max(0, 100 - newValue);
    const othersSum = others.reduce((sum, a) => sum + (a.allocationRatio || 0), 0);

    allocs.forEach((a, idx) => {
      if (idx === allocIndex) return;
      if (othersSum === 0) {
        a.allocationRatio = Number((remainingTarget / (n - 1)).toFixed(2));
      } else {
        a.allocationRatio = Number(
          (((a.allocationRatio || 0) / othersSum) * remainingTarget).toFixed(2)
        );
      }
    });

    // 修复由于 toFixed 导致的精度凑不齐 100 的问题
    const currentSum = allocs.reduce((sum, a) => sum + (a.allocationRatio || 0), 0);
    if (currentSum !== 100 && n > 1) {
      const lastOtherIdx = allocs.length - 1 === allocIndex ? allocs.length - 2 : allocs.length - 1;
      const diff = 100 - currentSum;
      allocs[lastOtherIdx].allocationRatio = Number(
        ((allocs[lastOtherIdx].allocationRatio || 0) + diff).toFixed(2)
      );
    }

    modules[moduleIndex].allocations = allocs;
    form.setFieldsValue({ modules });
  };

  const { mutateAsync: createRule, isPending: isCreating } = useMutation({
    mutationFn: ruleApi.create,
  });

  const { mutateAsync: updateRule, isPending: isUpdating } = useMutation({
    mutationFn: (data: RuleWritePayload) => ruleApi.update(ruleId!, data),
  });

  const { data: ruleData, isLoading: isFetching } = useQuery({
    queryKey: ['profit-sharing-rule', sourceId],
    queryFn: () => ruleApi.getById(sourceId!),
    enabled: !!sourceId,
  });

  React.useEffect(() => {
    if (ruleData) {
      const start = dayjs(ruleData.validStartTime);
      const end = dayjs(ruleData.validEndTime);

      let mode: PeriodMode = 'CUSTOM';
      if (end.year() >= 2090) {
        mode = 'PERMANENT';
      } else if (
        start.format('YYYY-MM') === end.format('YYYY-MM') ||
        (start.date() === 1 &&
          Math.abs(end.diff(start, 'day')) >= 27 &&
          Math.abs(end.diff(start, 'day')) <= 32)
      ) {
        mode = 'MONTH';
      }

      const rType = ruleData.ruleType || 'ORDER_PERCENTAGE';
      setRuleType(rType);
      setPeriodMode(mode);

      form.setFieldsValue({
        name: isCopying ? `${ruleData.name} (副本)` : ruleData.name,
        ruleType: rType,
        productId: ruleData.productId,
        channelId: ruleData.channelId ? Number(ruleData.channelId) : undefined,
        periodMode: mode,
        monthPicker: start,
        customRange: [start, end],
        permanentStart: start,
        status: ruleData.status,
        modules: ruleData.modules?.map((m: ProfitSharingModule) => ({
          id: isCopying ? undefined : m.id,
          name: m.name,
          category: inferCategoryFromName(m.name),
          shareRatio: m.shareRatio !== undefined ? Number(m.shareRatio) * 100 : 0,
          fixedAmountYuan: m.fixedAmount ? m.fixedAmount / 100 : undefined,
          isRefundable: m.isRefundable,
          amortizationType: m.amortizationType ?? 'NONE',
          allocationMode: m.allocationMode || 'FIXED',
          fallbackMemberId:
            m.allocationMode && m.allocationMode !== 'FIXED'
              ? m.allocations?.[0]?.memberId || undefined
              : undefined,
          allocations: m.allocations?.map((a) => ({
            id: isCopying ? undefined : a.id,
            memberId: a.memberId || '',
            allocationRatio:
              a.allocationRatio !== undefined ? Number(a.allocationRatio) * 100 : 100,
            fixedAmountYuan: a.fixedAmount ? a.fixedAmount / 100 : undefined,
          })),
        })),
      });
    } else {
      setRuleType('ORDER_PERCENTAGE');
      setPeriodMode('MONTH');
      form.resetFields();
      form.setFieldsValue({
        ruleType: 'ORDER_PERCENTAGE',
        periodMode: 'MONTH',
        monthPicker: dayjs().startOf('month'),
        modules: [
          {
            name: '关单',
            shareRatio: 4,
            isRefundable: true,
            amortizationType: 'NONE',
            allocationMode: 'FINANCIAL_CLOSER',
            allocations: [],
          },
          {
            name: '运营',
            shareRatio: 3,
            isRefundable: true,
            amortizationType: 'NONE',
            allocationMode: 'ORDER_OWNER',
            allocations: [],
          },
        ],
      });
    }
  }, [ruleData, form, isCopying]);

  const handleRuleTypeChange = (val: RuleType) => {
    setRuleType(val);
    form.setFieldValue('ruleType', val);
    const currentModules = form.getFieldValue('modules') || [];

    if (val === 'FIXED_MONTHLY') {
      form.setFieldsValue({ productId: undefined, channelId: undefined });
      if (!currentModules.length || currentModules[0].shareRatio !== undefined) {
        form.setFieldValue('modules', [
          {
            name: '教师固定课酬',
            isRefundable: false,
            amortizationType: 'NONE',
            allocationMode: 'FIXED',
            allocations: [{ memberId: '', fixedAmountYuan: 5000 }],
          },
        ]);
      }
    } else {
      if (!currentModules.length || currentModules[0].fixedAmountYuan !== undefined) {
        form.setFieldValue('modules', [
          {
            name: '关单',
            shareRatio: 4,
            isRefundable: true,
            amortizationType: 'NONE',
            allocationMode: 'FINANCIAL_CLOSER',
            allocations: [],
          },
          {
            name: '运营',
            shareRatio: 3,
            isRefundable: true,
            amortizationType: 'NONE',
            allocationMode: 'ORDER_OWNER',
            allocations: [],
          },
        ]);
      }
    }
  };

  const queryClient = useQueryClient();

  const onFinish = async (values: RuleFormValues) => {
    try {
      if (ruleType === 'ORDER_PERCENTAGE') {
        const totalModuleRatio =
          values.modules?.reduce(
            (sum: number, m: RuleFormModule) => sum + (m.shareRatio || 0),
            0
          ) || 0;
        if (totalModuleRatio > 100) {
          message.error('各模块占订单总额比例之和不能超过 100%');
          return;
        }

        if (!values.productId && !values.channelId) {
          message.error('按订单比例分润模式下，限制品类和限制渠道必须至少选择一项');
          return;
        }

        for (let mi = 0; mi < (values.modules || []).length; mi++) {
          const mod = values.modules![mi];
          if (!mod.name) {
            message.error(`模块 ${mi + 1} 请输入模块名称`);
            return;
          }
          if ((mod.shareRatio ?? 0) <= 0) {
            message.error(`模块【${mod.name}】占订单总额比例必须大于 0`);
            return;
          }
          if (mod.allocationMode === 'FIXED') {
            if (!mod.allocations || mod.allocations.length === 0) {
              message.error(`模块【${mod.name}】采用固定分配模式，必须至少添加一位收益人`);
              return;
            }
            const allocSum = mod.allocations.reduce((sum, a) => sum + (a.allocationRatio || 0), 0);
            if (allocSum !== 100) {
              message.error(
                `模块【${mod.name}】内各收益人比例之和必须等于 100%（当前为 ${allocSum}%）`
              );
              return;
            }
            for (let ai = 0; ai < mod.allocations.length; ai++) {
              if (!mod.allocations[ai].memberId) {
                message.error(`模块【${mod.name}】第 ${ai + 1} 位收益人未选择`);
                return;
              }
            }
          }
        }
      } else {
        // 月度固定分账模式校验
        if (!values.modules || values.modules.length === 0) {
          message.error('请至少添加一个固定分账款项');
          return;
        }
        for (let mi = 0; mi < values.modules.length; mi++) {
          const mod = values.modules[mi];
          if (!mod.name) {
            message.error(`款项配置 ${mi + 1} 请填写款项名称`);
            return;
          }
          if (!mod.allocations || mod.allocations.length === 0) {
            message.error(`款项【${mod.name}】请至少添加一位收益成员`);
            return;
          }
          for (let ai = 0; ai < mod.allocations.length; ai++) {
            const alloc = mod.allocations[ai];
            if (!alloc.memberId) {
              message.error(`款项【${mod.name}】第 ${ai + 1} 位收益人未选择`);
              return;
            }
            if (!alloc.fixedAmountYuan || alloc.fixedAmountYuan <= 0) {
              message.error(`款项【${mod.name}】收益人每月固定金额必须大于 0`);
              return;
            }
          }
        }
      }

      let validStartTime: string;
      let validEndTime: string;

      if (periodMode === 'MONTH') {
        const month = values.monthPicker || dayjs();
        validStartTime = month.startOf('month').toISOString();
        validEndTime = month.endOf('month').toISOString();
      } else if (periodMode === 'CUSTOM') {
        const range = values.customRange;
        if (!range || range.length < 2) {
          message.error('请选择生效日期范围');
          return;
        }
        validStartTime = range[0].startOf('day').toISOString();
        validEndTime = range[1].endOf('day').toISOString();
      } else {
        const start = values.permanentStart || dayjs();
        validStartTime = start.startOf('day').toISOString();
        validEndTime = dayjs('2099-12-31T23:59:59.999Z').toISOString();
      }

      // 转换数据格式，适应 API 需求
      const payload: RuleWritePayload = {
        name: values.name,
        ruleType,
        productId: ruleType === 'FIXED_MONTHLY' ? undefined : values.productId || undefined,
        channelId:
          ruleType === 'FIXED_MONTHLY'
            ? undefined
            : values.channelId
              ? Number(values.channelId)
              : undefined,
        validStartTime,
        validEndTime,
        status: values.status,
        modules: (values.modules || []).map((m: RuleFormModule) => {
          if (ruleType === 'FIXED_MONTHLY') {
            const totalFixedAmount = (m.allocations || []).reduce(
              (sum, a) => sum + Math.round((a.fixedAmountYuan || 0) * 100),
              0
            );
            let finalName = m.name.trim();
            if (
              m.category === 'BONUS' &&
              !/\[奖金\]|奖|绩效|销冠|全勤|激励|优秀|年终|分红/i.test(finalName)
            ) {
              finalName = `[奖金] ${finalName}`;
            } else if (
              m.category === 'SUBSIDY' &&
              !/\[补贴\]|补|津贴|餐|车|房|交通|话费|通讯|差旅|住宿/i.test(finalName)
            ) {
              finalName = `[补贴] ${finalName}`;
            } else if (
              m.category === 'DEDUCTION' &&
              !/\[扣减\]|扣|罚|缺勤|迟到|事假|病假|代扣/i.test(finalName)
            ) {
              finalName = `[扣减] ${finalName}`;
            }
            return {
              id: m.id,
              name: finalName,
              shareRatio: 0,
              fixedAmount: totalFixedAmount,
              isRefundable: m.isRefundable ?? false,
              amortizationType: m.amortizationType ?? 'NONE',
              allocationMode: 'FIXED' as const,
              allocations: (m.allocations || []).map((a: RuleFormAllocation) => ({
                id: a.id,
                memberId: a.memberId,
                allocationRatio: 1,
                fixedAmount: Math.round((a.fixedAmountYuan || 0) * 100),
              })),
            };
          } else {
            const allocMode = m.allocationMode || 'FIXED';
            let allocs = m.allocations || [];
            if (allocMode !== 'FIXED') {
              allocs = m.fallbackMemberId
                ? [{ memberId: m.fallbackMemberId, allocationRatio: 100 }]
                : [];
            }
            return {
              id: m.id,
              name: m.name,
              shareRatio: (m.shareRatio || 0) / 100, // 从百分比转为小数 (例如 4 -> 0.04)
              isRefundable: m.isRefundable ?? true,
              amortizationType: m.amortizationType ?? 'NONE',
              allocationMode: allocMode,
              allocations: allocs.map((a: RuleFormAllocation) => ({
                id: a.id,
                memberId: a.memberId,
                allocationRatio: (a.allocationRatio || 0) / 100, // 从百分比转为小数
              })),
            };
          }
        }),
      };

      if (ruleId) {
        await updateRule(payload);
        message.success('规则更新成功');
        queryClient.invalidateQueries({ queryKey: ['profit-sharing-rule', ruleId] });
      } else {
        await createRule(payload);
        message.success(isCopying ? '规则复制新建成功' : '规则创建成功');
      }
      onSuccess();
    } catch {
      message.error(ruleId ? '更新失败，请检查填写内容' : '创建失败，请检查填写内容');
    }
  };

  if (isFetching) {
    return <div className="p-10 text-center text-gray-500">加载中...</div>;
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        name: '',
        ruleType: 'ORDER_PERCENTAGE',
        status: 'ACTIVE',
        periodMode: 'MONTH',
        monthPicker: dayjs().startOf('month'),
        modules: [
          {
            name: '关单',
            shareRatio: 4,
            isRefundable: true,
            amortizationType: 'NONE',
            allocationMode: 'FINANCIAL_CLOSER',
            allocations: [],
          },
          {
            name: '运营',
            shareRatio: 3,
            isRefundable: true,
            amortizationType: 'NONE',
            allocationMode: 'ORDER_OWNER',
            allocations: [],
          },
        ],
      }}
    >
      {/* 分账模式：官方原生 Ant Design Segmented，杜绝无样式裸文本 */}
      <Form.Item
        label="分账模式"
        required
        extra={
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
            {ruleType === 'FIXED_MONTHLY'
              ? '每月固定发放底薪、餐补话费津贴、全勤奖等，自动生成流水并归集至工资条'
              : '依每笔订单金额比例提成，支持随订单责任人 / 关单人动态归属'}
          </span>
        }
        style={{ marginBottom: 16 }}
      >
        <Segmented
          block
          size="large"
          value={ruleType}
          onChange={(val) => handleRuleTypeChange(val as RuleType)}
          options={[
            {
              label: <div style={{ padding: '4px 0', fontWeight: 600 }}>按单比例分润</div>,
              value: 'ORDER_PERCENTAGE',
            },
            {
              label: (
                <div style={{ padding: '4px 0', fontWeight: 600 }}>
                  月度固定薪资 / 奖金 / 津贴模式
                </div>
              ),
              value: 'FIXED_MONTHLY',
            },
          ]}
        />
      </Form.Item>

      {/* 规则名称与规则状态 */}
      <Row gutter={16}>
        <Col span={ruleType === 'FIXED_MONTHLY' ? 18 : 24}>
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
            style={{ marginBottom: 16 }}
          >
            <Input
              placeholder={
                ruleType === 'FIXED_MONTHLY'
                  ? '例如：2026年10月高阶讲师月度固定课酬与津贴规则'
                  : '例如：2026年10月训练营默认订单分账提成规则'
              }
            />
          </Form.Item>
        </Col>
        {ruleType === 'FIXED_MONTHLY' && (
          <Col span={6}>
            <Form.Item name="status" label="规则状态" style={{ marginBottom: 16 }}>
              <Select style={{ width: '100%' }}>
                <Select.Option value="ACTIVE">启用</Select.Option>
                <Select.Option value="DRAFT">草稿</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        )}
      </Row>

      {/* 生效周期：原生 Ant Design Row/Col 弹性排布，无文字截断 */}
      <Form.Item
        label="生效周期"
        required
        style={{ marginBottom: 16 }}
        extra={
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
            {periodMode === 'MONTH' && '覆盖自然整月（该月 1 日 00:00:00 至月末 23:59:59）'}
            {periodMode === 'CUSTOM' && '按自然天生效（起止日 00:00:00 至 23:59:59）'}
            {periodMode === 'PERMANENT' && '自生效日起持续生效，每月自动结转，直至手动停用'}
          </span>
        }
      >
        <Row gutter={12} align="middle">
          <Col span={10}>
            <Segmented
              block
              value={periodMode}
              onChange={(val) => {
                const newMode = val as PeriodMode;
                setPeriodMode(newMode);
                form.setFieldValue('periodMode', newMode);
              }}
              options={[
                { label: '按自然月', value: 'MONTH' },
                { label: '起止日期', value: 'CUSTOM' },
                { label: '长期有效', value: 'PERMANENT' },
              ]}
            />
          </Col>
          <Col span={14}>
            {periodMode === 'MONTH' && (
              <Form.Item
                name="monthPicker"
                noStyle
                rules={[{ required: true, message: '请选择生效月份' }]}
              >
                <DatePicker
                  picker="month"
                  style={{ width: '100%' }}
                  placeholder="选择生效月份（如 2026-10）"
                />
              </Form.Item>
            )}

            {periodMode === 'CUSTOM' && (
              <Form.Item
                name="customRange"
                noStyle
                rules={[{ required: true, message: '请选择生效日期范围' }]}
              >
                <RangePicker
                  style={{ width: '100%' }}
                  placeholder={['开始日期', '结束日期']}
                  presets={[
                    {
                      label: '本月',
                      value: [dayjs().startOf('month'), dayjs().endOf('month')],
                    },
                    {
                      label: '下月',
                      value: [
                        dayjs().add(1, 'month').startOf('month'),
                        dayjs().add(1, 'month').endOf('month'),
                      ],
                    },
                    {
                      label: '本季度',
                      value: [
                        dayjs().startOf('day'),
                        dayjs().startOf('day').add(3, 'months').endOf('day'),
                      ],
                    },
                    {
                      label: '半年',
                      value: [
                        dayjs().startOf('day'),
                        dayjs().startOf('day').add(6, 'months').endOf('day'),
                      ],
                    },
                    {
                      label: '1年',
                      value: [
                        dayjs().startOf('day'),
                        dayjs().startOf('day').add(1, 'year').endOf('day'),
                      ],
                    },
                  ]}
                />
              </Form.Item>
            )}

            {periodMode === 'PERMANENT' && (
              <Form.Item
                name="permanentStart"
                noStyle
                rules={[{ required: true, message: '请选择生效开始日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择生效起始日期（长期生效）" />
              </Form.Item>
            )}
          </Col>
        </Row>
      </Form.Item>

      {/* 按单比例分润模式下：品类、渠道与状态 */}
      {ruleType === 'ORDER_PERCENTAGE' && (
        <Row gutter={16}>
          <Col span={10}>
            <Form.Item
              name="productId"
              label="品类选择 (必选其一)"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (value || getFieldValue('channelId')) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('品类和渠道至少必须选择一种'));
                  },
                }),
              ]}
              style={{ marginBottom: 16 }}
            >
              <OrderProductSelect />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item
              name="channelId"
              label="渠道选择 (必选其一)"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (value || getFieldValue('productId')) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('品类和渠道至少必须选择一种'));
                  },
                }),
              ]}
              style={{ marginBottom: 16 }}
            >
              <OrderChannelSelect />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="status" label="状态" style={{ marginBottom: 16 }}>
              <Select style={{ width: '100%' }}>
                <Select.Option value="ACTIVE">启用</Select.Option>
                <Select.Option value="DRAFT">草稿</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      )}

      {/* 动态分润模块配置 */}
      <Form.List name="modules">
        {(fields, { add, remove }) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: '#1f2937' }}>
              {ruleType === 'FIXED_MONTHLY' ? '月度固定分账款项列表' : '各分润模块配置'}
            </div>
            {fields.map(({ key, name, ...restField }) => {
              const currentMod = modulesValue[name] || {};
              const currentAllocMode: AllocationMode = currentMod.allocationMode || 'FIXED';

              return (
                <Card
                  key={key}
                  size="small"
                  title={
                    ruleType === 'FIXED_MONTHLY' ? (
                      <Space size="small">
                        <span style={{ fontWeight: 600, color: '#1f2937' }}>
                          款项配置 {name + 1}
                        </span>
                        <Tag
                          color={
                            (currentMod.category || 'BASE_SALARY') === 'BONUS'
                              ? 'gold'
                              : (currentMod.category || 'BASE_SALARY') === 'SUBSIDY'
                                ? 'cyan'
                                : (currentMod.category || 'BASE_SALARY') === 'DEDUCTION'
                                  ? 'red'
                                  : 'purple'
                          }
                          style={{ margin: 0 }}
                        >
                          {(currentMod.category || 'BASE_SALARY') === 'BONUS'
                            ? '各类奖金'
                            : (currentMod.category || 'BASE_SALARY') === 'SUBSIDY'
                              ? '福利津贴'
                              : (currentMod.category || 'BASE_SALARY') === 'DEDUCTION'
                                ? '各项扣减'
                                : '固定底薪'}
                        </Tag>
                        {currentMod.name && (
                          <span style={{ color: '#8c8c8c', fontSize: 12, fontWeight: 'normal' }}>
                            ({currentMod.name})
                          </span>
                        )}
                      </Space>
                    ) : (
                      <Space size="small">
                        <span style={{ fontWeight: 600, color: '#1f2937' }}>
                          模块配置 {name + 1}
                        </span>
                        {currentMod.name && (
                          <Tag color="blue" style={{ margin: 0 }}>
                            {currentMod.name}
                          </Tag>
                        )}
                        {currentMod.shareRatio ? (
                          <span
                            style={{
                              color: '#1677ff',
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              fontSize: 12,
                            }}
                          >
                            {currentMod.shareRatio}%
                          </span>
                        ) : null}
                      </Space>
                    )
                  }
                  extra={
                    fields.length > 1 && (
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      >
                        删除
                      </Button>
                    )
                  }
                  style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8 }}
                >
                  <Form.Item {...restField} name={[name, 'id']} hidden>
                    <Input />
                  </Form.Item>

                  {ruleType === 'ORDER_PERCENTAGE' ? (
                    <>
                      <Row gutter={12} style={{ marginBottom: 12 }}>
                        <Col span={7}>
                          <Form.Item
                            {...restField}
                            name={[name, 'name']}
                            label="模块名称"
                            rules={[{ required: true, message: '必填' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Input placeholder="如：关单提成、运营服务" />
                          </Form.Item>
                        </Col>
                        <Col span={7}>
                          <Form.Item
                            {...restField}
                            name={[name, 'shareRatio']}
                            label="占订单总额比例 (%)"
                            rules={[{ required: true, message: '必填' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber
                              min={0.01}
                              max={100}
                              precision={2}
                              addonAfter="%"
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'isRefundable']}
                            label="退款时回扣"
                            valuePropName="checked"
                            style={{ marginBottom: 0 }}
                          >
                            <Switch checkedChildren="回扣" unCheckedChildren="不回扣" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            {...restField}
                            name={[name, 'amortizationType']}
                            label="结算模式"
                            style={{ marginBottom: 0 }}
                          >
                            <Select style={{ width: '100%' }}>
                              <Select.Option value="NONE">一次性结算</Select.Option>
                              <Select.Option value="MONTHLY">按月摊销</Select.Option>
                              <Select.Option value="END_OF_TERM">服务结束后结算</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <div
                        style={{
                          background: '#fff',
                          padding: 16,
                          borderRadius: 8,
                          border: '1px solid #e5e7eb',
                          marginTop: 12,
                        }}
                      >
                        <Form.Item
                          {...restField}
                          name={[name, 'allocationMode']}
                          label={
                            <span style={{ fontWeight: 500, color: '#374151' }}>
                              收益人确定方式
                            </span>
                          }
                          style={{ marginBottom: 12 }}
                        >
                          <Segmented
                            value={currentAllocMode}
                            onChange={(val) => {
                              const newModules = [...(form.getFieldValue('modules') || [])];
                              if (newModules[name]) {
                                newModules[name].allocationMode = val as AllocationMode;
                                form.setFieldsValue({ modules: newModules });
                              }
                            }}
                            options={[
                              {
                                label: '随订单负责人 (运营/跟单)',
                                value: 'ORDER_OWNER',
                              },
                              {
                                label: '随订单关单人 (销售/关单)',
                                value: 'FINANCIAL_CLOSER',
                              },
                              {
                                label: '固定人员比例',
                                value: 'FIXED',
                              },
                            ]}
                          />
                        </Form.Item>

                        {currentAllocMode === 'ORDER_OWNER' && (
                          <div>
                            <Alert
                              type="info"
                              showIcon
                              message="按订单区分：每笔订单的该模块分润将 100% 自动归属该订单负责人名下，随订单实际由谁负责动态区分。"
                              style={{ marginBottom: 12 }}
                            />
                            <Form.Item
                              {...restField}
                              name={[name, 'fallbackMemberId']}
                              label="未指定负责人时的兜底人员 (可选)"
                              style={{ marginBottom: 0 }}
                            >
                              <OrderUserSelect placeholder="可选：当订单未填写负责人时由谁接收" />
                            </Form.Item>
                          </div>
                        )}

                        {currentAllocMode === 'FINANCIAL_CLOSER' && (
                          <div>
                            <Alert
                              type="info"
                              showIcon
                              message="按关单人区分：每笔订单的该模块分润将 100% 自动归属该订单录入/关单人名下，随实际促成人员动态区分。"
                              style={{ marginBottom: 12 }}
                            />
                            <Form.Item
                              {...restField}
                              name={[name, 'fallbackMemberId']}
                              label="未指定关单人时的兜底人员 (可选)"
                              style={{ marginBottom: 0 }}
                            >
                              <OrderUserSelect placeholder="可选：当订单未记录关单人时由谁接收" />
                            </Form.Item>
                          </div>
                        )}

                        {currentAllocMode === 'FIXED' && (
                          <div>
                            <div style={{ marginBottom: 8, fontSize: 12, color: '#8c8c8c' }}>
                              指定固定收益人列表及其在模块内的分配占比（总和必须为 100%）：
                            </div>
                            <Form.List name={[name, 'allocations']}>
                              {(allocFields, { add: addAlloc, remove: removeAlloc }) => (
                                <>
                                  {allocFields.map(
                                    ({ key: allocKey, name: allocName, ...restAllocField }) => (
                                      <Space
                                        key={allocKey}
                                        style={{ display: 'flex', width: '100%', marginBottom: 8 }}
                                        align="baseline"
                                      >
                                        <Form.Item
                                          {...restAllocField}
                                          name={[allocName, 'id']}
                                          hidden
                                        >
                                          <Input />
                                        </Form.Item>
                                        <Form.Item
                                          {...restAllocField}
                                          name={[allocName, 'memberId']}
                                          rules={[{ required: true, message: '请选择成员' }]}
                                          style={{ width: 240, marginBottom: 0 }}
                                        >
                                          <OrderUserSelect placeholder="搜索或选择成员" />
                                        </Form.Item>
                                        <Form.Item
                                          {...restAllocField}
                                          name={[allocName, 'allocationRatio']}
                                          rules={[{ required: true, message: '必填' }]}
                                          style={{ marginBottom: 0 }}
                                        >
                                          <InputNumber
                                            min={0}
                                            max={100}
                                            addonAfter="%"
                                            placeholder="比例"
                                            onChange={(val) =>
                                              handleAllocationChange(name, allocName, val)
                                            }
                                          />
                                        </Form.Item>
                                        <Button
                                          type="text"
                                          danger
                                          icon={<MinusCircleOutlined />}
                                          onClick={() => removeAlloc(allocName)}
                                        />
                                      </Space>
                                    )
                                  )}
                                  <Button
                                    type="dashed"
                                    onClick={() => addAlloc({ memberId: '', allocationRatio: 100 })}
                                    block
                                    icon={<PlusOutlined />}
                                    style={{ marginTop: 4 }}
                                  >
                                    添加收益人
                                  </Button>
                                </>
                              )}
                            </Form.List>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <Row gutter={16} style={{ marginBottom: 12 }}>
                        <Col span={8}>
                          <Form.Item
                            {...restField}
                            name={[name, 'category']}
                            label="款项所属板块"
                            rules={[{ required: true, message: '请选择所属板块' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Select
                              placeholder="请选择所属板块"
                              options={[
                                { label: '固定底薪 / 课酬', value: 'BASE_SALARY' },
                                { label: '各类奖金 (绩效/销冠/全勤)', value: 'BONUS' },
                                { label: '福利津贴 (餐补/车补/话费)', value: 'SUBSIDY' },
                                { label: '各项扣减 (考勤/迟到扣款)', value: 'DEDUCTION' },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={16}>
                          <Form.Item
                            {...restField}
                            name={[name, 'name']}
                            label="款项名称"
                            rules={[{ required: true, message: '必填' }]}
                            style={{ marginBottom: 0 }}
                            extra={
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  marginTop: 6,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <span style={{ fontSize: 12, color: '#8c8c8c' }}>常用:</span>
                                {(currentMod.category === 'BONUS'
                                  ? ['月度全勤奖', '月度绩效奖', '销冠特别激励', '优秀员工奖']
                                  : currentMod.category === 'SUBSIDY'
                                    ? ['全员餐费补贴', '交通出行补贴', '通讯话费补贴', '住房津贴']
                                    : currentMod.category === 'DEDUCTION'
                                      ? ['迟到早退扣款', '事假缺勤扣除', '考勤扣款']
                                      : ['主讲教师固定课酬', '月度基本工资', '岗位保底薪资']
                                ).map((tag) => (
                                  <Tag
                                    key={tag}
                                    style={{ cursor: 'pointer', margin: 0 }}
                                    onClick={() => {
                                      form.setFieldValue(['modules', name, 'name'], tag);
                                      const inferred = inferCategoryFromName(tag);
                                      form.setFieldValue(['modules', name, 'category'], inferred);
                                    }}
                                  >
                                    + {tag}
                                  </Tag>
                                ))}
                              </div>
                            }
                          >
                            <Input placeholder="如：主讲教师固定课酬、全员餐费补贴、月度全勤奖" />
                          </Form.Item>
                        </Col>
                      </Row>

                      {/* 固定分账模式下的员工与固定金额 */}
                      <div
                        style={{
                          background: '#fff',
                          padding: 16,
                          borderRadius: 8,
                          border: '1px solid #e5e7eb',
                          marginTop: 12,
                        }}
                      >
                        <div style={{ marginBottom: 10, fontWeight: 500, color: '#374151' }}>
                          <span>收益员工与每月固定发放金额</span>
                          <span
                            style={{
                              fontSize: 12,
                              color: '#8c8c8c',
                              fontWeight: 'normal',
                              marginLeft: 8,
                            }}
                          >
                            （支持为多名成员分别设定独立固定金额）
                          </span>
                        </div>
                        <Form.List name={[name, 'allocations']}>
                          {(allocFields, { add: addAlloc, remove: removeAlloc }) => {
                            const lastAmount =
                              currentMod.allocations && currentMod.allocations.length > 0
                                ? (currentMod.allocations[currentMod.allocations.length - 1]
                                    ?.fixedAmountYuan ?? 5000)
                                : 5000;
                            return (
                              <>
                                {allocFields.map(
                                  ({ key: allocKey, name: allocName, ...restAllocField }) => (
                                    <Space
                                      key={allocKey}
                                      style={{ display: 'flex', width: '100%', marginBottom: 8 }}
                                      align="baseline"
                                    >
                                      <Form.Item
                                        {...restAllocField}
                                        name={[allocName, 'id']}
                                        hidden
                                      >
                                        <Input />
                                      </Form.Item>
                                      <Form.Item
                                        {...restAllocField}
                                        name={[allocName, 'memberId']}
                                        rules={[{ required: true, message: '请选择收益员工' }]}
                                        style={{ width: 240, marginBottom: 0 }}
                                      >
                                        <OrderUserSelect placeholder="搜索或选择收益员工" />
                                      </Form.Item>
                                      <Form.Item
                                        {...restAllocField}
                                        name={[allocName, 'fixedAmountYuan']}
                                        rules={[{ required: true, message: '请输入每月固定金额' }]}
                                        style={{ marginBottom: 0 }}
                                      >
                                        <InputNumber
                                          min={0.01}
                                          precision={2}
                                          prefix="¥"
                                          addonAfter="元/月"
                                          placeholder="如：5000.00"
                                          style={{ width: 180 }}
                                        />
                                      </Form.Item>
                                      <Button
                                        type="text"
                                        danger
                                        icon={<MinusCircleOutlined />}
                                        onClick={() => removeAlloc(allocName)}
                                      />
                                    </Space>
                                  )
                                )}
                                <Button
                                  type="dashed"
                                  onClick={() =>
                                    addAlloc({ memberId: '', fixedAmountYuan: lastAmount })
                                  }
                                  block
                                  icon={<PlusOutlined />}
                                  style={{ marginTop: 4 }}
                                >
                                  添加收益员工
                                </Button>
                              </>
                            );
                          }}
                        </Form.List>
                      </div>
                    </>
                  )}
                </Card>
              );
            })}

            <Button
              type="dashed"
              onClick={() =>
                add(
                  ruleType === 'FIXED_MONTHLY'
                    ? {
                        name: '主讲教师固定课酬',
                        category: 'BASE_SALARY',
                        isRefundable: false,
                        amortizationType: 'NONE',
                        allocationMode: 'FIXED',
                        allocations: [{ memberId: '', fixedAmountYuan: 5000 }],
                      }
                    : {
                        name: '关单提成',
                        shareRatio: 4,
                        isRefundable: true,
                        amortizationType: 'NONE',
                        allocationMode: 'FINANCIAL_CLOSER',
                        allocations: [],
                      }
                )
              }
              block
              icon={<PlusOutlined />}
              style={{ height: 44, color: '#1677ff', borderColor: '#91caff', fontWeight: 500 }}
            >
              {ruleType === 'FIXED_MONTHLY' ? '添加固定分账款项' : '添加分润模块'}
            </Button>
          </div>
        )}
      </Form.List>

      {/* 沉底悬浮操作栏 */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          margin: '24px -24px -24px -24px',
          padding: '12px 24px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          zIndex: 10,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
        }}
      >
        <Button onClick={onCancel} size="middle">
          取消
        </Button>
        <Button type="primary" htmlType="submit" size="middle" loading={isCreating || isUpdating}>
          提交保存
        </Button>
      </div>
    </Form>
  );
};
