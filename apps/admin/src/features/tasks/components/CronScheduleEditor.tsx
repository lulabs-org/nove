import Alert from 'antd/es/alert';
import Input from 'antd/es/input';
import InputNumber from 'antd/es/input-number';
import Segmented from 'antd/es/segmented';
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import TimePicker from 'antd/es/time-picker';
import Typography from 'antd/es/typography';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import {
  buildCronExpression,
  describeCronExpression,
  formatInTimezone,
  getCronError,
  getNextCronRuns,
  inferScheduleDraft,
  type ScheduleDraft,
  type ScheduleMode,
} from '../lib/taskScheduling';

const { Text } = Typography;

const MODE_OPTIONS: Array<{ label: string; value: ScheduleMode }> = [
  { label: '每分钟', value: 'MINUTELY' },
  { label: '每小时', value: 'HOURLY' },
  { label: '每天', value: 'DAILY' },
  { label: '每周', value: 'WEEKLY' },
  { label: '每月', value: 'MONTHLY' },
  { label: '高级', value: 'ADVANCED' },
];

const WEEKDAY_OPTIONS = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 0 },
];

const MONTH_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => ({
  label: `${index + 1} 日`,
  value: index + 1,
}));

interface CronScheduleEditorProps {
  value?: string;
  timezone?: string;
  onChange?: (value: string) => void;
}

export function CronScheduleEditor({
  value,
  timezone = 'Asia/Shanghai',
  onChange,
}: CronScheduleEditorProps) {
  const [draft, setDraft] = useState<ScheduleDraft>(() => inferScheduleDraft(value));

  useEffect(() => {
    setDraft(inferScheduleDraft(value));
  }, [value]);

  const error = useMemo(() => getCronError(value, timezone), [timezone, value]);
  const nextRuns = useMemo(() => getNextCronRuns(value, timezone), [timezone, value]);

  const updateDraft = (patch: Partial<ScheduleDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (next.mode !== 'ADVANCED') onChange?.(buildCronExpression(next));
  };

  const changeMode = (mode: ScheduleMode) => {
    const next = { ...draft, mode };
    setDraft(next);
    if (mode !== 'ADVANCED') onChange?.(buildCronExpression(next));
  };

  const timeValue = dayjs().hour(draft.hour).minute(draft.minute).second(0);

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <Segmented
        block
        value={draft.mode}
        options={MODE_OPTIONS}
        onChange={(mode) => changeMode(mode as ScheduleMode)}
      />

      {draft.mode === 'MINUTELY' ? (
        <Space>
          <Text>每</Text>
          <InputNumber
            min={1}
            max={59}
            value={draft.interval}
            onChange={(interval) => updateDraft({ interval: interval || 1 })}
          />
          <Text>分钟执行一次</Text>
        </Space>
      ) : null}

      {draft.mode === 'HOURLY' ? (
        <Space>
          <Text>每小时第</Text>
          <InputNumber
            min={0}
            max={59}
            value={draft.minute}
            onChange={(minute) => updateDraft({ minute: minute ?? 0 })}
          />
          <Text>分钟执行</Text>
        </Space>
      ) : null}

      {draft.mode === 'DAILY' || draft.mode === 'WEEKLY' || draft.mode === 'MONTHLY' ? (
        <Space orientation="vertical" size="small" style={{ width: '100%' }}>
          {draft.mode === 'WEEKLY' ? (
            <Select
              mode="multiple"
              value={draft.weekdays}
              options={WEEKDAY_OPTIONS}
              placeholder="请选择星期"
              style={{ width: '100%' }}
              onChange={(weekdays) => {
                if (weekdays.length) updateDraft({ weekdays });
              }}
            />
          ) : null}

          {draft.mode === 'MONTHLY' ? (
            <Select
              mode="multiple"
              value={draft.monthDays}
              options={MONTH_DAY_OPTIONS}
              maxTagCount="responsive"
              placeholder="请选择每月日期"
              style={{ width: '100%' }}
              onChange={(monthDays) => {
                if (monthDays.length) updateDraft({ monthDays });
              }}
            />
          ) : null}

          <TimePicker
            value={timeValue}
            format="HH:mm"
            minuteStep={1}
            style={{ width: '100%' }}
            onChange={(time) => {
              if (time) updateDraft({ hour: time.hour(), minute: time.minute() });
            }}
          />
        </Space>
      ) : null}

      {draft.mode === 'ADVANCED' ? (
        <Input
          value={value}
          placeholder="秒 分钟 小时 日 月 星期，例如：0 15 10 * * 1-5"
          onChange={(event) => onChange?.(event.target.value)}
        />
      ) : null}

      <div
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          background: '#f5f5f5',
          fontFamily: 'monospace',
        }}
      >
        {value || '-'}
      </div>

      {error ? (
        <Alert type="error" showIcon title={error} />
      ) : (
        <Alert
          type="success"
          showIcon
          title={describeCronExpression(value)}
          description={
            <div>
              <Text type="secondary">未来 5 次执行时间（{timezone}）</Text>
              {nextRuns.map((date) => (
                <div key={date.toISOString()}>{formatInTimezone(date, timezone)}</div>
              ))}
            </div>
          }
        />
      )}
    </Space>
  );
}
