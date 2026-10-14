import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Radio, Space, Tag, message, Typography } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payslipApi } from './api/payslipApi';
import type { PayslipItemCategory, CreateAdjustmentPayload } from './types';

const { TextArea } = Input;
const { Text } = Typography;

interface PayslipAdjustmentModalProps {
  open: boolean;
  month: string;
  memberId?: string | null;
  memberName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const QUICK_TAGS: Record<PayslipItemCategory, string[]> = {
  BONUS: ['月度全勤奖', '绩效奖金', '销冠特别激励', '优秀员工奖', '项目奖金'],
  SUBSIDY: ['餐费补贴', '交通出行补贴', '通讯话费补贴', '住房津贴', '出差补贴'],
  DEDUCTION: ['迟到早退扣款', '事假缺勤扣除', '考勤扣款', '社保代扣', '其他扣款'],
  BASE_SALARY: ['底薪补发', '课酬基数调整', '岗位薪资补差'],
  COMMISSION: ['特殊订单提成补发'],
};

export const PayslipAdjustmentModal: React.FC<PayslipAdjustmentModalProps> = ({
  open,
  month,
  memberId,
  memberName,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const currentCategory: PayslipItemCategory = Form.useWatch('category', form) || 'BONUS';

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        category: 'BONUS',
        amountYuan: undefined,
      });
    }
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: (payload: CreateAdjustmentPayload) => payslipApi.createAdjustment(payload),
    onSuccess: (res) => {
      message.success(res.message || '录入成功！');
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-payslips'] });
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-payslip-detail'] });
      queryClient.invalidateQueries({ queryKey: ['profit-sharing-records'] });
      onSuccess();
      onClose();
    },
    onError: () => {
      message.error('录入失败，请检查网络后重试');
    },
  });

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (!memberId) {
        message.warning('请先指定员工');
        return;
      }

      mutation.mutate({
        memberId,
        month,
        category: values.category,
        name: values.name.trim(),
        amount: Math.round(Number(values.amountYuan) * 100),
        remark: values.remark?.trim(),
      });
    } catch {
      // Form validation error
    }
  };

  const handleQuickTagClick = (tag: string) => {
    form.setFieldsValue({ name: tag });
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <span>录入当月薪资调整 / 奖惩补贴</span>
          <Tag color="blue">{month}</Tag>
        </div>
      }
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={mutation.isPending}
      okText="确认录入"
      cancelText="取消"
      destroyOnClose
      width={540}
    >
      <div className="py-2 text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded-md">
        当前发放员工：
        <Text strong className="text-gray-800">
          {memberName || memberId || '-'}
        </Text>
        <span className="mx-2">·</span>
        归属月份：
        <Text strong className="text-blue-600">
          {month}
        </Text>
      </div>

      <Form form={form} layout="vertical" initialValues={{ category: 'BONUS' }}>
        <Form.Item
          label="款项类别"
          name="category"
          rules={[{ required: true, message: '请选择款项类别' }]}
        >
          <Radio.Group buttonStyle="solid">
            <Radio.Button value="BONUS">各类奖金</Radio.Button>
            <Radio.Button value="SUBSIDY">福利津贴</Radio.Button>
            <Radio.Button value="DEDUCTION">扣减/扣款</Radio.Button>
            <Radio.Button value="BASE_SALARY">底薪调整</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="常用名称推荐">
          <Space wrap size={[4, 8]}>
            {(QUICK_TAGS[currentCategory] || []).map((tag) => (
              <Tag
                key={tag}
                color="default"
                className="cursor-pointer hover:border-blue-500 hover:text-blue-500 transition-colors"
                onClick={() => handleQuickTagClick(tag)}
              >
                + {tag}
              </Tag>
            ))}
          </Space>
        </Form.Item>

        <Form.Item
          label="款项名称"
          name="name"
          rules={[{ required: true, message: '请输入或选择款项名称' }]}
        >
          <Input placeholder="例如：9月销冠特别激励、餐费补贴、事假缺勤扣除" />
        </Form.Item>

        <Form.Item
          label={
            <span>
              款项金额（元）
              {currentCategory === 'DEDUCTION' && (
                <span className="text-red-500 text-xs ml-2">
                  * 扣减项请输入正数，系统核算时将自动扣除
                </span>
              )}
            </span>
          }
          name="amountYuan"
          rules={[
            { required: true, message: '请输入金额' },
            {
              validator: (_, value) => {
                if (value && Number(value) <= 0) {
                  return Promise.reject(new Error('金额必须大于 0'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            prefix="¥"
            precision={2}
            min={0.01}
            placeholder="0.00"
          />
        </Form.Item>

        <Form.Item label="备注说明（选填）" name="remark">
          <TextArea rows={2} placeholder="可填写发放原因、审批单号或扣减依据" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
