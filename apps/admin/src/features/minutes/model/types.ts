import type {
  MeetingControllerGetMeetingRecordsPlatform,
  MeetingControllerGetMeetingRecordsType,
  MinuteControllerGetMinutesSource,
  TranscriptParagraphDto,
} from '../../../shared/lib/api/orval/business/schemas';

export interface MinuteMeeting {
  id: string;
  title: string;
  platform: MeetingControllerGetMeetingRecordsPlatform;
  startAt?: string | null;
  endAt?: string | null;
}

export interface Minute {
  id: string;
  externalId?: string | null;
  source: MinuteControllerGetMinutesSource;
  errorMessage?: string | null;
  metadata: unknown;
  meetingId?: string | null;
  meeting?: MinuteMeeting | null;
  recorderUserId?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MinuteListResponse {
  data: Minute[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MinuteListParams {
  search?: string;
  meetingId?: string;
  source?: MinuteControllerGetMinutesSource;
  page?: number;
  limit?: number;
}

export interface RelatedMeeting {
  id: string;
  title: string;
  platform: MeetingControllerGetMeetingRecordsPlatform;
  type: MeetingControllerGetMeetingRecordsType;
  meetingCode?: string | null;
  meetingId: string;
  subMeetingId: string;
  description?: string | null;
  participantCount?: number | null;
  startAt?: string | null;
  endAt?: string | null;
  timezone?: string | null;
}

export interface MeetingParticipantPlatformUser {
  id: string;
  platform: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface MeetingParticipantUser {
  id: string;
  username: string | null;
  email: string | null;
  countryCode: string | null;
  phone: string | null;
  profile: { displayName: string | null; avatar: string | null } | null;
}

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  firstJoinTime: string | null;
  lastLeaveTime: string | null;
  totalDurationSeconds: number | null;
  platformUser: MeetingParticipantPlatformUser | null;
  user: MeetingParticipantUser | null;
}

export interface MeetingParticipantListResponse {
  data: MeetingParticipant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SpeakerSummary {
  id: string;
  minuteId: string;
  platformUserId: string;
  partSummary: string;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SpeakerSummaryListResponse {
  data: SpeakerSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MinuteSummary {
  id: string;
  content: string;
  keyPoints?: unknown;
  actionItems?: unknown;
  decisions?: unknown;
  keywords?: string[];
  createdAt: string;
  updatedAt: string;
}

export type TranscriptSegment = TranscriptParagraphDto;
