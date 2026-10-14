import { useState } from 'react';
import Alert from 'antd/es/alert';
import DatePicker from 'antd/es/date-picker';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import Modal from 'antd/es/modal';
import Segmented from 'antd/es/segmented';
import message from 'antd/es/message';
import dayjs, { type Dayjs } from 'dayjs';
import { stripeOrderSyncApi } from '../api/stripeOrderSyncApi';

const { RangePicker } = DatePicker;

interface StripeOrderSyncModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

type SyncMode = 'batch' | 'single';

export function StripeOrderSyncModal({ open, onCancel, onSuccess }: StripeOrderSyncModalProps) {
  const [mode, setMode] = useState<SyncMode>('batch');
  const [loading, setLoading] = useState(false);
  const [batchForm] = Form.useForm<{ dateRange?: [Dayjs, Dayjs] }>();
  const [singleForm] = Form.useForm<{ externalId: string }>();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === 'batch') {
        const values = await batchForm.validateFields();
        const dateRange = values.dateRange;
        const startDate = dateRange?.[0] ? dateRange[0].startOf('day').toISOString() : undefined;
        const endDate = dateRange?.[1] ? dateRange[1].endOf('day').toISOString() : undefined;

        await stripeOrderSyncApi.historySync({ startDate, endDate });
        message.success('Stripe 订单同步任务已提交，后台处理完成后可刷新列表查看结果');
        onSuccess();
        onCancel();
      } else {
        const values = await singleForm.validateFields();
        const res = await stripeOrderSyncApi.syncSingle(values.externalId);
        const actionText = res.result?.action === 'created' ? '成功录入新订单' : '成功更新既有订单';
        message.success(`Stripe 单笔同步完成：${actionText}`);
        onSuccess();
        onCancel();
      }
    } catch (error: unknown) {
      const isValidationError = (error as { errorFields?: unknown })?.errorFields;
      if (isValidationError) return; // Antd validation error
      const responseMessage = (error as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      const fallback = '同步请求失败，请检查网络或配置';
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
      title="Stripe 交易订单数据同步"
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
            { label: '按单号即时同步', value: 'single' },
          ]}
        />
      </div>

      <div style={{ display: mode === 'batch' ? 'block' : 'none' }}>
        <Form form={batchForm} layout="vertical">
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="说明：按所选时间范围补充 Stripe 历史订单。提交后将在后台处理，结果不会立即出现在订单列表中。"
          />
          <Form.Item
            label="交易创建时间范围"
            name="dateRange"
            tooltip="留空将拉取全量或从 Stripe 默认最早交易开始分页拉取"
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
            message="输入 Stripe PaymentIntent ID (pi_...)、CheckoutSession ID (cs_...) 或 Charge ID (ch_...)，实时从 Stripe 官方查询最新状态并写入本地系统。"
          />
          <Form.Item
            label="Stripe 外部交易编号"
            name="externalId"
            rules={[{ required: true, message: '请输入 Stripe 交易编号' }]}
          >
            <Input placeholder="例如 pi_3MtwxAEkGgahJuga1V3npDWK 或 cs_live_..." allowClear />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
