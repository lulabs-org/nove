import axios from 'axios';
import {
  minuteControllerDeleteMinute,
  minuteControllerGetMinuteById,
  minuteControllerGetMinutes,
  minuteControllerGetTranscript,
} from '../../../shared/lib/api/orval/business/minute';
import { mutator } from '../../../shared/lib/api/mutator';
import type {
  MeetingParticipantListResponse,
  Minute,
  MinuteListParams,
  MinuteListResponse,
  MinuteSummary,
  RelatedMeeting,
  SpeakerSummaryListResponse,
  TranscriptSegment,
} from '../model/types';
import type { MinuteDriveFile } from '../../drive/model/types';

export const minuteApi = {
  list: (params: MinuteListParams): Promise<MinuteListResponse> =>
    minuteControllerGetMinutes(params) as unknown as Promise<MinuteListResponse>,

  getById: (id: string): Promise<Minute> =>
    minuteControllerGetMinuteById(id) as unknown as Promise<Minute>,

  delete: (id: string): Promise<void> =>
    minuteControllerDeleteMinute(id) as unknown as Promise<void>,

  getTranscript: async (minuteId: string): Promise<TranscriptSegment[]> => {
    try {
      const response = await minuteControllerGetTranscript(minuteId, { includeLocalUser: true });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return [];
      throw error;
    }
  },

  getSummary: async (minuteId: string): Promise<MinuteSummary | null> => {
    try {
      return await mutator<MinuteSummary>({
        url: `/minutes/${minuteId}/summary`,
        method: 'GET',
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  },

  getSpeakerSummaries: (minuteId: string): Promise<SpeakerSummaryListResponse> =>
    mutator<SpeakerSummaryListResponse>({
      url: `/minutes/${minuteId}/speaker-summaries`,
      method: 'GET',
      params: { page: 1, limit: 100 },
    }),

  getMeeting: (meetingId: string): Promise<RelatedMeeting> =>
    mutator<RelatedMeeting>({ url: `/meetings/${meetingId}`, method: 'GET' }),

  getParticipants: (
    meetingId: string,
    params: { page?: number; limit?: number; search?: string } = {}
  ): Promise<MeetingParticipantListResponse> =>
    mutator<MeetingParticipantListResponse>({
      url: `/meetings/${meetingId}/participants`,
      method: 'GET',
      params,
    }),

  getFiles: (minuteId: string): Promise<MinuteDriveFile[]> =>
    mutator<MinuteDriveFile[]>({
      url: `/minutes/${minuteId}/files`,
      method: 'GET',
    }),
};
