import { mutator } from '../../../shared/lib/api/mutator';
import type {
  CreateTrackingReportDto,
  TrackingReport,
  TrackingReportListParams,
  TrackingReportListResponse,
  UpdateTrackingReportDto,
} from '../model/types';

const BASE = '/tracking-reports';

export const trackingReportApi = {
  list: (params: TrackingReportListParams): Promise<TrackingReportListResponse> =>
    mutator<TrackingReportListResponse>({ url: BASE, method: 'GET', params }),

  getById: (id: string): Promise<TrackingReport> =>
    mutator<TrackingReport>({ url: `${BASE}/${id}`, method: 'GET' }),

  create: (data: CreateTrackingReportDto): Promise<TrackingReport> =>
    mutator<TrackingReport>({ url: BASE, method: 'POST', data }),

  update: (id: string, data: UpdateTrackingReportDto): Promise<TrackingReport> =>
    mutator<TrackingReport>({ url: `${BASE}/${id}`, method: 'PUT', data }),

  delete: (id: string): Promise<{ success: boolean }> =>
    mutator<{ success: boolean }>({ url: `${BASE}/${id}`, method: 'DELETE' }),
};
