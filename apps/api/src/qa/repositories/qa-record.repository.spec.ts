import { PrismaService } from '@/prisma/prisma.service';
import { QARecordRepository } from './qa-record.repository';

describe('QARecordRepository', () => {
  const tx = {
    qASession: { update: jest.fn() },
    qARecord: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirstOrThrow: jest.fn(),
    },
  };
  const transaction = jest.fn();
  let repository: QARecordRepository;
  beforeEach(() => {
    jest.resetAllMocks();
    transaction.mockImplementation((run: (client: typeof tx) => unknown) =>
      run(tx),
    );
    tx.qARecord.findFirstOrThrow.mockResolvedValue({ sessionId: 'session-1' });
    repository = new QARecordRepository({
      $transaction: transaction,
    } as unknown as PrismaService);
  });

  it('writes content, citations and dataset timestamp in the same transaction', async () => {
    await repository.create('org-1', {
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
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(tx.qASession.update).toHaveBeenCalledWith({
      where: { id: 'session-1', orgId: 'org-1', deletedAt: null },
      data: { updatedAt: expect.any(Date) as Date },
    });
    expect(tx.qARecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          question: 'Question?',
          answer: 'Answer.',
          citations: {
            create: [
              expect.objectContaining({
                sourceType: 'transcript',
                sourceId: 'minute-1',
                snippet: 'source text',
              }),
            ],
          },
        }) as unknown,
      }),
    );
  });

  it('rejects a deleted or foreign destination before writing any content', async () => {
    tx.qASession.update.mockRejectedValue(new Error('dataset unavailable'));
    await expect(
      repository.create('org-1', {
        sessionId: 'foreign',
        question: 'Q',
        answer: 'A',
      }),
    ).rejects.toThrow('dataset unavailable');
    expect(tx.qARecord.create).not.toHaveBeenCalled();
  });

  it('uses one transaction for a batch and propagates a write failure for rollback', async () => {
    tx.qARecord.create
      .mockResolvedValueOnce({ id: 'record-1' })
      .mockRejectedValueOnce(new Error('write failed'));
    await expect(
      repository.createBatch('org-1', [
        { sessionId: 'session-1', question: 'Q1', answer: 'A1' },
        { sessionId: 'session-1', question: 'Q2', answer: 'A2' },
      ]),
    ).rejects.toThrow('write failed');
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(tx.qASession.update).toHaveBeenCalledTimes(1);
  });

  it('updates both datasets when moving content, with deterministic lock order', async () => {
    tx.qARecord.findFirstOrThrow.mockResolvedValue({ sessionId: 'session-2' });
    await repository.update('record-1', 'org-1', { sessionId: 'session-1' });
    expect(tx.qARecord.findFirstOrThrow).toHaveBeenCalledWith({
      where: { id: 'record-1', session: { orgId: 'org-1', deletedAt: null } },
      select: { sessionId: true },
    });
    expect(tx.qASession.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: 'session-1', orgId: 'org-1', deletedAt: null },
      }),
    );
    expect(tx.qASession.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: 'session-2', orgId: 'org-1', deletedAt: null },
      }),
    );
    expect(tx.qARecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'record-1', session: { orgId: 'org-1', deletedAt: null } },
        data: { session: { connect: { id: 'session-1' } } },
      }),
    );
  });

  it('refreshes the dataset timestamp when deleting a record', async () => {
    await repository.delete('record-1', 'org-1');
    expect(tx.qASession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'session-1', orgId: 'org-1', deletedAt: null },
      }),
    );
    expect(tx.qARecord.delete).toHaveBeenCalledWith({
      where: { id: 'record-1', session: { orgId: 'org-1', deletedAt: null } },
    });
  });
});
