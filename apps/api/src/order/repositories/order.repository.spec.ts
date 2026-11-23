import { PrismaService } from '@/prisma/prisma.service';
import { OrderRepository } from './order.repository';

describe('OrderRepository tag writes', () => {
  const tx = {
    orderTag: { createMany: jest.fn<unknown, [unknown]>() },
    order: {
      create: jest.fn<unknown, [unknown]>(),
      update: jest.fn<unknown, [unknown]>(),
    },
  };
  const prisma = {
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  };
  const repository = new OrderRepository(prisma as unknown as PrismaService);

  beforeEach(() => jest.clearAllMocks());

  const insertedNames = () =>
    (
      tx.orderTag.createMany.mock.calls[0][0] as {
        data: { name: string }[];
      }
    ).data.map((row) => row.name);

  const linkedNames = (call: unknown[]) =>
    (
      call[0] as {
        data: {
          tagLinks: {
            create: { position: number; tag: { connect: { name: string } } }[];
          };
        };
      }
    ).data.tagLinks.create.map((link) => [
      link.position,
      link.tag.connect.name,
    ]);

  it('inserts new dictionary entries in a canonical order on create', async () => {
    await repository.create({ orderCode: 'c', orderNumber: 'n', amount: 1 }, [
      '乙',
      'B',
      '甲',
      'A',
    ]);

    expect(insertedNames()).toEqual(['A', 'B', '乙', '甲'].sort());
    expect(tx.orderTag.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
    expect(linkedNames(tx.order.create.mock.calls[0])).toEqual([
      [0, '乙'],
      [1, 'B'],
      [2, '甲'],
      [3, 'A'],
    ]);
  });

  it('inserts new dictionary entries in a canonical order on update', async () => {
    await repository.update('order-1', {}, ['B', 'A']);

    expect(insertedNames()).toEqual(['A', 'B']);
    expect(linkedNames(tx.order.update.mock.calls[0])).toEqual([
      [0, 'B'],
      [1, 'A'],
    ]);
  });

  it('produces the same insert order regardless of input order', async () => {
    await repository.create({ orderCode: 'c1', orderNumber: 'n1', amount: 1 }, [
      'A',
      'B',
    ]);
    const first = insertedNames();
    jest.clearAllMocks();

    await repository.create({ orderCode: 'c2', orderNumber: 'n2', amount: 1 }, [
      'B',
      'A',
    ]);

    expect(insertedNames()).toEqual(first);
  });
});
