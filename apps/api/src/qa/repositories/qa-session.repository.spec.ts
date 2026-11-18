import { PrismaService } from '@/prisma/prisma.service';
import { QASessionRepository } from './qa-session.repository';

describe('Organization shared datasets', () => {
  const sessions = {
    count: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  };
  let repository: QASessionRepository;
  beforeEach(() => {
    jest.resetAllMocks();
    repository = new QASessionRepository({
      qASession: sessions,
      $transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
    } as unknown as PrismaService);
  });

  it('paginates and searches across creators while excluding other organizations and deleted datasets', async () => {
    sessions.count.mockResolvedValue(101);
    sessions.findMany.mockResolvedValue([
      { id: 'dataset', userId: 'another-creator' },
    ]);
    const result = await repository.findMany({
      orgId: 'org-1',
      skip: 100,
      take: 20,
      keyword: 'Guide',
    });
    expect(sessions.findMany).toHaveBeenCalledWith({
      where: {
        orgId: 'org-1',
        deletedAt: null,
        title: { contains: 'Guide', mode: 'insensitive' },
      },
      skip: 100,
      take: 20,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    expect(result).toEqual({
      total: 101,
      items: [{ id: 'dataset', userId: 'another-creator' }],
    });
  });

  it('reads metadata without loading the entire knowledge base', async () => {
    await repository.findMetadata('dataset', 'org-1');
    expect(sessions.findFirst).toHaveBeenCalledWith({
      where: { id: 'dataset', orgId: 'org-1', deletedAt: null },
    });
  });

  it('scopes detail, rename and soft delete to the organization, not the creator', async () => {
    await repository.findById('dataset', 'org-1');
    await repository.update('dataset', 'org-1', { title: 'Shared guide' });
    await repository.softDelete('dataset', 'org-1');
    const where = { id: 'dataset', orgId: 'org-1', deletedAt: null };
    expect(sessions.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where }),
    );
    expect(sessions.update).toHaveBeenCalledWith({
      where,
      data: { title: 'Shared guide' },
    });
    expect(sessions.update).toHaveBeenCalledWith({
      where,
      data: { deletedAt: expect.any(Date) as Date },
    });
  });
});
