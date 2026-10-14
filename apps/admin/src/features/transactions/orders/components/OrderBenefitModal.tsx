import {
  ClockCircleOutlined,
  HistoryOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import Alert from 'antd/es/alert';
import Button from 'antd/es/button';
import Card from 'antd/es/card';
import Descriptions from 'antd/es/descriptions';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import InputNumber from 'antd/es/input-number';
import message from 'antd/es/message';
import Modal from 'antd/es/modal';
import Radio from 'antd/es/radio';
import Space from 'antd/es/space';
import Spin from 'antd/es/spin';
import Tag from 'antd/es/tag';
import Timeline from 'antd/es/timeline';
import Typography from 'antd/es/typography';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import { orderApi } from '../api/orderApi';
import type { BenefitAdjustmentType, Order, OrderBenefitAdjustment } from '../types';

const { Text } = Typography;
const { TextArea } = Input;

interface OrderBenefitModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

type ActionType = 'FREEZE' | 'UNFREEZE' | 'EXTENSION';

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN', { hour12: false });
}

function getAdjustmentTag(type: BenefitAdjustmentType) {
  switch (type) {
    case 'FREEZE':
      return <Tag color="error">冻结暂停</Tag>;
    case 'UNFREEZE':
      return <Tag color="success">解冻恢复</Tag>;
    case 'EXTENSION':
      return <Tag color="processing">有效延期</Tag>;
    default:
      return <Tag>{type}</Tag>;
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  const responseMessage = (error as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data?.message;
  return Array.isArray(responseMessage) ? responseMessage.join('；') : responseMessage || fallback;
}

export function OrderBenefitModal({ order, open, onClose }: OrderBenefitModalProps) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [actionType, setActionType] = useState<ActionType>('FREEZE');

  // 查询该订单的权益调整流水
  const {
    data: adjustments = [],
    isLoading,
    refetch,
  } = useQuery<OrderBenefitAdjustment[]>({
    queryKey: ['order-benefit-adjustments', order?.id],
    queryFn: () => (order ? orderApi.getBenefitAdjustments(order.id) : Promise.resolve([])),
    enabled: open && !!order?.id,
  });

  const freezeMutation = useMutation({
    mutationFn: (values: { reason?: string }) => {
      if (!order) throw new Error('No order selected');
      return orderApi.freeze(order.id, values);
    },
    onSuccess: () => {
      message.success('订单已成功冻结');
      form.resetFields();
      refetch();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onClose();
    },
    onError: (error) => {
      message.error(getErrorMessage(error, '冻结失败'));
    },
  });

  const unfreezeMutation = useMutation({
    mutationFn: (values: { reason?: string }) => {
      if (!order) throw new Error('No order selected');
      return orderApi.unfreeze(order.id, values);
    },
    onSuccess: () => {
      message.success('订单已解冻，权益已顺延');
      form.resetFields();
      refetch();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onClose();
    },
    onError: (error) => {
      message.error(getErrorMessage(error, '解冻失败'));
    },
  });

  const extendMutation = useMutation({
    mutationFn: (values: { days: number; reason?: string }) => {
      if (!order) throw new Error('No order selected');
      return orderApi.extend(order.id, values);
    },
    onSuccess: () => {
      message.success('订单已成功延期');
      form.resetFields();
      refetch();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onClose();
    },
    onError: (error) => {
      message.error(getErrorMessage(error, '延期失败'));
    },
  });

  if (!order) return null;

  const isSubmitting =
    freezeMutation.isPending || unfreezeMutation.isPending || extendMutation.isPending;

  const handleActionSubmit = async () => {
    const values = await form.validateFields();
    if (actionType === 'FREEZE') {
      freezeMutation.mutate({ reason: values.reason });
    } else if (actionType === 'UNFREEZE') {
      unfreezeMutation.mutate({ reason: values.reason });
    } else if (actionType === 'EXTENSION') {
      extendMutation.mutate({ days: values.days, reason: values.reason });
    }
  };

  const isPaid = order.status === 'PAID';
  const isFrozen = order.status === 'FROZEN';

  return (
    <Modal
      title={
        <Space>
          <ClockCircleOutlined style={{ color: '#1677ff' }} />
          <span>订单权益调整与冻结记录</span>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 'normal' }}>
            ({order.orderCode})
          </span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={780}
      footer={null}
      destroyOnClose
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 当前权益概况 */}
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="当前订单状态">
            {order.status === 'FROZEN' ? (
              <Tag color="cyan">已冻结 (权益暂停)</Tag>
            ) : order.status === 'PAID' ? (
              <Tag color="processing">已支付 (正常服务)</Tag>
            ) : (
              <Tag>{order.status}</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="购买权益时长">
            <Text strong>{order.durationDays ? `${order.durationDays} 天` : '未设置/永久'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="累计冻结天数">
            <Text strong>{order.frozenDays || 0} 天</Text>
          </Descriptions.Item>
          <Descriptions.Item label="权益开始时间">
            {formatDateTime(order.benefitStart)}
          </Descriptions.Item>
          <Descriptions.Item label="权益结束时间" span={2}>
            <Text strong style={{ color: '#0958d9' }}>
              {formatDateTime(order.benefitEnd)}
            </Text>
          </Descriptions.Item>
        </Descriptions>

        {isFrozen && order.frozenAt && (
          <Alert
            type="warning"
            showIcon
            message="当前订单正处于冻结状态"
            description={`冻结开始于 ${formatDateTime(order.frozenAt)}。在冻结期间，用户无法使用权益，解冻后系统将按实际冻结天数自动顺延到期日。`}
          />
        )}

        {/* 权益调整操作区 */}
        <Card size="small" title="发起权益调整">
          <Space orientation="vertical" style={{ width: '100%' }} size={12}>
            <Radio.Group
              value={actionType}
              onChange={(e) => {
                setActionType(e.target.value);
                form.resetFields();
              }}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="FREEZE" disabled={!isPaid}>
                <PauseCircleOutlined /> 冻结权益
              </Radio.Button>
              <Radio.Button value="UNFREEZE" disabled={!isFrozen}>
                <PlayCircleOutlined /> 解冻恢复
              </Radio.Button>
              <Radio.Button value="EXTENSION" disabled={!isPaid && !isFrozen}>
                <PlusCircleOutlined /> 直接延期
              </Radio.Button>
            </Radio.Group>

            <Form form={form} layout="vertical" initialValues={{ days: 30 }}>
              {actionType === 'FREEZE' && (
                <div>
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message="冻结操作将暂停用户权益，订单状态将变更为 FROZEN。"
                  />
                  <Form.Item
                    name="reason"
                    label="冻结原因"
                    rules={[{ required: true, message: '请输入冻结原因' }]}
                  >
                    <TextArea
                      rows={2}
                      placeholder="如：学员因病请假暂停学习30天"
                      maxLength={200}
                      showCount
                    />
                  </Form.Item>
                </div>
              )}

              {actionType === 'UNFREEZE' && (
                <div>
                  <Alert
                    type="success"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message="解冻操作将恢复用户权益，系统将根据实际冻结时长自动顺延到期日并恢复为已支付状态。"
                  />
                  <Form.Item name="reason" label="解冻备注（可选）">
                    <TextArea
                      rows={2}
                      placeholder="如：学员申请恢复学习"
                      maxLength={200}
                      showCount
                    />
                  </Form.Item>
                </div>
              )}

              {actionType === 'EXTENSION' && (
                <div>
                  <Form.Item
                    name="days"
                    label="延期天数"
                    rules={[{ required: true, message: '请输入延期天数' }]}
                  >
                    <InputNumber min={1} max={3650} addonAfter="天" style={{ width: 180 }} />
                  </Form.Item>
                  <Form.Item name="reason" label="延期原因（可选）">
                    <TextArea
                      rows={2}
                      placeholder="如：系统升级维护补偿36天"
                      maxLength={200}
                      showCount
                    />
                  </Form.Item>
                </div>
              )}

              <Button
                type="primary"
                onClick={handleActionSubmit}
                loading={isSubmitting}
                disabled={
                  (actionType === 'FREEZE' && !isPaid) ||
                  (actionType === 'UNFREEZE' && !isFrozen) ||
                  (actionType === 'EXTENSION' && !isPaid && !isFrozen)
                }
              >
                确认提交
              </Button>
            </Form>
          </Space>
        </Card>

        {/* 调整流水历史 */}
        <Card
          size="small"
          title={
            <Space>
              <HistoryOutlined />
              <span>权益变更历史明细</span>
            </Space>
          }
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Spin />
            </div>
          ) : adjustments.length === 0 ? (
            <Text type="secondary">暂无权益调整记录</Text>
          ) : (
            <Timeline
              style={{ marginTop: 12 }}
              items={adjustments.map((item) => ({
                color: item.type === 'FREEZE' ? 'red' : item.type === 'UNFREEZE' ? 'green' : 'blue',
                children: (
                  <Space orientation="vertical" size={2}>
                    <Space>
                      {getAdjustmentTag(item.type)}
                      {item.days > 0 && <Tag>{`调整 ${item.days} 天`}</Tag>}
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                      </span>
                    </Space>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      <Text type="secondary">到期日变动：</Text>
                      <Text delete>{formatDateTime(item.beforeEnd)}</Text>
                      <span style={{ margin: '0 6px' }}>➔</span>
                      <Text strong style={{ color: '#0958d9' }}>
                        {formatDateTime(item.afterEnd)}
                      </Text>
                    </div>
                    {item.reason && (
                      <div style={{ fontSize: 13, color: '#475569' }}>原因：{item.reason}</div>
                    )}
                    {item.operator?.name && (
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        操作人：{item.operator.name}
                      </div>
                    )}
                  </Space>
                ),
              }))}
            />
          )}
        </Card>
      </div>
    </Modal>
  );
}
