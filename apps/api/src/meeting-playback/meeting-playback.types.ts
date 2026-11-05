export interface PlaybackCaller {
  orgId: string | null;
  userId: string | null;
  apiKeyId?: string | null;
  permissions: string[];
  /** 仅企业微信回调使用。身份来自会话发送人，不来自问题文本。 */
  trustedSession?: boolean;
}

export interface CatchUpPlaybackInput {
  question?: string;
  wecomUserId?: string;
  wecomPlatformUserId?: string;
  teachers?: string[];
  absence?: boolean;
  startAt?: string;
  endAt?: string;
}

export interface PlaybackKeySegment {
  title: string;
  timestamp: string | null;
  takeaway: string;
}

export interface PlaybackFileEntry {
  id: string;
  fileType: string;
  label: string;
}

export interface MeetingPlaybackSession {
  meetingId: string;
  title: string;
  teacherName: string;
  startAt: string;
  endAt: string | null;
  playback: {
    entryPath: string;
    entryUrl: string | null;
    minuteId: string;
    files: PlaybackFileEntry[];
  };
  summary: string | null;
  keySegments: PlaybackKeySegment[];
  catchUp: {
    order: number;
    suggestion: string;
  };
}

export interface MeetingPlaybackCatchUpResult {
  authorized: boolean;
  matched: boolean;
  message: string;
  student: {
    userId: string | null;
    displayName: string | null;
    wecomUserId: string | null;
  } | null;
  range: {
    startAt: string;
    endAt: string;
    timeZone: 'Asia/Shanghai';
  } | null;
  teachers: string[];
  absence: boolean;
  sessions: MeetingPlaybackSession[];
  catchUpPlan: string | null;
  replyText: string;
}

export const UNAUTHORIZED_PLAYBACK_MESSAGE =
  '当前企业微信身份还没有会议回放查看权限。';

export const SESSION_NOT_VISIBLE_MESSAGE = '回放不存在或当前身份无权查看。';
