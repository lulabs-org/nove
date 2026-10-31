import { MinuteService } from '@/minute/services/minute.service';
import { NotFoundException } from '@nestjs/common';
import { QARecordRepository, QASessionRepository } from '../repositories';
import { QARecordService } from './qa-record.service';

describe('QARecordService', () => {
  let service: QARecordService;
  let records: {
    create: jest.Mock;
    createBatch: jest.Mock;
    findMany: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let sessions: { findById: jest.Mock };
  let minuteService: { getById: jest.Mock };

  beforeEach(() => {
    records = {
      create: jest.fn(),
      createBatch: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    sessions = { findById: jest.fn() };
    minuteService = { getById: jest.fn() };
    service = new QARecordService(
      records as unknown as QARecordRepository,
      sessions as unknown as QASessionRepository,
      minuteService as unknown as MinuteService,
    );
  });

  it('creates a record only after finding its session in the organization', async () => {
    sessions.findById.mockResolvedValue({ id: 'session-1' });
    records.create.mockResolvedValue({ id: 'record-1' });

    await service.create('org-1', 'session-1', {
      question: 'What happened?',
      answer: 'A decision was made.',
    });

    expect(sessions.findById).toHaveBeenCalledWith('session-1', 'org-1');
    expect(records.create).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 'session-1' }),
    );
  });

  it('rejects a batch when any session is outside the organization', async () => {
    sessions.findById
      .mockResolvedValueOnce({ id: 'session-1' })
      .mockResolvedValueOnce(null);

    await expect(
      service.createBatch('org-1', {
        records: [
          { sessionId: 'session-1', question: 'Q1', answer: 'A1' },
          { sessionId: 'session-2', question: 'Q2', answer: 'A2' },
        ],
      }),
    ).rejects.toThrow(NotFoundException);
    expect(records.createBatch).not.toHaveBeenCalled();
  });

  it('writes a validated batch in one repository operation', async () => {
    sessions.findById.mockResolvedValue({ id: 'session-1' });
    records.createBatch.mockResolvedValue([{ id: 'record-1' }]);
    const batch = {
      records: [
        { sessionId: 'session-1', question: 'Q1', answer: 'A1' },
        { sessionId: 'session-1', question: 'Q2', answer: 'A2' },
      ],
    };

    await service.createBatch('org-1', batch);

    expect(sessions.findById).toHaveBeenCalledTimes(1);
    expect(records.createBatch).toHaveBeenCalledWith(batch.records);
  });

  it('passes trimmed filters and pagination to global record search', async () => {
    records.findMany.mockResolvedValue({ items: [], total: 3 });

    const result = await service.findAll('org-1', {
      page: 2,
      pageSize: 2,
      keyword: ' decision ',
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-31T00:00:00.000Z',
    });

    expect(records.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: 'org-1',
        skip: 2,
        take: 2,
        keyword: 'decision',
        from: new Date('2026-01-01T00:00:00.000Z'),
        to: new Date('2026-01-31T00:00:00.000Z'),
      }),
    );
    expect(result.totalPages).toBe(2);
  });

  it('validates minute ownership and applies the minute shortcut filter', async () => {
    minuteService.getById.mockResolvedValue({ id: 'minute-1' });
    records.findMany.mockResolvedValue({ items: [], total: 0 });

    await service.findByMinute('org-1', 'minute-1', {});

    expect(minuteService.getById).toHaveBeenCalledWith('minute-1', 'org-1');
    expect(records.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: 'org-1', minuteId: 'minute-1' }),
    );
  });

  it('updates a record only when it belongs to the organization', async () => {
    records.findById.mockResolvedValue({ id: 'record-1' });
    records.update.mockResolvedValue({ id: 'record-1' });

    await service.update('org-1', 'record-1', {
      question: 'Updated question',
    });

    expect(records.findById).toHaveBeenCalledWith('record-1', 'org-1');
    expect(records.update).toHaveBeenCalledWith('record-1', 'org-1', {
      question: 'Updated question',
    });
  });

  it('rejects deleting a record from another organization', async () => {
    records.findById.mockResolvedValue(null);

    await expect(service.delete('org-1', 'record-2')).rejects.toThrow(
      NotFoundException,
    );
    expect(records.delete).not.toHaveBeenCalled();
  });

  it('deletes a record in the current organization', async () => {
    records.findById.mockResolvedValue({ id: 'record-1' });

    await service.delete('org-1', 'record-1');

    expect(records.delete).toHaveBeenCalledWith('record-1', 'org-1');
  });
});
