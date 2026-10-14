import React, { useState } from 'react';
import { Modal, Form, Radio, DatePicker, Input, Select, Alert, message, Typography } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ruleApi } from './api/ruleApi';
import type { ProfitSharingRule } from './types';

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface BatchDuplicateModalProps {
  open: boolean;
  selectedRules: ProfitSharingRule[];
  onClose: () => void;
  onSuccess: () => void;
}

export const BatchDuplicateModal: React.FC<BatchDuplicateModalProps> = ({
  open,
  selectedRules,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [strategy, setStrategy] = useState<
    'NEXT_MONTH' | 'SPECIFIC_MONTH' | 'CUSTOM_RANGE' | 'KEEP'
  >('NEXT_MONTH');

  const queryClient = useQueryClient();

  const batchDuplicateMutation = useMutation({
    mutationFn: ruleApi.batchDuplicate,
    onSuccess: (res) => {
      message.success(`成功批量复制 ${res.duplicatedCount} 条规则！`);
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-rules'] });
      onSuccess();
    },
    onError: () => {
      message.error('批量复制规则失败，请稍后重试');
    },
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      let targetMonth: string | undefined;
      let customStartTime: string | undefined;
      let customEndTime: string | undefined;

      if (strategy === 'SPECIFIC_MONTH') {
        const m: Dayjs = values.targetMonth || dayjs().add(1, 'month');
        targetMonth = m.format('YYYY-MM');
      } else if (strategy === 'CUSTOM_RANGE') {
        const range: [Dayjs, Dayjs] = values.customRange;
        if (!range || range.length < 2) {
          message.error('请选择自定义起止日期');
          return;
        }
        customStartTime = range[0].startOf('day').toISOString();
        customEndTime = range[1].endOf('day').toISOString();
      }

      await batchDuplicateMutation.mutateAsync({
        ruleIds: selectedRules.map((r) => r.id),
        periodStrategy: strategy,
        targetMonth,
        customStartTime,
        customEndTime,
        nameSuffix: values.nameSuffix?.trim() || undefined,
        status: values.status || 'ACTIVE',
      });
    } catch {
      // Form validation failed
    }
  };

  return (
    <Modal
      title="批量复制分润规则"
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={batchDuplicateMutation.isPending}
      okText={`确认复制 (${selectedRules.length})`}
      cancelText="取消"
      width={560}
      destroyOnClose
    >
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message={
          <div>
            已选中 <Text strong>{selectedRules.length}</Text> 条规则进行批量复制：
            <div className="text-xs text-gray-500 mt-1 max-h-24 overflow-y-auto">
              {selectedRules.map((r) => (
                <div key={r.id} className="truncate">
                  • {r.name}
                </div>
              ))}
            </div>
          </div>
        }
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          periodStrategy: 'NEXT_MONTH',
          targetMonth: dayjs().add(1, 'month'),
          status: 'ACTIVE',
        }}
      >
        <Form.Item label="新规则生效周期策略" required>
          <Radio.Group
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="flex flex-col gap-2.5"
          >
            <Radio value="NEXT_MONTH">
              <span className="font-medium">顺延至下月 (推荐)</span>
              <div className="text-xs text-gray-400 pl-6">
                自动顺延 1 个月；名称中的“9月”或“2026-09”会自动智能替换为“10月”或“2026-10”。
              </div>
            </Radio>
            <Radio value="SPECIFIC_MONTH">
              <span className="font-medium">统一指定目标自然月</span>
              <div className="text-xs text-gray-400 pl-6">
                将所有选中规则的生效周期统一设定为指定月份全月。
              </div>
            </Radio>
            <Radio value="CUSTOM_RANGE">
              <span className="font-medium">统一自定义日期区间</span>
              <div className="text-xs text-gray-400 pl-6">指定自定义生效起始日与截止日。</div>
            </Radio>
            <Radio value="KEEP">
              <span className="font-medium">保持原生效周期不变</span>
              <div className="text-xs text-gray-400 pl-6">生效时间与原规则完全一致。</div>
            </Radio>
          </Radio.Group>
        </Form.Item>

        {strategy === 'SPECIFIC_MONTH' && (
          <Form.Item
            name="targetMonth"
            label="选择目标月份"
            rules={[{ required: true, message: '请选择目标自然月' }]}
          >
            <DatePicker picker="month" className="w-full" placeholder="选择目标自然月份" />
          </Form.Item>
        )}

        {strategy === 'CUSTOM_RANGE' && (
          <Form.Item
            name="customRange"
            label="选择生效日期范围"
            rules={[{ required: true, message: '请选择起止日期' }]}
          >
            <RangePicker className="w-full" placeholder={['开始日期', '结束日期']} />
          </Form.Item>
        )}

        <Form.Item
          name="nameSuffix"
          label="规则名称命名规则 (可选)"
          extra="顺延模式下若原名称含月份将优先智能自增，未匹配到月份时或此处置空则默认追加“ (副本)”"
        >
          <Input placeholder="默认智能处理，亦可手动指定后缀如： (202610)" />
        </Form.Item>

        <Form.Item name="status" label="复制后的初始状态">
          <Select
            options={[
              { label: '直接启用 (ACTIVE)', value: 'ACTIVE' },
              { label: '设为草稿 (DRAFT)', value: 'DRAFT' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
