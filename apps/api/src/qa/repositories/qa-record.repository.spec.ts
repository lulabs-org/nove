/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaService } from '@/prisma/prisma.service';
import { QARecordRepository } from './qa-record.repository';

describe('QARecordRepository', () => {
  let repository: QARecordRepository;
  let prisma: {
    qARecord: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      qARecord: { create: jest.fn() },
      $transaction: jest.fn(),
    };
    repository = new QARecordRepository(prisma as unknown as PrismaService);
  });

  it('creates a record and its citations as one nested write', async () => {
    prisma.qARecord.create.mockResolvedValue({ id: 'record-1' });

    await repository.create({
      sessionId: 'session-1',
      question: ' Question? ',
      answer: ' Answer. ',
      citations: [
        {
          sourceType: ' transcript ',
          sourceId: ' minute-1 ',
          snippet: ' source text ',
        },
      ],
    });

    expect(prisma.qARecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        question: 'Question?',
        answer: 'Answer.',
        session: { connect: { id: 'session-1' } },
        citations: {
          create: [
            expect.objectContaining({
              sourceType: 'transcript',
              sourceId: 'minute-1',
              snippet: 'source text',
            }),
          ],
        },
      }),
      include: { citations: true },
    });
  });

  it('uses one transaction for the whole batch and propagates rollback errors', async () => {
    prisma.qARecord.create
      .mockReturnValueOnce({ operation: 1 })
      .mockReturnValueOnce({ operation: 2 });
    prisma.$transaction.mockRejectedValue(new Error('transaction rolled back'));

    await expect(
      repository.createBatch([
        { sessionId: 'session-1', question: 'Q1', answer: 'A1' },
        { sessionId: 'session-1', question: 'Q2', answer: 'A2' },
      ]),
    ).rejects.toThrow('transaction rolled back');
    expect(prisma.$transaction).toHaveBeenCalledWith([
      { operation: 1 },
      { operation: 2 },
    ]);
  });
});
