export const TrackingTargetType = {
  USER: 'USER',
  PLATFORM_USER: 'PLATFORM_USER',
  PROJECT: 'PROJECT',
  ORGANIZATION: 'ORGANIZATION',
} as const;

export type TrackingTargetType = (typeof TrackingTargetType)[keyof typeof TrackingTargetType];

export const TrackingReportType = {
  MEETING_SUMMARY: 'MEETING_SUMMARY',
  TRAINING_PLAN: 'TRAINING_PLAN',
  DEVELOPMENT_PLAN: 'DEVELOPMENT_PLAN',
  PROJECT_PROGRESS: 'PROJECT_PROGRESS',
  USER_PROFILE: 'USER_PROFILE',
} as const;

export type TrackingReportType = (typeof TrackingReportType)[keyof typeof TrackingReportType];

export const TrackingCadence = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY',
} as const;

export type TrackingCadence = (typeof TrackingCadence)[keyof typeof TrackingCadence];

export const TrackingSourceType = {
  SPEAKER_SUMMARY: 'SPEAKER_SUMMARY',
  TRACKING_REPORT: 'TRACKING_REPORT',
  DOCUMENT: 'DOCUMENT',
  MEETING: 'MEETING',
} as const;

export type TrackingSourceType = (typeof TrackingSourceType)[keyof typeof TrackingSourceType];
export type GenerationMethod = 'AI' | 'MANUAL';

export const TRACKING_TARGET_TYPE_LABELS: Record<TrackingTargetType, string> = {
  USER: '系统账号',
  PLATFORM_USER: '平台身份',
  PROJECT: '项目',
  ORGANIZATION: '组织',
};

export const TRACKING_REPORT_TYPE_LABELS: Record<TrackingReportType, string> = {
  MEETING_SUMMARY: '会议总结',
  TRAINING_PLAN: '培训计划',
  DEVELOPMENT_PLAN: '培养方案',
  PROJECT_PROGRESS: '项目进度',
  USER_PROFILE: '用户画像',
};

export const TRACKING_CADENCE_LABELS: Record<TrackingCadence, string> = {
  DAILY: '每日',
  WEEKLY: '每周',
  MONTHLY: '每月',
  QUARTERLY: '每季度',
  YEARLY: '每年',
};

export const TRACKING_SOURCE_TYPE_LABELS: Record<TrackingSourceType, string> = {
  SPEAKER_SUMMARY: '发言总结',
  TRACKING_REPORT: '历史报告',
  DOCUMENT: '文档',
  MEETING: '会议',
};

export interface TrackingTargetSummary {
  id: string;
  targetType: TrackingTargetType;
  targetId: string;
  nameSnapshot: string;
}

export interface TrackingTarget extends TrackingTargetSummary {
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingReportSource {
  id: string;
  sourceType: TrackingSourceType;
  sourceId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingReportListItem {
  id: string;
  target: TrackingTargetSummary;
  trackingType: TrackingReportType;
  cadence: TrackingCadence;
  periodKey?: string | null;
  periodStart: string;
  periodEnd: string;
  timezone: string;
  generatedBy?: GenerationMethod | null;
  aiModel?: string | null;
  sourceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingReport extends Omit<TrackingReportListItem, 'target'> {
  target: TrackingTarget;
  content: string;
  sources: TrackingReportSource[];
}

export interface TrackingReportListParams {
  targetType?: TrackingTargetType;
  targetId?: string;
  keyword?: string;
  trackingType?: TrackingReportType;
  cadence?: TrackingCadence;
  periodStart?: string;
  periodEnd?: string;
  page?: number;
  limit?: number;
}

export interface TrackingReportListResponse {
  data: TrackingReportListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TrackingReportSourceInput {
  sourceType: TrackingSourceType;
  sourceId: string;
  metadata?: Record<string, unknown>;
}

export interface CreateTrackingReportDto {
  targetType: TrackingTargetType;
  targetId: string;
  targetName: string;
  targetMetadata?: Record<string, unknown>;
  trackingType: TrackingReportType;
  cadence: TrackingCadence;
  baseDate: string;
  timezone?: string;
  content: string;
  generatedBy?: GenerationMethod;
  aiModel?: string;
  sources?: TrackingReportSourceInput[];
}

export interface UpdateTrackingReportDto {
  content?: string;
  generatedBy?: GenerationMethod | null;
  aiModel?: string | null;
  sources?: TrackingReportSourceInput[];
}
