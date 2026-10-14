import { mutator } from '../../../../shared/lib/api/mutator';
import type { ProfitSharingRule, RuleWritePayload } from '../types';

export const ruleApi = {
  list(): Promise<ProfitSharingRule[]> {
    return mutator({ url: '/profit-sharing/rules', method: 'GET' });
  },

  create(data: RuleWritePayload): Promise<void> {
    return mutator({ url: '/profit-sharing/rules', method: 'POST', data });
  },

  getById(id: string): Promise<ProfitSharingRule> {
    return mutator({ url: `/profit-sharing/rules/${id}`, method: 'GET' });
  },

  update(id: string, data: RuleWritePayload): Promise<void> {
    return mutator({ url: `/profit-sharing/rules/${id}`, method: 'PUT', data });
  },

  calculate(
    id: string
  ): Promise<{ success: boolean; processedOrders: number; totalFound: number }> {
    return mutator({ url: `/profit-sharing/rules/${id}/calculate`, method: 'POST' });
  },

  duplicate(id: string, data?: { name?: string; status?: string }): Promise<ProfitSharingRule> {
    return mutator({
      url: `/profit-sharing/rules/${id}/duplicate`,
      method: 'POST',
      data: data || {},
    });
  },

  batchDuplicate(data: {
    ruleIds: string[];
    periodStrategy?: 'NEXT_MONTH' | 'SPECIFIC_MONTH' | 'CUSTOM_RANGE' | 'KEEP';
    targetMonth?: string;
    customStartTime?: string;
    customEndTime?: string;
    nameSuffix?: string;
    status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  }): Promise<{ success: boolean; totalRequested: number; duplicatedCount: number }> {
    return mutator({ url: '/profit-sharing/rules/batch-duplicate', method: 'POST', data });
  },

  delete(id: string): Promise<void> {
    return mutator({ url: `/profit-sharing/rules/${id}`, method: 'DELETE' });
  },

  toggleStatus(id: string): Promise<ProfitSharingRule> {
    return mutator({ url: `/profit-sharing/rules/${id}/status`, method: 'PATCH' });
  },
};
