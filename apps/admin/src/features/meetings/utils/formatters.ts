import type {
  MeetingControllerGetMeetingRecordsPlatform,
  MeetingControllerGetMeetingRecordsStatus,
  MeetingControllerGetMeetingRecordsType,
  MeetingRecordResponseDtoRecordingStatus,
} from '../../../shared/lib/api/orval/business/schemas';

export function formatDateTime(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';

  const date =
    typeof value === 'number'
      ? new Date(value < 1_000_000_000_000 ? value * 1000 : value)
      : new Date(String(value));

  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('zh-CN', { hour12: false });
}

export function formatDuration(seconds?: number | null) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) return '-';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) return `${hours}小时${minutes}分钟`;
  if (minutes > 0) return `${minutes}分钟`;
  return `${remainingSeconds}秒`;
}

export function getProcessingStatusText(
  status?: MeetingControllerGetMeetingRecordsStatus | MeetingRecordResponseDtoRecordingStatus
) {
  const statusMap: Record<string, { text: string; color: string }> = {
    PENDING: { text: '待处理', color: 'blue' },
    RECORDING: { text: '录制中', color: 'processing' },
    PROCESSING: { text: '处理中', color: 'green' },
    COMPLETED: { text: '已完成', color: 'default' },
    FAILED: { text: '失败', color: 'red' },
    SKIPPED: { text: '已跳过', color: 'orange' },
  };
  return status
    ? statusMap[status] || { text: status, color: 'default' }
    : { text: '-', color: 'default' };
}

export function getMeetingPlatformText(type?: MeetingControllerGetMeetingRecordsPlatform) {
  const typeMap: Record<string, string> = {
    TENCENT_MEETING: '腾讯会议',
    ZOOM: 'Zoom',
    TEAMS: 'Teams',
    DINGTALK: '钉钉',
    FEISHU: '飞书',
    WEBEX: 'Webex',
    VOOV: 'Voov',
    OTHER: '其他',
  };
  return typeMap[type || ''] || type || '-';
}

export function getMeetingTypeText(type?: MeetingControllerGetMeetingRecordsType) {
  const typeMap: Record<string, string> = {
    ONE_TIME: '单次会议',
    RECURRING: '周期会议',
    INSTANT: '即时会议',
    SCHEDULED: '预约会议',
    WEBINAR: '网络研讨会',
  };
  return typeMap[type || ''] || type || '-';
}
