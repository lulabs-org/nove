import Col from 'antd/es/col';
import DatePicker from 'antd/es/date-picker';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import InputNumber from 'antd/es/input-number';
import Modal from 'antd/es/modal';
import Row from 'antd/es/row';
import Select from 'antd/es/select';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import type { CreateMeetingDto, Meeting, UpdateMeetingDto } from '../model/types';

interface FormValues {
  platform?: CreateMeetingDto['platform'];
  platformMeetingId?: string;
  title?: string;
  meetingCode?: string;
  type?: CreateMeetingDto['type'];
  hostUserId?: string;
  timeRange?: [Dayjs, Dayjs];
  participantCount?: number;
}

interface Props {
  open: boolean;
  meeting?: Meeting | null;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (data: CreateMeetingDto | UpdateMeetingDto) => void;
}

const PLATFORM_OPTIONS = [
  ['腾讯会议', 'TENCENT_MEETING'],
  ['飞书', 'FEISHU'],
  ['Zoom', 'ZOOM'],
  ['Teams', 'TEAMS'],
  ['钉钉', 'DINGTALK'],
  ['Webex', 'WEBEX'],
  ['Voov', 'VOOV'],
  ['其他', 'OTHER'],
].map(([label, value]) => ({ label, value }));

const TYPE_OPTIONS = [
  ['单次会议', 'ONE_TIME'],
  ['周期会议', 'RECURRING'],
  ['即时会议', 'INSTANT'],
  ['预约会议', 'SCHEDULED'],
  ['网络研讨会', 'WEBINAR'],
].map(([label, value]) => ({ label, value }));

export function MeetingFormModal({ open, meeting, submitting, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      meeting
        ? {
            platform: meeting.platform,
            platformMeetingId: meeting.meetingId,
            title: meeting.title,
            meetingCode: meeting.meetingCode ?? undefined,
            type: meeting.type,
            hostUserId: meeting.host?.platformUserId ?? undefined,
            timeRange:
              meeting.startAt && meeting.endAt
                ? [dayjs(meeting.startAt), dayjs(meeting.endAt)]
                : undefined,
            participantCount: meeting.participantCount ?? undefined,
          }
        : {
            platform: 'TENCENT_MEETING',
            type: 'SCHEDULED',
          }
    );
  }, [form, meeting, open]);

  const submit = async () => {
    const values = await form.validateFields();
    const shared = {
      title: values.title?.trim(),
      meetingCode: values.meetingCode?.trim() || undefined,
      type: values.type,
      hostUserId: values.hostUserId?.trim() || undefined,
      actualStartAt: values.timeRange?.[0].toISOString(),
      endedAt: values.timeRange?.[1].toISOString(),
      durationSeconds:
        values.timeRange?.[0] && values.timeRange?.[1]
          ? Math.max(0, values.timeRange[1].diff(values.timeRange[0], 'second'))
          : undefined,
    };

    if (meeting) {
      onSubmit({ ...shared, participantCount: values.participantCount } as UpdateMeetingDto);
      return;
    }

    onSubmit({
      ...shared,
      platform: values.platform,
      platformMeetingId: values.platformMeetingId?.trim(),
    } as CreateMeetingDto);
  };

  return (
    <Modal
      title={meeting ? '编辑会议' : '新增会议'}
      open={open}
      width={760}
      okText="保存"
      cancelText="取消"
      confirmLoading={submitting}
      onOk={submit}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="title" label="会议标题" rules={[{ required: true, whitespace: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="platformMeetingId"
              label="平台会议 ID"
              rules={[{ required: !meeting }]}
            >
              <Input disabled={!!meeting} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="platform" label="会议平台" rules={[{ required: true }]}>
              <Select disabled={!!meeting} options={PLATFORM_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="type" label="会议类型" rules={[{ required: true }]}>
              <Select options={TYPE_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="meetingCode" label="会议号">
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="timeRange" label="实际会议时间">
              <DatePicker.RangePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="hostUserId" label="主持人平台身份 ID">
              <Input />
            </Form.Item>
          </Col>
          {meeting ? (
            <Col span={12}>
              <Form.Item name="participantCount" label="参会人数">
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          ) : null}
        </Row>
      </Form>
    </Modal>
  );
}
