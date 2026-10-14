import { mutator } from '../../../../shared/lib/api/mutator';
import { http } from '../../../../shared/lib/api/http';
import type { PayslipListResponse, PayslipDetailResponse } from '../types';

export const payslipApi = {
  list(params?: { month?: string; keyword?: string }): Promise<PayslipListResponse> {
    return mutator({
      url: '/profit-sharing/payslips',
      method: 'GET',
      params,
    });
  },

  getDetail(memberId: string, month?: string): Promise<PayslipDetailResponse> {
    return mutator({
      url: `/profit-sharing/payslips/${memberId}/detail`,
      method: 'GET',
      params: month ? { month } : undefined,
    });
  },

  settle(
    memberId: string,
    month?: string
  ): Promise<{ success: boolean; count: number; message: string }> {
    return mutator({
      url: `/profit-sharing/payslips/${memberId}/settle`,
      method: 'POST',
      params: month ? { month } : undefined,
    });
  },

  createAdjustment(
    payload: import('../types').CreateAdjustmentPayload
  ): Promise<{ success: boolean; recordId: string; message: string }> {
    return mutator({
      url: '/profit-sharing/payslips/adjustments',
      method: 'POST',
      data: payload,
    });
  },

  getHistoricalStats(params?: {
    memberId?: string;
    months?: number;
  }): Promise<import('../types').HistoricalSalaryStatsResponse> {
    return mutator({
      url: '/profit-sharing/payslips/historical-stats',
      method: 'GET',
      params,
    });
  },

  exportCsv(month?: string): Promise<Blob> {
    return http
      .get('/profit-sharing/payslips/export', {
        params: month ? { month } : undefined,
        responseType: 'blob',
      })
      .then((res) => res.data);
  },
};
