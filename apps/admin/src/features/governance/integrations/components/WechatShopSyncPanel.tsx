import { useEffect, useState } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import Button from 'antd/es/button';
import Card from 'antd/es/card';
import DatePicker from 'antd/es/date-picker';
import Form from 'antd/es/form';
import Checkbox from 'antd/es/checkbox';
import Popover from 'antd/es/popover';
import Radio from 'antd/es/radio';
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import Tabs from 'antd/es/tabs';
import Tag from 'antd/es/tag';
import message from 'antd/es/message';
import { useAuth } from '../../../../shared/hooks/useAuth';
import {
  wechatShopSyncApi,
  type WechatSyncKind,
  type WechatSyncTimeField,
  type WechatSyncPeriod,
  type WechatSyncSchedule,
} from '../api/wechatShopSyncApi';

interface SyncValues {
  kind: WechatSyncKind;
  timeField: WechatSyncTimeField;
  dateRange: [Dayjs, Dayjs];
}

interface ScheduleValues {
  kinds: WechatSyncKind[];
  period: WechatSyncPeriod;
  intervalHours: number;
  time: string;
  weekday: number;
}

const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function WechatShopSyncPanel() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<SyncValues>();
  const [scheduleForm] = Form.useForm<ScheduleValues>();
  const period = Form.useWatch('period', scheduleForm);
  const [activeTab, setActiveTab] = useState('manual');
  const [schedule, setSchedule] = useState<WechatSyncSchedule | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const isSuperAdmin = user?.roles.includes('SUPER_ADMIN') ?? false;

  useEffect(() => {
    if (!isSuperAdmin) return;
    let active = true;
    setScheduleLoading(true);
    void wechatShopSyncApi
      .getSchedule()
      .then((value) => {
        if (active) setSchedule(value);
      })
      .catch(() => {
        if (active) message.error('读取定时同步设置失败');
      })
      .finally(() => {
        if (active) setScheduleLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isSuperAdmin]);

  useEffect(() => {
    if (activeTab !== 'schedule') return;
    scheduleForm.setFieldsValue({
      kinds: schedule?.kinds ?? ['orders', 'aftersale'],
      period: schedule?.period ?? 'DAILY',
      intervalHours: schedule?.intervalHours ?? 1,
      time: schedule?.time ?? '02:00',
      weekday: schedule?.weekday ?? 1,
    });
  }, [activeTab, schedule, scheduleForm]);

  const saveSchedule = async () => {
    let values: ScheduleValues;
    try {
      values = await scheduleForm.validateFields();
    } catch {
      return;
    }
    setScheduleSaving(true);
    try {
      const saved = await wechatShopSyncApi.saveSchedule({
        kinds: values.kinds,
        period: values.period,
        ...(values.period === 'HOURLY'
          ? { intervalHours: values.intervalHours }
          : { time: values.time }),
        ...(values.period === 'WEEKLY' ? { weekday: values.weekday } : {}),
      });
      setSchedule(saved);
      message.success('定时同步已保存');
    } catch (error) {
      const detail = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
      message.error(Array.isArray(detail) ? detail.join('；') : detail || '保存定时同步失败');
    } finally {
      setScheduleSaving(false);
    }
  };

  const removeSchedule = async () => {
    setScheduleSaving(true);
    try {
      await wechatShopSyncApi.removeSchedule();
      setSchedule((current) => (current ? { ...current, status: 'PAUSED' } : null));
      message.success('定时同步已关闭');
    } catch {
      message.error('关闭定时同步失败');
    } finally {
      setScheduleSaving(false);
    }
  };
  if (!isSuperAdmin) return null;

  const submit = async () => {
    if (loading) return;
    let values: SyncValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setLoading(true);
    try {
      const response = await wechatShopSyncApi.historySync(values.kind, {
        [values.timeField]: {
          start_time: values.dateRange[0].startOf('day').toISOString(),
          end_time: values.dateRange[1].endOf('day').toISOString(),
        },
      });
      if (!response.success) throw new Error('同步任务提交失败');
      message.success('同步任务已提交，后台处理完成后可刷新对应列表查看结果');
      form.resetFields();
    } catch (error) {
      const detail = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
      message.error(
        Array.isArray(detail) ? detail.join('；') : detail || '同步任务提交失败，请稍后重试'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className="wechat-sync-panel"
      style={{ marginTop: 24 }}
      title={
        <Space size={6}>
          <span>数据同步</span>
          <Popover
            trigger={['hover', 'focus', 'click']}
            placement="top"
            content={
              <div className="integrations-secret-help">
                <div className="integrations-help-section">
                  <div className="integrations-help-section-title">手动同步</div>
                  <div>
                    选择订单或售后单，按创建时间或更新时间补充指定日期范围。单次最多 366
                    天，不受列表筛选条件影响。
                  </div>
                </div>
                <div className="integrations-help-section">
                  <div className="integrations-help-section-title">定时同步</div>
                  <div>
                    可选每 1、6、12
                    小时，或每天、每周在指定北京时间执行。每次按更新时间同步上一周期的数据，并额外回看
                    1 小时；保存后从下一计划时间开始执行。
                  </div>
                </div>
                <div className="integrations-help-section">
                  <div className="integrations-help-section-title">查看结果</div>
                  <div>
                    同步在后台处理。提交成功仅表示任务已下发，可稍后刷新订单列表或订单售后查看数据。
                  </div>
                </div>
              </div>
            }
          >
            <Button
              type="text"
              size="small"
              className="integrations-help-button"
              aria-label="查看微信小店同步说明"
              icon={<QuestionCircleOutlined />}
            />
          </Popover>
        </Space>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'manual',
            label: '手动同步',
            children: (
              <div className="wechat-sync-tab-content">
                <Form
                  form={form}
                  layout="vertical"
                  className="wechat-sync-manual-form"
                  initialValues={{ kind: 'orders', timeField: 'create_time_range' }}
                >
                  <Form.Item label="同步数据" name="kind" rules={[{ required: true }]}>
                    <Radio.Group
                      optionType="button"
                      buttonStyle="solid"
                      options={[
                        { label: '订单', value: 'orders' },
                        { label: '售后单', value: 'aftersale' },
                      ]}
                    />
                  </Form.Item>
                  <div className="wechat-sync-manual-fields">
                    <Form.Item label="时间依据" name="timeField" rules={[{ required: true }]}>
                      <Select
                        options={[
                          { label: '创建时间', value: 'create_time_range' },
                          { label: '更新时间', value: 'update_time_range' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item
                      label="时间范围"
                      name="dateRange"
                      rules={[
                        { required: true, message: '请选择时间范围' },
                        {
                          validator: (_, range?: [Dayjs, Dayjs]) => {
                            if (!range?.[0] || !range[1]) return Promise.resolve();
                            const duration = range[1]
                              .endOf('day')
                              .diff(range[0].startOf('day'), 'second');
                            return duration > 0 && duration <= 366 * 86400
                              ? Promise.resolve()
                              : Promise.reject(
                                  new Error('时间范围须按先后顺序选择，且不能超过 366 天')
                                );
                          },
                        },
                      ]}
                    >
                      <DatePicker.RangePicker
                        style={{ width: '100%' }}
                        placeholder={['开始日期', '结束日期']}
                        presets={[
                          { label: '最近 7 天', value: [dayjs().subtract(6, 'day'), dayjs()] },
                          { label: '最近 30 天', value: [dayjs().subtract(29, 'day'), dayjs()] },
                        ]}
                      />
                    </Form.Item>
                  </div>
                  <div className="wechat-sync-form-footer">
                    <p>任务提交后将在后台处理，可稍后到对应列表查看结果。</p>
                    <Button type="primary" loading={loading} onClick={() => void submit()}>
                      提交同步任务
                    </Button>
                  </div>
                </Form>
              </div>
            ),
          },
          {
            key: 'schedule',
            label: (
              <Space size={6}>
                <span>定时同步</span>
                {schedule && (
                  <Tag color={schedule.status === 'PAUSED' ? 'default' : 'success'}>
                    {schedule.status === 'PAUSED' ? '已关闭' : '运行中'}
                  </Tag>
                )}
              </Space>
            ),
            children: (
              <div className="wechat-sync-tab-content">
                <Form form={scheduleForm} layout="vertical" className="wechat-sync-schedule-form">
                  <Form.Item
                    label="同步数据"
                    name="kinds"
                    rules={[{ required: true, type: 'array', min: 1, message: '至少选择一项数据' }]}
                  >
                    <Checkbox.Group
                      options={[
                        { label: '订单', value: 'orders' },
                        { label: '售后单', value: 'aftersale' },
                      ]}
                    />
                  </Form.Item>
                  <div className="wechat-sync-schedule-fields">
                    <Form.Item label="同步周期" name="period" rules={[{ required: true }]}>
                      <Select
                        options={[
                          { label: '按小时', value: 'HOURLY' },
                          { label: '每天', value: 'DAILY' },
                          { label: '每周', value: 'WEEKLY' },
                        ]}
                      />
                    </Form.Item>
                    {period === 'HOURLY' ? (
                      <Form.Item label="时间频率" name="intervalHours" rules={[{ required: true }]}>
                        <Select
                          options={[
                            { label: '每 1 小时', value: 1 },
                            { label: '每 6 小时', value: 6 },
                            { label: '每 12 小时', value: 12 },
                          ]}
                        />
                      </Form.Item>
                    ) : (
                      <>
                        {period === 'WEEKLY' && (
                          <Form.Item label="星期" name="weekday" rules={[{ required: true }]}>
                            <Select
                              options={weekdayLabels.map((label, value) => ({ label, value }))}
                            />
                          </Form.Item>
                        )}
                        <Form.Item
                          label="执行时间（北京时间）"
                          name="time"
                          rules={[{ required: true }]}
                        >
                          <input type="time" className="wechat-sync-time-input" />
                        </Form.Item>
                      </>
                    )}
                  </div>
                  <div className="wechat-sync-form-footer">
                    <p>每次按更新时间同步上一周期的数据，并额外回看 1 小时。</p>
                    <Space wrap>
                      {schedule && schedule.status !== 'PAUSED' && (
                        <Button
                          danger
                          disabled={scheduleSaving}
                          onClick={() => void removeSchedule()}
                        >
                          关闭定时同步
                        </Button>
                      )}
                      <Button
                        type="primary"
                        loading={scheduleSaving}
                        disabled={scheduleLoading}
                        onClick={() => void saveSchedule()}
                      >
                        {schedule?.status === 'PAUSED'
                          ? '保存并开启'
                          : schedule
                            ? '保存修改'
                            : '开启定时同步'}
                      </Button>
                    </Space>
                  </div>
                </Form>
              </div>
            ),
          },
        ]}
      />
    </Card>
  );
}
