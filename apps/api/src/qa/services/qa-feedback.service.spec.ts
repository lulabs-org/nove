import { QAFeedbackRating } from '@/generated/prisma/client';
import { NotFoundException } from '@nestjs/common';
import { QARecordRepository } from '../repositories';
import { QAFeedbackService } from './qa-feedback.service';

describe('QAFeedbackService', () => {
  let service: QAFeedbackService;
  let records: { findById: jest.Mock; updateFeedback: jest.Mock };

  beforeEach(() => {
    records = { findById: jest.fn(), updateFeedback: jest.fn() };
    service = new QAFeedbackService(records as unknown as QARecordRepository);
  });

  it('rejects feedback for a record outside the organization', async () => {
    records.findById.mockResolvedValue(null);

    await expect(
      service.submit('org-1', 'record-2', {
        rating: QAFeedbackRating.LIKE,
      }),
    ).rejects.toThrow(NotFoundException);
    expect(records.updateFeedback).not.toHaveBeenCalled();
  });

  it('trims optional feedback text before saving', async () => {
    records.findById.mockResolvedValue({ id: 'record-1' });
    records.updateFeedback.mockResolvedValue({ id: 'record-1' });

    await service.submit('org-1', 'record-1', {
      rating: QAFeedbackRating.DISLIKE,
      reason: ' inaccurate ',
      comment: ' missing context ',
    });

    expect(records.updateFeedback).toHaveBeenCalledWith('record-1', 'org-1', {
      rating: QAFeedbackRating.DISLIKE,
      feedbackReason: 'inaccurate',
      feedbackComment: 'missing context',
    });
  });

  it('stores blank optional feedback as null', async () => {
    records.findById.mockResolvedValue({ id: 'record-1' });
    records.updateFeedback.mockResolvedValue({ id: 'record-1' });

    await service.submit('org-1', 'record-1', {
      rating: QAFeedbackRating.LIKE,
      reason: '  ',
    });

    expect(records.updateFeedback).toHaveBeenCalledWith(
      'record-1',
      'org-1',
      expect.objectContaining({
        feedbackReason: null,
        feedbackComment: null,
      }),
    );
  });

  it('clears an existing feedback rating', async () => {
    records.findById.mockResolvedValue({ id: 'record-1' });
    records.updateFeedback.mockResolvedValue({ id: 'record-1', rating: null });

    await service.submit('org-1', 'record-1', { rating: null });

    expect(records.updateFeedback).toHaveBeenCalledWith('record-1', 'org-1', {
      rating: null,
      feedbackReason: null,
      feedbackComment: null,
    });
  });
});
