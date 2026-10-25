import { mutator } from '../../../shared/lib/api/mutator';

export type QATargetType = 'GLOBAL' | 'PROJECT' | 'MINUTE' | 'DRIVE_FILE';
export type QAGeneratedBy = 'AI' | 'HUMAN' | 'SYSTEM';
export type QAFeedbackRating = 'LIKE' | 'DISLIKE';

export interface QASession {
  id: string;
  title: string;
  targetType: QATargetType;
  targetId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QACitation {
  id: string;
  sourceType: string;
  sourceId: string;
  title: string | null;
  location: string | null;
  snippet: string;
  relevanceScore: number | null;
}

export interface QARecord {
  id: string;
  sessionId: string;
  question: string;
  answer: string;
  generatedBy: QAGeneratedBy;
  aiModel: string | null;
  rating: QAFeedbackRating | null;
  citations: QACitation[];
  createdAt: string;
  updatedAt: string;
}

interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateSessionInput {
  title: string;
  targetType?: QATargetType;
  targetId?: string;
}

export interface CreateRecordInput {
  question: string;
  answer: string;
  generatedBy?: QAGeneratedBy;
  aiModel?: string;
  citations?: Array<{
    sourceType: string;
    sourceId: string;
    title?: string;
    snippet: string;
  }>;
}

export interface RecordListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  rating?: QAFeedbackRating;
  sessionId?: string;
}

export const qaApi = {
  listSessions(): Promise<PageResult<QASession>> {
    return mutator({
      url: '/api/v1/qa/sessions',
      method: 'GET',
      params: { page: 1, pageSize: 100 },
    });
  },

  createSession(data: CreateSessionInput): Promise<QASession> {
    return mutator({ url: '/api/v1/qa/sessions', method: 'POST', data });
  },

  listRecords(params: RecordListParams): Promise<PageResult<QARecord>> {
    return mutator({ url: '/api/v1/qa/records', method: 'GET', params });
  },

  createRecord(sessionId: string, data: CreateRecordInput): Promise<QARecord> {
    return mutator({
      url: `/api/v1/qa/sessions/${sessionId}/records`,
      method: 'POST',
      data,
    });
  },

  submitFeedback(recordId: string, rating: QAFeedbackRating): Promise<QARecord> {
    return mutator({
      url: `/api/v1/qa/records/${recordId}/feedback`,
      method: 'POST',
      data: { rating },
    });
  },
};
