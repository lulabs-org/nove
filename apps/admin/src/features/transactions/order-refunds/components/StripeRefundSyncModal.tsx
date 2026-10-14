import { useState } from 'react';
import Alert from 'antd/es/alert';
import DatePicker from 'antd/es/date-picker';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import Modal from 'antd/es/modal';
import Segmented from 'antd/es/segmented';
import message from 'antd/es/message';
import dayjs, { type Dayjs } from 'dayjs';
import { stripeRefundSyncApi } from '../api/stripeRefundSyncApi';

const { RangePicker } = DatePicker;

interface StripeRefundSyncModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

type SyncMode = 'batch' | 'single';

export function StripeRefundSyncModal({ open, onCancel, onSuccess }: StripeRefundSyncModalProps) {
  const [mode, setMode] = useState<SyncMode>('batch');
  const [loading, setLoading] = useState(false);
  const [batchForm] = Form.useForm<{ dateRange?: [Dayjs, Dayjs] }>();
  const [singleForm] = Form.useForm<{ refundId: string }>();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === 'batch') {
        const values = await batchForm.validateFields();
        const dateRange = values.dateRange;
        const startDate = dateRange?.[0] ? dateRange[0].startOf('day').toISOString() : undefined;
        const endDate = dateRange?.[1] ? dateRange[1].endOf('day').toISOString() : undefined;

        await stripeRefundSyncApi.historySync({ startDate, endDate });
        message.success('Stripe 退款同步任务已提交，后台处理完成后可刷新列表查看结果');
        onSuccess();
        onCancel();
      } else {
        const values = await singleForm.validateFields();
        const res = await stripeRefundSyncApi.syncSingle(values.refundId);
        message.success(`Stripe 退款单 (${res.result?.afterSaleCode}) 同步成功`);
        onSuccess();
        onCancel();
      }
    } catch (error: unknown) {
      const isValidationError = (error as { errorFields?: unknown })?.errorFields;
      if (isValidationError) return; // Antd validation error
      const responseMessage = (error as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      const fallback = '退款同步请求失败，请检查网络或配置';
      const errorMsg = Array.isArray(responseMessage)
        ? responseMessage.join('；')
        : responseMessage || (error as { message?: string })?.message || fallback;
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    batchForm.resetFields();
    singleForm.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Stripe 售后退款数据同步"
      open={open}
      onOk={handleSubmit}
      onCancel={handleClose}
      confirmLoading={loading}
      okText={mode === 'batch' ? '提交同步任务' : '立即同步单笔'}
      cancelText="取消"
      destroyOnClose
    >
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <Segmented<SyncMode>
          value={mode}
          onChange={(val) => setMode(val)}
          options={[
            { label: '按时间范围批量拉取', value: 'batch' },
            { label: '按退款单号即时同步', value: 'single' },
          ]}
        />
      </div>

      <div style={{ display: mode === 'batch' ? 'block' : 'none' }}>
        <Form form={batchForm} layout="vertical">
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="说明：按所选时间范围补充 Stripe 历史退款并关联本地订单。提交后将在后台处理，结果不会立即出现在退款列表中。"
          />
          <Form.Item
            label="退款创建时间范围"
            name="dateRange"
            tooltip="留空将从 Stripe 默认最早退款开始分页拉取"
          >
            <RangePicker
              style={{ width: '100%' }}
              presets={[
                { label: '最近 7 天', value: [dayjs().subtract(7, 'day'), dayjs()] },
                { label: '最近 30 天', value: [dayjs().subtract(30, 'day'), dayjs()] },
                { label: '本月', value: [dayjs().startOf('month'), dayjs()] },
              ]}
            />
          </Form.Item>
        </Form>
      </div>

      <div style={{ display: mode === 'single' ? 'block' : 'none' }}>
        <Form form={singleForm} layout="vertical">
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="输入 Stripe Refund ID (re_...)，实时从 Stripe 官方查询该笔退款详细信息与状态，并自动关联本地订单写入售后表。"
          />
          <Form.Item
            label="Stripe 退款单号"
            name="refundId"
            rules={[{ required: true, message: '请输入 Stripe 退款单号 (re_...)' }]}
          >
            <Input placeholder="例如 re_1MtwyBEkGgahJugaV63x03gA" allowClear />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
