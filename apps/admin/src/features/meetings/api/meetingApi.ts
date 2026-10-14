import {
  meetingControllerGetMeetingRecords,
  meetingControllerGetMeetingRecordById,
  meetingControllerDeleteMeetingRecord,
  meetingControllerGetMeetingStats,
  // meetingControllerReprocessMeetingRecord, // 后端接口暂时禁用，见 PR #321
} from '../../../shared/lib/api/orval/business/meetings';
import { mutator } from '../../../shared/lib/api/mutator';
import type {
  Meeting,
  MeetingListParams,
  MeetingListResponse,
  CreateMeetingDto,
  UpdateMeetingDto,
  MeetingStats,
} from '../model/types';

export const meetingApi = {
  list: (params: MeetingListParams): Promise<MeetingListResponse> => {
    return meetingControllerGetMeetingRecords(params) as unknown as Promise<MeetingListResponse>;
  },

  getById: (id: string): Promise<Meeting> => {
    return meetingControllerGetMeetingRecordById(id) as unknown as Promise<Meeting>;
  },

  create: (data: CreateMeetingDto): Promise<Meeting> => {
    return mutator<Meeting>({ url: '/meetings', method: 'POST', data });
  },

  update: (id: string, data: UpdateMeetingDto): Promise<Meeting> => {
    return mutator<Meeting>({ url: `/meetings/${id}`, method: 'PATCH', data });
  },

  delete: (id: string): Promise<void> => {
    return meetingControllerDeleteMeetingRecord(id) as unknown as Promise<void>;
  },

  getStats: (): Promise<MeetingStats> => {
    return meetingControllerGetMeetingStats() as unknown as Promise<MeetingStats>;
  },

  // 后端接口暂时禁用，见 PR #321
  // reprocess: (id: string): Promise<Meeting> => {
  //   return meetingControllerReprocessMeetingRecord(id) as unknown as Promise<Meeting>;
  // },
};
