import { describe, expect, it, vi } from 'vitest';
import { mutator } from '../../../shared/lib/api/mutator';
import { qaApi } from './qaApi';

vi.mock('../../../shared/lib/api/mutator', () => ({ mutator: vi.fn() }));

describe('qaApi', () => {
  it('requests records within the selected dataset with its filters', () => {
    qaApi.listRecords({ sessionId: 'session-1', page: 2, keyword: '上线', rating: 'LIKE' });

    expect(mutator).toHaveBeenCalledWith({
      url: '/api/v1/qa/sessions/session-1/records',
      method: 'GET',
      params: { page: 2, keyword: '上线', rating: 'LIKE' },
    });
  });
});
